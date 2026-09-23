import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"
import fs from "node:fs"
import path from "node:path"

// Build a map of content URL path -> frontmatter date, so the sitemap
// can emit <lastmod> from the content's own date field.
const CONTENT_ROOT = new URL("./src/content/", import.meta.url)
const lastmodByPath = (() => {
  const map = new Map()
  for (const coll of ["research", "projects"]) {
    const dir = path.join(CONTENT_ROOT.pathname, coll)
    if (!fs.existsSync(dir)) continue
    for (const slug of fs.readdirSync(dir)) {
      const fm = path.join(dir, slug, "index.md")
      if (!fs.existsSync(fm)) continue
      const text = fs.readFileSync(fm, "utf8")
      const m = text.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)
      if (m) map.set(`/${coll}/${slug}/`, m[1])
    }
  }
  return map
})()

// https://astro.build/config
export default defineConfig({
  site: "https://abdulmalikajisegiri.com",
  integrations: [mdx(), sitemap({
    serialize(item) {
      const d = lastmodByPath.get(new URL(item.url).pathname)
      if (d) item.lastmod = d
      return item
    },
  }), solidJs(), tailwind({ applyBaseStyles: false })],
})