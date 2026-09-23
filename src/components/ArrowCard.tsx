import { formatDate, truncateText } from "@lib/utils"
import type { CollectionEntry } from "astro:content"

type Props = {
  entry: CollectionEntry<"research"> | CollectionEntry<"projects">
  pill?: boolean
}

export default function ArrowCard({ entry, pill }: Props) {
  return (
    <a href={`/${entry.collection}/${entry.slug}`} class="note-card arrow-card group">
      <div class="arrow-card-main">
        <div class="note-meta arrow-card-meta">
          <span class="arrow-card-tags">
            {pill && (
              <span class="pill arrow-pill">
                {entry.collection === "research" ? "NOTE" : "CASE STUDY"}
              </span>
            )}
            <span>{formatDate(entry.data.date).toUpperCase()}</span>
          </span>
        </div>
        <h3 class="arrow-card-title">{entry.data.title}</h3>
        <p class="line-clamp-2">{entry.data.summary}</p>
        <ul class="arrow-card-taglist">
          {entry.data.tags.map((tag: string) => (
            <li class="pill arrow-pill">
              {truncateText(tag, 20).toUpperCase()}
            </li>
          ))}
        </ul>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="arrow-card-arrow" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </a>
  )
}
