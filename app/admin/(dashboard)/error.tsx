"use client";

import { Alert, Button, EmptyState } from "@/components/admin/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-card"><EmptyState title="We couldn't load this page" description="Please try again. Your saved shop data is still there." action={<Button onClick={reset}>Try again</Button>}/><Alert tone="info">If this continues, check your server connection and try refreshing the page.</Alert></div>;
}
