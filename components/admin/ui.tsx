"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Modal } from "@/components/Modal";
import { useAdminLanguage } from "@/lib/admin/i18n";
import type { OrderStage } from "@/lib/admin/types";
import { adminStyles } from "./styles";

const buttonVariants = {
  primary: adminStyles.buttonPrimary,
  secondary: adminStyles.buttonSecondary,
  danger: adminStyles.buttonDanger,
} as const;

const badgeColors: Record<string, string> = {
  pending: "bg-[#fff5e2] text-[#b0822f]",
  unpaid: "bg-[#fff5e2] text-[#b0822f]",
  confirmed: "bg-[#edf0fe] text-[#6c77b4]",
  processing: "bg-[#edf0fe] text-[#6c77b4]",
  shipped: "bg-[#ebf3ff] text-[#5485bc]",
  delivered: "bg-[#eaf6ef] text-[#538f70]",
  paid: "bg-[#eaf6ef] text-[#538f70]",
  active: "bg-[#eaf6ef] text-[#538f70]",
  cancelled: "bg-[#fcefee] text-[#bd6862]",
  inactive: "bg-[#fcefee] text-[#bd6862]",
  returned: "bg-[#f3edf8] text-[#9b71b8]",
  refunded: "bg-[#f3edf8] text-[#9b71b8]",
};

const alertColors = {
  error: "border-[#f2d9d6] bg-[#fff4f3] text-[#a64442]",
  success: "border-[#d7eadd] bg-[#eff9f2] text-[#37795a]",
  info: "border-[#e0e6f2] bg-[#f2f5fc] text-[#626d8b]",
} as const;

export type AdminIconName =
  | "dashboard"
  | "orders"
  | "products"
  | "settings"
  | "backup"
  | "bell"
  | "menu"
  | "close"
  | "arrow"
  | "plus"
  | "download"
  | "search"
  | "filter"
  | "logout"
  | "store"
  | "check"
  | "trash"
  | "edit"
  | "refresh"
  | "chevron"
  | "box"
  | "trend";

const iconPaths: Record<AdminIconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  orders: (
    <>
      <path d="M8 4H5v17h14V4h-3" />
      <rect x="8" y="2" width="8" height="5" rx="1" />
      <path d="M8 11h8M8 15h8" />
    </>
  ),
  products: (
    <>
      <path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7 5.8l9 5" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-.6 2.3-2 .9-2-.6L2.5 9l1.7 1.7v2.6L2.5 15l1.9 3.4 2-.6 2 .9L9 21h4l.6-2.3 2-.9 2 .6 1.9-3.4-1.7-1.7v-2.6L19.5 9l-1.9-3.4-2 .6-2-.9L13 3Z" />
      <circle cx="11" cy="12" r="3" />
    </>
  ),
  backup: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  logout: (
    <>
      <path d="M9 4H4v16h5M10 12h11m-5-5 5 5-5 5" />
    </>
  ),
  store: (
    <>
      <path d="M3 9h18l-2-6H5L3 9ZM4 9v12h16V9M9 21v-7h6v7M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  edit: (
    <>
      <path d="m16 3 5 5L9 20l-6 1 1-6L16 3ZM13 6l5 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M18 18a8 8 0 0 1-13-2" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  box: (
    <>
      <path d="M4 8h16v13H4zM3 3h18v5H3zM9 12h6" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-10M15 5h6v6" />
    </>
  ),
};

export function AdminIcon({
  name,
  size = 20,
  className = "",
}: {
  name: AdminIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="sr-only">
      <h1>{t(title)}</h1>
      {description && <p>{t(description)}</p>}
    </div>
  );
}

