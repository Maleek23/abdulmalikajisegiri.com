#!/usr/bin/env python3
"""Bundle the 26-page Astro dist/ into a single index.html + assets/ for the
artifact preview runtime (which only serves one root index plus assets).

Preserves ALL content: every page's <main> becomes a <template>, a small
router swaps pages client-side. No content is rewritten or condensed.
"""
import re, os, shutil, hashlib, html as htmlmod

DIST = os.path.expanduser("~/workspace/identity-hub/dist")
OUT = os.path.expanduser("~/workspace/identity-hub/preview-bundle")
ASSETS = os.path.join(OUT, "assets")

PAGES = [
    ("index.html", "/"),
    ("about/index.html", "/about/"),
    ("engineering/index.html", "/engineering/"),
    ("systems-engineering/index.html", "/systems-engineering/"),
    ("model-risk/index.html", "/model-risk/"),
    ("ai-ml/index.html", "/ai-ml/"),
    ("mbse/index.html", "/mbse/"),
    ("projects/index.html", "/projects/"),
    ("projects/model-validation-framework/index.html", "/projects/model-validation-framework/"),
    ("projects/mbse-toolkit/index.html", "/projects/mbse-toolkit/"),
    ("projects/optimization-engine/index.html", "/projects/optimization-engine/"),
    ("projects/ml-validation-toolkit/index.html", "/projects/ml-validation-toolkit/"),
    ("projects/market-data-engine/index.html", "/projects/market-data-engine/"),
    ("projects/monte-carlo-risk-engine/index.html", "/projects/monte-carlo-risk-engine/"),
    ("research/index.html", "/research/"),
    ("research/conceptual-soundness-model-validation/index.html", "/research/conceptual-soundness-model-validation/"),
    ("research/ml-model-validation-framework/index.html", "/research/ml-model-validation-framework/"),
    ("research/sr-11-7-ai-ml-model-risk/index.html", "/research/sr-11-7-ai-ml-model-risk/"),
    ("quant/index.html", "/quant/"),
    ("photography/index.html", "/photography/"),
    ("resume/index.html", "/resume/"),
    ("contact/index.html", "/contact/"),
    ("now/index.html", "/now/"),
    ("search/index.html", "/search/"),
    ("legal/privacy/index.html", "/legal/privacy/"),
    ("legal/terms/index.html", "/legal/terms/"),
]

def read(p):
    with open(os.path.join(DIST, p), encoding="utf-8") as f:
        return f.read()

def extract_main(h):
    m = re.search(r"<main>(.*?)</main>", h, re.S)
    assert m, "no <main> found"
    return m.group(1)

def extract_title(h):
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    return htmlmod.unescape(m.group(1)) if m else ""

def extract_desc(h):
    m = re.search(r'<meta name="description" content="((?:[^"\\]|\\.)*)"', h)
    return htmlmod.unescape(m.group(1)) if m else ""

def rewrite_assets(s):
    # root-level asset refs -> assets/...
    s = s.replace('href="/_astro/', 'href="assets/_astro/')
    s = s.replace('src="/_astro/', 'src="assets/_astro/')
    s = s.replace('"/_astro/', '"assets/_astro/')
    for svg in ["ui.svg", "copy.svg", "brand.svg", "social.svg", "stack.svg", "favicon.svg"]:
        s = s.replace(f'"/{svg}', f'"assets/{svg}')
        s = s.replace(f"'/{svg}", f"'assets/{svg}")
        s = s.replace(f"url(/{svg}", f"url(assets/{svg}")
        s = s.replace(f'href=/{svg}', f'href=assets/{svg}')
    return s

# ---- gather page data ----
pages = []
for rel, route in PAGES:
    h = read(rel)
    pages.append({
        "rel": rel, "route": route,
        "title": extract_title(h),
        "desc": extract_desc(h),
        "main": extract_main(h),
        "head": re.search(r"<head>(.*?)</head>", h, re.S).group(1),
    })

