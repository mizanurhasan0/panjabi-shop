"use client";

import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Modal } from "@/components/Modal";
import type { OrderStage } from "@/lib/admin/types";

export type AdminIconName = "dashboard" | "orders" | "products" | "settings" | "backup" | "bell" | "menu" | "close" | "arrow" | "plus" | "download" | "search" | "logout" | "store" | "check" | "trash" | "edit" | "refresh" | "eye" | "chevron" | "shield" | "box" | "trend";

const iconPaths: Record<AdminIconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  orders: <><path d="M8 4H5v17h14V4h-3"/><rect x="8" y="2" width="8" height="5" rx="1"/><path d="M8 11h8M8 15h8"/></>,
  products: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7 5.8l9 5"/></>,
  settings: <><path d="m9 3-.6 2.3-2 .9-2-.6L2.5 9l1.7 1.7v2.6L2.5 15l1.9 3.4 2-.6 2 .9L9 21h4l.6-2.3 2-.9 2 .6 1.9-3.4-1.7-1.7v-2.6L19.5 9l-1.9-3.4-2 .6-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></>,
  backup: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 0 0 4 0"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, plus: <path d="M12 5v14M5 12h14"/>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  logout: <><path d="M9 4H4v16h5M10 12h11m-5-5 5 5-5 5"/></>,
  store: <><path d="M3 9h18l-2-6H5L3 9ZM4 9v12h16V9M9 21v-7h6v7M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9"/></>,
  check: <path d="m5 12 4 4L19 6"/>, trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
  edit: <><path d="m16 3 5 5L9 20l-6 1 1-6L16 3ZM13 6l5 5"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M18 18a8 8 0 0 1-13-2"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
  box: <><path d="M4 8h16v13H4zM3 3h18v5H3zM9 12h6"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-10M15 5h6v6"/></>,
};

export function AdminIcon({ name, size = 20, className = "" }: { name: AdminIconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="admin-page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="admin-actions">{actions}</div>}</div>;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return <button type={type} className={`admin-button admin-button-${variant} ${className}`} {...props}/>;
}

export function Field({ label, children, hint, htmlFor }: { label: string; children: ReactNode; hint?: string; htmlFor?: string }) {
  return <div className="admin-field"><label htmlFor={htmlFor}>{label}{children}</label>{hint && <p className="admin-field-hint">{hint}</p>}</div>;
}

export function StatusBadge({ stage }: { stage: OrderStage | string }) {
  return <span className={`admin-badge admin-badge-${stage}`}><span aria-hidden="true"/>{stage.replaceAll("_", " ")}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="admin-empty-state"><div className="admin-empty-icon"><AdminIcon name="box" size={28}/></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  return <div className={`admin-alert admin-alert-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function ConfirmDialog({ open, title, description, onConfirm, onClose, busy = false, confirmLabel = "Delete" }: { open: boolean; title: string; description: string; onConfirm: () => void; onClose: () => void; busy?: boolean; confirmLabel?: string }) {
  const id = useId();
  return <Modal id={id} label={title} open={open} onClose={() => { if (!busy) onClose(); }} className="admin-dialog" animateExit><div className="admin-dialog-content"><span className="admin-dialog-icon"><AdminIcon name="trash" size={24}/></span><h2>{title}</h2><p>{description}</p><div className="admin-actions"><Button variant="secondary" onClick={onClose} disabled={busy} data-autofocus>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? "Please wait…" : confirmLabel}</Button></div></div></Modal>;
}

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return <nav className="admin-pagination" aria-label="Table pagination"><p><strong>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)}</strong> of {total}</p><div className="admin-actions"><Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">Previous</Button><span className="admin-page-count">{page} / {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">Next</Button></div></nav>;
}
