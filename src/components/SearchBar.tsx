type Props = {
    onSearchInput: (e: Event) => void;
    query: () => string;
    setQuery: (value: string) => void;
    placeholderText: string;
};

export default function SearchBar({ onSearchInput, query, setQuery, placeholderText }: Props) {
    return (<div class="relative">
        <svg class="absolute size-6 left-2 top-[0.45rem] pointer-events-none" style="stroke: var(--faint);">
            <use href={`/ui.svg#search`} />
        </svg>
        <input
            name="search"
            type="text"
            value={query()}
            onInput={onSearchInput}
            autocomplete="off"
            spellcheck={false}
            placeholder={placeholderText}
            class="w-full rounded outline-none"
            style="padding: 10px 40px; background: var(--card); border: 1px solid var(--line); color: var(--ink); font-size: 15px;"
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
        {query().length > 0 && (
            <button
                onClick={() => setQuery("")}
                class="absolute flex justify-center items-center h-full w-10 right-0 top-0"
                style="stroke: var(--faint);"
                aria-label="Clear search"
            >
                <svg class="size-5">
                    <use href={`/ui.svg#x`} />
                </svg>
            </button>
        )}
    </div>)
}