home = pages[0]

# ---- verify shared shell is identical across pages ----
def shell_of(h):
    # everything outside <main>...</main>
    return re.sub(r"<main>.*?</main>", "<main></main>", h, flags=re.S)

shells = {}
for p in pages:
    h = read(p["rel"])
    # normalize per-page head bits (title/desc/canonical/og) before comparing
    s = shell_of(h)
    s = re.sub(r"<title>.*?</title>", "", s, flags=re.S)
    s = re.sub(r'<meta name="description"[^>]*>', "", s)
    s = re.sub(r'<meta name="title"[^>]*>', "", s)
    s = re.sub(r'<link rel="canonical"[^>]*>', "", s)
    s = re.sub(r'<meta property="og:(url|title|description|image)"[^>]*>', "", s)
    s = re.sub(r'<meta property="twitter:(url|title|description|image)"[^>]*>', "", s)
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', "", s, flags=re.S)
    # module script src differs per page (page-specific hoisted bundle)
    s = re.sub(r'<script type="module" src="[^"]*"></script>', "", s)
    shells.setdefault(hashlib.md5(s.encode()).hexdigest(), []).append(p["rel"])
print("distinct shells:", len(shells))
for k, v in shells.items():
    print("  ", len(v), "pages:", ", ".join(v[:4]), "..." if len(v) > 4 else "")

# ---- hoist island runtime inline scripts (deduped) ----
# Home (pages[0]) is skipped: its inline scripts already run live in the
# initial <main>. Hoisting them too would execute them twice (e.g. two
# twinkle-star intervals).
island_scripts = []
seen = set()
for p in pages[1:]:
    for s in re.findall(r"<script(?![^>]*src)(?![^>]*ld\+json)[^>]*>.*?</script>", p["main"], re.S):
        # skip the home meteor script (it references .shower, page-specific decorative)
        if "meteor" in s:
            continue
        key = hashlib.md5(s.encode()).hexdigest()
        if key not in seen:
            seen.add(key)
            island_scripts.append(s)
print("hoisted island scripts:", len(island_scripts))

def strip_island_scripts(main):
    # remove island runtime scripts from templates (they're hoisted once globally).
    # also remove external /js/*.js tags (e.g. bg.js inside home's main): those
    # files are inlined once globally, so a copy left in a template would
    # double-load them and trip the asset-rewrite verification.
    main = re.sub(
        r"<script(?![^>]*src)(?![^>]*ld\+json)[^>]*>.*?</script>", "", main, flags=re.S
    )
    main = re.sub(r'<script[^>]*src="/js/[^"]*"[^>]*>\s*</script>', "", main)
    return main

# ---- build assets ----
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(os.path.join(ASSETS, "_astro"))
os.makedirs(os.path.join(ASSETS, "fonts"))
for f in os.listdir(os.path.join(DIST, "_astro")):
    if f.endswith(".js"):
        shutil.copy(os.path.join(DIST, "_astro", f), os.path.join(ASSETS, "_astro", f))
for f in os.listdir(os.path.join(DIST, "fonts")):
    shutil.copy(os.path.join(DIST, "fonts", f), os.path.join(ASSETS, "fonts", f))
for f in os.listdir(DIST):
    if f.endswith(".svg"):
        shutil.copy(os.path.join(DIST, f), os.path.join(ASSETS, f))

# ---- inline CSS ----
css = open(os.path.join(DIST, "_astro", [f for f in os.listdir(os.path.join(DIST, "_astro")) if f.endswith(".css")][0])).read()
css = css.replace("url(/fonts/", "url(assets/fonts/")
style_tag = "<style>\n" + css + "\n</style>"

