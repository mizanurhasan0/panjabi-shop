export default function AdminLoading() {
  return <div className="admin-stack" role="status" aria-label="Loading workspace"><div className="admin-skeleton admin-skeleton-heading"/><div className="admin-grid admin-grid-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="admin-skeleton admin-skeleton-card"/>)}</div><div className="admin-skeleton admin-skeleton-table"/><span className="admin-sr-only">Loading your workspace…</span></div>;
}
