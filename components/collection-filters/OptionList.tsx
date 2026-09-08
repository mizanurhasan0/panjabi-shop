import { useState } from "react";
import { IconSearch } from "../icons";
import styles from "../CollectionFilters.module.css";

export function OptionList({
  counts,
  selected,
  onChange,
  searchable = false,
}: {
  counts: Record<string, number>;
  selected: string[];
  onChange?: (values: string[]) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const values = Object.keys(counts)
    .sort()
    .filter((value) => value.toLowerCase().includes(normalizedQuery));
  return (
    <div className={styles.optionList}>
      {searchable && (
        <label className={styles.optionSearch}>
          <IconSearch />
          <input
            type="search"
            placeholder="Search options"
            aria-label="Search size options"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      <div className={styles.options}>
        {values.map((value) => (
          <label key={value} className={styles.option}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) =>
                onChange?.(
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value),
                )
              }
            />
            <span>
              {value}
              <span className={styles.count}>({counts[value]})</span>
            </span>
          </label>
        ))}
        {values.length === 0 && (
          <p className={styles.noOptions}>No matching options</p>
        )}
      </div>
    </div>
  );
}