# ---- inline small js ----
def inline_js(name, wrap_copy=False):
    src = open(os.path.join(DIST, "js", name), encoding="utf-8").read()
    if wrap_copy:
        src = src.replace("'/copy.svg#empty'", "'assets/copy.svg#empty'")
        src = src.replace('"/copy.svg#empty"', '"assets/copy.svg#empty"')
        src = src.replace("'/copy.svg#filled'", "'assets/copy.svg#filled'")
        src = src.replace('"/copy.svg#filled"', '"assets/copy.svg#filled"')
        # make it re-runnable on route changes
        src = ("window.__initCopyButtons=function(root){var r=root||document;"
               + re.sub(r"document\.querySelectorAll", "r.querySelectorAll", src, count=1)
               + "};window.__initCopyButtons();")
    return '<script>\n' + src + "\n</script>"

# ---- assemble shell from home ----
shell = read("index.html")

# head: inline css, rewrite asset refs, keep everything else (meta, JSON-LD, canonical)
head = re.search(r"<head>(.*?)</head>", shell, re.S).group(1)
head = rewrite_assets(head)
# font preloads -> assets
head = head.replace('href="/fonts/', 'href="assets/fonts/')
# drop the external stylesheet link (now inlined)
head = re.sub(r'<link rel="stylesheet"[^>]*>', "", head)
head = head.replace("</head>", "")  # we'll rebuild

# body scripts: replace /js/*.js with inline, /_astro module with assets path
body_scripts = []
for name in ["theme.js", "scroll.js", "animate.js", "bg.js"]:
    body_scripts.append(inline_js(name))
body_scripts.append(inline_js("copy.js", wrap_copy=True))

# island runtime scripts hoisted once
body_scripts.extend(island_scripts)

# figure out the module script for home -> convert to a classic inline script,
# because static renderers reject <script type="module">. The module only
# imports one hoisted chunk, so concatenate: chunk first, then module body.
m = re.search(r'<script type="module" src="([^"]+)"></script>', shell)
mod_path = m.group(1)  # e.g. /_astro/hoisted.fOzBosgT.js
mod_src = open(os.path.join(DIST, mod_path.lstrip("/")), encoding="utf-8").read()
imp = re.search(r'import"([^"]+)"', mod_src)
hoisted_extra = ""
if imp:
    extra_path = os.path.normpath(
        os.path.join(os.path.dirname(mod_path.lstrip("/")), imp.group(1)))
    hoisted_extra = open(os.path.join(DIST, extra_path), encoding="utf-8").read()
    mod_src = mod_src.replace(imp.group(0) + ";", "").replace(imp.group(0), "")
home_classic_script = ("<script>\n(function(){\n" + hoisted_extra
                       + "\n" + mod_src + "\n})();\n</script>")
# NOTE: the twinkle-star script is an inline script in home's <main>, not in
# the module above, so it is guarded separately on the live home main below.

# ---- templates for all pages (home included: its template is script-free, so
# cloning it never duplicates the meteor/twinkle timers, and the CSS meteor
# animations restart on clone while the twinkle interval keeps working) ----
def tpl_id(route):
    return "tpl-home" if route == "/" else "tpl-" + route.strip("/").replace("/", "-")

def js_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'

templates = []
routes_js = []
for p in pages:
    tid = tpl_id(p["route"])
    routes_js.append(
        f'    "{p["route"]}": {{"t": {js_str(p["title"])}, "d": {js_str(p["desc"])}, "id": "{tid}"}},'
    )
    main = rewrite_assets(strip_island_scripts(p["main"]))
    templates.append(f'<template id="{tid}">\n{main}\n</template>')

