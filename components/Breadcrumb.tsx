import Link from "next/link";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-[12px] text-ylw-text-secondary">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span>|</span>}
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-ylw-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
