"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/types";
import { IconChevronDown } from "./icons";

interface MegaMenuProps {
  item: NavItem;
  open: boolean;
}

export function MegaMenu({ item, open }: MegaMenuProps) {
  if (!item.children?.length) return null;

  return (
    <div
      className={`mega-menu ${open ? "open" : ""}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="container-ylw py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {item.children.map((group) => (
            <div key={group.label}>
              <Link
                href={group.href}
                className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.02em] text-ylw-text hover:opacity-70"
              >
                {group.label}
              </Link>
              {group.children && (
                <ul className="m-0 list-none space-y-1 p-0">
                  {group.children.map((child) => (
                    <li key={child.label}>
                      <Link
                        href={child.href}
                        className="block text-[12px] leading-[22px] tracking-[0.02em] text-ylw-text hover:opacity-70"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  depth?: number;
}

export function MobileNavItem({ item, depth = 0 }: MobileNavItemProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children?.length);

  return (
    <div className="border-b border-ylw-border">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          className="flex-1 py-3 text-[14px] uppercase tracking-[0.05em]"
          style={{ paddingLeft: depth * 16 }}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-3"
            aria-label={`Toggle ${item.label}`}
            aria-expanded={open}
          >
            <IconChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      {hasChildren && (
        <div
          className={`accordion-content ${open ? "open" : ""}`}
          inert={!open}
        >
          <div className="pb-2 pl-4">
            {item.children!.map((child) =>
              child.children ? (
                <MobileNavItem
                  key={child.label}
                  item={child}
                  depth={depth + 1}
                />
              ) : (
                <Link
                  key={child.label}
                  href={child.href}
                  className="block py-2 text-[12px] text-ylw-text-secondary"
                >
                  {child.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
