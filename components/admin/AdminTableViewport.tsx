import type { ReactNode } from "react";
import { adminStyles } from "./styles";

/** Keeps native table semantics and one scroll area for both axes. */
export function AdminTableViewport({
  children,
  label,
  fill = false,
}: {
  children: ReactNode;
  label: string;
  fill?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      data-slot="admin-table-viewport"
      className={`${adminStyles.tableWrap} ${fill ? "flex-1" : "max-h-[min(60dvh,40rem)]"} print:max-h-none print:overflow-visible`}
    >
      {children}
    </div>
  );
}