/** Keeps page controls with their context, with equal-width actions on mobile. */
export function AdminActionBar({
  children,
  actions,
  label = "Page actions",
  className = "",
}: {
  children?: ReactNode;
  actions?: ReactNode;
  label?: string;
  className?: string;
}) {
  const { t } = useAdminLanguage();
  if (!children && !actions) return null;
  return (
    <div
      role="group"
      aria-label={t(label)}
      data-slot="admin-action-bar"
      className={`flex min-w-0 flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {children && (
        <div
          data-slot="action-bar-content"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-3 max-[641px]:basis-full"
        >
          {children}
        </div>
      )}
      {actions && (
        <div
          data-slot="action-bar-actions"
          className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2.5 max-[641px]:w-full max-[641px]:[&>*]:flex-1"
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  "aria-label": ariaLabel,
  title,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const { t } = useAdminLanguage();
  return (
    <button
      type={type}
      className={`${buttonVariants[variant]} ${className}`}
      {...props}
      aria-label={ariaLabel ? t(ariaLabel) : undefined}
      title={title ? t(title) : undefined}
    >
      {typeof children === "string" ? t(children) : children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
}) {
  const { t } = useAdminLanguage();
  const control =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type)
      ? cloneElement(children as ReactElement<{ "aria-label"?: string }>, {
          "aria-label": t(label),
        })
      : children;
  return (
    <div className={adminStyles.field}>
      <label htmlFor={htmlFor}>
        {t(label)}
        {control}
      </label>
      {hint && <p className={adminStyles.fieldHint}>{t(hint)}</p>}
    </div>
  );
}

export function StatusBadge({ stage }: { stage: OrderStage | string }) {
  const { t } = useAdminLanguage();
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-[5px] px-2 py-1 text-[9px] font-medium leading-normal whitespace-nowrap capitalize ${badgeColors[stage] ?? "bg-[#f0f1f4] text-[#666a75]"}`}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden="true" />
      {t(stage.replaceAll("_", " "))}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-[11px] px-5 py-12 text-center max-[641px]:px-2.5 max-[641px]:py-9">
      <div className="mb-[3px] flex size-16 items-center justify-center rounded-[18px] bg-[#f5f3ef] text-[#ba9d70]">
        <AdminIcon name="box" size={28} />
      </div>
      <h3 className="text-[15px]! font-medium!">{t(title)}</h3>
      {description && (
        <p className="max-w-[330px] text-[11px] text-admin-muted">
          {t(description)}
        </p>
      )}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const { t } = useAdminLanguage();
  return (
    <div
      className={`rounded-lg border px-[15px] py-[13px] text-[11px] leading-[1.7] [overflow-wrap:anywhere] ${alertColors[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {typeof children === "string" ? t(children) : children}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onClose,
  busy = false,
  confirmLabel = "Delete",
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  confirmLabel?: string;
}) {
  const id = useId();
  const { t } = useAdminLanguage();
  return (
    <Modal
      id={id}
      label={t(title)}
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      className={adminStyles.dialog}
      unstyled
      animateExit
    >
      <div className={adminStyles.dialogContent}>
        <span className="mb-[18px] inline-flex size-12 items-center justify-center rounded-[13px] bg-[#fcf0ee] text-[#bd6862]">
          <AdminIcon name="trash" size={24} />
        </span>
        <h2>{t(title)}</h2>
        <p>{t(description)}</p>
        <div className={`${adminStyles.actions} mt-[26px] justify-end`}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={busy}
            data-autofocus
          >
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? t("Please wait…") : t(confirmLabel)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const { t, formatNumber } = useAdminLanguage();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <nav
      className="flex shrink-0 items-center justify-between gap-2 pt-3 text-[10px] text-[#8d9099] [&_button]:min-h-[34px] [&_button]:px-3 [&_button]:py-2 [&_button]:text-[10px] max-[641px]:[&_button]:min-h-10 max-[401px]:[&_button]:px-2"
      aria-label={t("Table pagination")}
    >
      <p className="shrink-0 tabular-nums" aria-live="polite">
        <strong className="font-medium text-[#666a75]">
          {formatNumber(Math.min((page - 1) * pageSize + 1, total))}–
          {formatNumber(Math.min(page * pageSize, total))}
        </strong>{" "}
        {t("of {total}", { total: formatNumber(total) })}
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t("Previous page")}
        >
          {t("Previous")}
        </Button>
        <span className="text-[10px] text-[#747883] max-[641px]:hidden">
          {formatNumber(page)} / {formatNumber(pages)}
        </span>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label={t("Next page")}
        >
          {t("Next")}
        </Button>
      </div>
    </nav>
  );
}
