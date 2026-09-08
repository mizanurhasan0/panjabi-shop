import type { Metadata } from "next";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: { default: "Shop manager", template: "%s · Shop manager" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
