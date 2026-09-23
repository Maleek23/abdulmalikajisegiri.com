import type { CollectionEntry } from "astro:content"
import { createEffect, createSignal, For, onMount, Show } from "solid-js"
import Fuse from "fuse.js"
import { cn, formatDate } from "@lib/utils"
import SearchBar from "@components/SearchBar"

type Props = {
  entry_name: string
  tags: string[]
  data: CollectionEntry<"research">[] | CollectionEntry<'projects'>[]
}

type Entry = CollectionEntry<"research">

function readMinutes(body: string) {
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

function metaLine(entry: Entry) {
  const tags = entry.data.tags.slice(0, 3).join(" · ").toUpperCase()
  return `${formatDate(entry.data.date).toUpperCase()} · ${readMinutes(entry.body)} MIN READ${tags ? ` · ${tags}` : ""}`
}

export default function SearchCollection({ entry_name, data, tags }: Props) {
  const coerced = data.map((entry) => entry as Entry);
  const featured = coerced[0]
  const isProjects = entry_name === "projects"

  const [query, setQuery] = createSignal("");
  const [filter, setFilter] = createSignal(new Set<string>())
  const [asc, setAsc] = createSignal(false);

  const fuse = new Fuse(coerced, {
    keys: ["slug", "data.title", "data.summary", "data.tags"],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.4,
  })

  const showFeatured = () => query().length < 2 && filter().size === 0

  function computeCollection(): Entry[] {
    const filtered = (query().length < 2
      ? coerced
      : fuse.search(query()).map((result) => result.item)
    ).filter((entry) =>
      Array.from(filter()).every((value) =>
        entry.data.tags.some((tag: string) =>
          tag.toLowerCase() === String(value).toLowerCase()
        )
      )
    );
    // The featured entry gets the big card on top; don't repeat it in the index.
    const withoutFeatured = showFeatured() && featured
      ? filtered.filter((entry) => entry.slug !== featured.slug)
      : filtered
    return asc() ? withoutFeatured.toReversed() : withoutFeatured
  }

  // Seed with the computed value so rows render in SSR, not just after hydration.
  const [collection, setCollection] = createSignal<Entry[]>(computeCollection())

  createEffect(() => {
    setCollection(computeCollection())
  })

  function toggleAsc() {
    setAsc(!asc())
  }

  function toggleTag(tag: string) {
    setFilter((prev) =>
      new Set(prev.has(tag)
        ? [...prev].filter((t) => t !== tag)
        : [...prev, tag]
      )
    )
  }

  function clearFilters() {
    setFilter(new Set<string>());
  }

  function surpriseMe() {
    const pick = coerced[Math.floor(Math.random() * coerced.length)]
    if (pick) window.location.href = `/${pick.collection}/${pick.slug}`
  }

  const onSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setQuery(target.value)
  }

  onMount(() => {
    const wrapper = document.getElementById("search-collection-wrapper");
    if (wrapper) {
      wrapper.style.minHeight = "unset";
    }
  })

  return (
    <div>
      {/* Featured — most recent entry, hidden while searching/filtering */}
      <Show when={showFeatured() && featured}>
        <a href={`/${featured.collection}/${featured.slug}`} class="feat-card">
          <div class="feat-text">
            <div class="kicker">{isProjects ? "FEATURED PROJECT" : "FEATURED NOTE"}</div>
            <h2>{featured.data.title}</h2>
            <p>{featured.data.summary}</p>
            <div class="feat-meta">{metaLine(featured)}</div>
            <span class="note-link">{isProjects ? "Read the case study" : "Read the note"} &rarr;</span>
          </div>
          {featured.data.image && (
            <div class="feat-img">
              <img src={featured.data.image} alt={featured.data.title} loading="eager" />
            </div>
          )}
        </a>
      </Show>

      {/* Controls */}
      <div class="lib-controls">
        <SearchBar onSearchInput={onSearchInput} query={query} setQuery={setQuery} placeholderText={`Search ${entry_name}`} />
        <div class="lib-tagrow" role="group" aria-label="Filter by tag">
          <For each={tags}>
            {(tag) => (
              <button
                onClick={() => toggleTag(tag)}
                aria-pressed={filter().has(tag)}
                class={cn("tag-pill", filter().has(tag) && "tag-pill-active")}
              >
                {tag.toUpperCase()}
              </button>
            )}
          </For>
          {filter().size > 0 && (
            <button onClick={clearFilters} class="tag-clear">
              CLEAR ✕
            </button>
          )}
        </div>
        <div class="lib-infobar">
          <span class="lib-count">
            SHOWING {collection().length} OF {data.length} {entry_name.toUpperCase()}
          </span>
          <div class="lib-actions">
            <button onClick={surpriseMe} class="btn-surprise" title="Open a random entry">
              🎲 SURPRISE ME
            </button>
            <button onClick={toggleAsc} class="btn-sort" title="Toggle sort order">
              {asc() ? "OLDEST FIRST" : "NEWEST FIRST"}
              <svg class="btn-sort-icon" aria-hidden="true">
                <use href={`/ui.svg#sort-descending`} class={asc() ? "hidden" : "block"} />
                <use href={`/ui.svg#sort-ascending`} class={asc() ? "block" : "hidden"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Compact index rows */}
      <ul class="lib-index">
        <For each={collection()}>
          {(entry) => (
            <li>
              <a href={`/${entry.collection}/${entry.slug}`} class="lib-row">
                <div class="lib-row-main">
                  <h3>{entry.data.title}</h3>
                  <div class="lib-row-meta">{metaLine(entry)}</div>
                </div>
                <span class="lib-row-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </li>
          )}
        </For>
      </ul>

      <Show when={collection().length === 0}>
        <div class="lib-empty">
          <p class="kicker">NOTHING FOUND</p>
          <p>No {entry_name} match that combination. Try a different search or clear the filters.</p>
          <button onClick={() => { setQuery(""); clearFilters(); }} class="btn-ghost" style="margin-top:18px;">
            Clear search &amp; filters
          </button>
        </div>
      </Show>
    </div>
  )
}
