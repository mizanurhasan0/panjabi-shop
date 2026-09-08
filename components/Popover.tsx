"use client";

import type { ReactNode, Ref } from "react";

/** Native light-dismiss dropdown: no backdrop, focus trap, or document scroll lock. */
export function Popover({
  id,
  label,
  children,
  className = "",
  onOpenChange,
  ref,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      role="dialog"
      aria-label={label}
      onToggle={(event) => onOpenChange?.(event.newState === "open")}
      className={`fixed hidden backdrop:pointer-events-none backdrop:bg-transparent [&:popover-open]:flex ${className}`}
    >
      {children}
    </div>
  );
}
