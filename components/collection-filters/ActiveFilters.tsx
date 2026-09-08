import { IconClose } from "../icons";
import styles from "../CollectionFilters.module.css";

export interface ActiveFilter {
  id: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

export function ActiveFilters({
  filters,
  onClear,
}: {
  filters: ActiveFilter[];
  onClear: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className={styles.activeFilters} aria-label="Selected filters">
      <button type="button" onClick={onClear} className={styles.clearAll}>
        Clear all
      </button>
      {filters.map(({ id, label, removeLabel, onRemove }) => (
        <button
          type="button"
          key={id}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          {label}
          <IconClose />
        </button>
      ))}
    </div>
  );
}
