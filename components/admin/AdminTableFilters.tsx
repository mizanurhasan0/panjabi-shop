"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AdminIcon } from "./ui";
import { adminStyles } from "./styles";

/** Inline on desktop; an overlay on small screens leaves room for table rows. */
export function AdminTableFilters({
  children,
  activeCount = 0,
  label = "Filters",
  compact = false,
  className = "",
}: {
  children: (close: () => void) => ReactNode;
  activeCount?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <div
      ref={root}
      className={`relative min-w-0 ${className}`}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          close();
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`${adminStyles.buttonSecondary} w-full min-[642px]:hidden ${compact ? "size-11 px-2!" : ""} ${activeCount > 0 ? "border-[#dbc393]! bg-admin-accent-soft! text-[#8b682f]!" : ""}`}
        aria-label={`${label}${activeCount > 0 ? ` (${activeCount})` : ""}`}
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <AdminIcon name="filter" size={16} />
        <span className={compact ? "sr-only" : ""}>
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        {!compact && (
          <AdminIcon
            name="chevron"
            size={13}
            className={`ml-auto transition-transform motion-reduce:transition-none ${open ? "-rotate-90" : "rotate-90"}`}
          />
        )}
      </button>
      <div
        id={id}
        className={`${open ? "max-[641px]:block" : "max-[641px]:hidden"} max-[641px]:absolute max-[641px]:inset-x-0 max-[641px]:top-full max-[641px]:z-20 max-[641px]:mt-2 max-[641px]:max-h-[min(60dvh,380px)] max-[641px]:overflow-y-auto max-[641px]:overscroll-contain max-[641px]:rounded-xl max-[641px]:border max-[641px]:border-admin-line max-[641px]:bg-white max-[641px]:p-4 max-[641px]:shadow-xl`}
      >
        <div className="mb-3 hidden items-center justify-between max-[641px]:flex">
          <strong className="text-xs font-medium">{label}</strong>
          <button
            type="button"
            onClick={() => {
              close();
              trigger.current?.focus();
            }}
            aria-label="Close filters"
            className="inline-flex size-9 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-bg"
          >
            <AdminIcon name="close" size={16} />
          </button>
        </div>
        {children(close)}
      </div>
    </div>
  );
}
