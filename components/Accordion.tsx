"use client";

import { useId, useState } from "react";
import { IconPlus } from "./icons";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="border-b border-ylw-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between py-4 text-left text-[14px] font-medium uppercase tracking-[0.05em]"
      >
        {title}
        <IconPlus
          className={`h-4 w-4 transition-transform ${open ? "rotate-45" : ""}`}
        />
      </button>
      <div id={contentId} className={`accordion-content ${open ? "open" : ""}`} inert={!open}>
        <div className="pb-4 text-[13px] leading-relaxed text-ylw-text-secondary">
          {children}
        </div>
      </div>
    </div>
  );
}