router = """<script>
(function(){
var ROUTES = {
%s
};
function norm(p){
  if(!p) return "/";
  p = p.split("?")[0].split("#")[0];
  if(!p.startsWith("/")) return null;
  if(p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if(p === "") p = "/";
  var key = p === "/" ? "/" : p + "/";
  return ROUTES[key] ? key : (ROUTES[p] ? p : null);
}
function closeDrawer(){
  var d = document.getElementById("drawer");
  var b = document.getElementById("header-drawer-button");
  if(d) d.classList.remove("open");
  if(b) b.classList.remove("open");
}
var HDR_INACTIVE = "h-8 rounded-full px-3 text-current flex items-center justify-center transition-colors duration-300 ease-in-out hover:bg-black/5 dark:hover:bg-white/20 hover:text-black dark:hover:text-white";
var HDR_ACTIVE = "h-8 rounded-full px-3 flex items-center justify-center transition-colors duration-300 ease-in-out bg-black dark:bg-white text-white dark:text-black";
var DRW_INACTIVE = "flex items-center justify-center px-3 py-1 rounded-full text-current hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/20 transition-colors duration-300 ease-in-out";
var DRW_ACTIVE = "flex items-center justify-center px-3 py-1 rounded-full hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/20 transition-colors duration-300 ease-in-out pointer-events-none bg-black dark:bg-white text-white dark:text-black";
function setActiveNav(path){
  var bare = path === "/" ? "/" : path.replace(/\/$/, "");
  function mark(links, inactive, active){
    links.forEach(function(a){
      var h = a.getAttribute("href");
      if(!h || h.charAt(0) !== "/" || h === "/") return;
      var hb = h.replace(/\/$/, "");
      var on = (bare === hb) || (bare.indexOf(hb + "/") === 0);
      if(a.className === inactive || a.className === active){
        a.className = on ? active : inactive;
      }
    });
  }
  var hdr = document.querySelector("#header nav");
  if(hdr) mark(Array.prototype.slice.call(hdr.querySelectorAll('a[href]')), HDR_INACTIVE, HDR_ACTIVE);
  var drw = document.getElementById("drawer");
  if(drw) mark(Array.prototype.slice.call(drw.querySelectorAll('a[href]')), DRW_INACTIVE, DRW_ACTIVE);
}
var currentPath = "/";
function render(path, push){
  var r = ROUTES[path];
  if(!r) return false;
  if(path === currentPath){ closeDrawer(); window.scrollTo(0, 0); return true; }
  currentPath = path;
  var tpl = document.getElementById(r.id);
  var main = document.querySelector("main");
  if(tpl && main){
    main.innerHTML = "";
    main.appendChild(tpl.content.cloneNode(true));
  }
  document.title = r.t;
  var md = document.querySelector('meta[name="description"]');
  if(md && r.d) md.setAttribute("content", r.d);
  setActiveNav(path);
  closeDrawer();
  if(push !== false){
    try{ history.replaceState(null, "", "#"+path); }catch(e){}
  }
  window.scrollTo(0, 0);
  document.dispatchEvent(new Event("astro:after-swap"));
  if(window.__initCopyButtons){ try{ window.__initCopyButtons(main); }catch(e){} }
  return true;
}
document.addEventListener("click", function(e){
  if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if(!a) return;
  var href = a.getAttribute("href");
  if(!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#") || a.target === "_blank") return;
  var key = norm(href);
  if(key){ e.preventDefault(); render(key); }
});
window.addEventListener("hashchange", function(){
  var h = location.hash.replace(/^#/, "") || "/";
  var key = norm(h);
  if(key) render(key, false);
});
// deep link on load
var init = norm(location.hash.replace(/^#/, "") || "/");
if(init && init !== "/"){ render(init, false); }
else { document.dispatchEvent(new Event("astro:after-swap")); if(window.__initCopyButtons){ try{ window.__initCopyButtons(document.querySelector("main")); }catch(e){} } }
})();
</script>""" % "\n".join(routes_js)

