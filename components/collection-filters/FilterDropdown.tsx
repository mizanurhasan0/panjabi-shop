import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconChevronDown } from "../icons";
import styles from "../CollectionFilters.module.css";

export function FilterDropdown({
  label,
  children,
  sort = false,
}: {
  label: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  sort?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className={`${styles.dropdown} ${sort ? styles.sortDropdown : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        className={styles.dropdownTrigger}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <IconChevronDown />
      </button>
      {open && (
        <div id={id} className={styles.dropdownContent}>
          {typeof children === "function"
            ? children(() => {
                setOpen(false);
                document.getElementById(`${id}-trigger`)?.focus();
              })
            : children}
        </div>
      )}
    </div>
  );
}
