import { adminStyles } from "@/components/admin/styles";

export default function AdminLoading() {
  return (
    <div
      className={adminStyles.stack}
      role="status"
      aria-label="Loading workspace"
    >
      <div className={`${adminStyles.skeleton} mb-2 h-[42px] max-w-[300px]`} />
      <div className={adminStyles.grid4}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${adminStyles.skeleton} h-[140px]`} />
        ))}
      </div>
      <div className={`${adminStyles.skeleton} h-[380px]`} />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