# ---- assemble final html ----
# take shell, replace head, replace module script, append templates+scripts before </body>
final = shell
# Guard the twinkle-star append in the live home <main> (its inline script runs
# once at load). #galaxy and #twinkle-star live inside home's <main>, so after
# navigating away the lookups miss; the guard keeps the single interval quiet
# off-home. Returning home re-renders #galaxy from the script-free template and
# twinkles resume — with no duplicate intervals.
n_twinkle = final.count('document.getElementById("galaxy").appendChild(twinkleStar);')
assert n_twinkle == 1, f"expected 1 twinkle append in live home main, found {n_twinkle}"
final = final.replace(
    'document.getElementById("galaxy").appendChild(twinkleStar);',
    'var __galaxy=document.getElementById("galaxy");'
    'if(__galaxy){__galaxy.appendChild(twinkleStar);}',
)
# the home module script tag lives in <head> and was already rewritten to
# assets/_astro/... above; convert it to the classic inline version here
head = head.replace(
    f'<script type="module" src="{m.group(1).replace("/_astro/", "assets/_astro/")}"></script>',
    home_classic_script,
)
final = re.sub(r"<head>.*?</head>", "<head>\n" + head + style_tag + "\n</head>", final, flags=re.S)
# rewrite remaining asset refs in body (svg uses etc.)
final = rewrite_assets(final)
# inject templates + scripts before </body>
injection = "\n".join(templates) + "\n" + "\n".join(body_scripts) + "\n" + router + "\n"
final = final.replace("</body>", injection + "</body>")
# remove the old external /js/*.js script tags (now inlined once globally).
# Runs after injection so copies inside templates are caught too; the regex
# handles any attribute order (e.g. defer before/after src).
final = re.sub(r'<script[^>]*src="/js/[^"]*"[^>]*>\s*</script>', "", final)

# home's main: strip island scripts not needed (home has none); keep meteor script live
out_html = os.path.join(OUT, "index.html")
with open(out_html, "w", encoding="utf-8") as f:
    f.write(final)

print("wrote", out_html, os.path.getsize(out_html), "bytes")
print("assets:", sum(len(fs) for _, _, fs in os.walk(ASSETS)), "files")

# ---- verification ----
errs = []
for p in pages:
    tid = tpl_id(p["route"])
    if f'id="{tid}"' not in final:
        errs.append("missing template " + tid)
# every internal href in rewritten templates must resolve to a route or be external/rss
routes = set(r for _, r in PAGES)
for p in pages:
    main = rewrite_assets(strip_island_scripts(p["main"]))
    for href in set(re.findall(r'href="(/[^"]*)"', main)):
        h = href.split("?")[0].split("#")[0]
        key = h if h == "/" else h.rstrip("/") + "/"
        if key not in routes and h not in ("/rss.xml",):
            errs.append(f"{p['route']}: unresolvable link {href}")
    # svg sprite fragment refs must be rewritten to assets/
    for frag in set(re.findall(r'href=(["\']?)(/[^"\'>\s]*\.svg#[^"\'>\s]*)', main)):
        errs.append(f"{p['route']}: unrewritten sprite ref {frag[1]}")
# asset refs all rewritten?
for bad in ['src="/_astro/', 'href="/_astro/', 'src="/js/', '"/ui.svg', "'/copy.svg", '"/fonts/']:
    if bad in final:
        errs.append("unrewritten asset ref: " + bad)
# static renderers reject module scripts outright
if 'type="module"' in final:
    errs.append("module script tag remains in final html")
# exactly one twinkle interval may exist (live home main); the home template
# must be script-free so re-rendering home never starts a second one
tw = final.count("setInterval(generateTwinkleStar")
if tw != 1:
    errs.append(f"twinkle interval count = {tw}, expected 1")
m_home = re.search(r'<template id="tpl-home">(.*?)</template>', final, re.S)
if not m_home:
    errs.append("tpl-home template missing")
elif "<script" in m_home.group(1):
    errs.append("tpl-home template contains a script tag")
if errs:
    print("ERRORS:")
    for e in errs[:20]:
        print("  -", e)
else:
    print("verification: OK — all routes embedded, all internal links resolve, assets rewritten")
