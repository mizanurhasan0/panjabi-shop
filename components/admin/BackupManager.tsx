"use client";
import { adminStyles } from "./styles";
import { useEffect, useRef, useState } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import {
  createDemoBackup,
  deleteDemoBackup,
  downloadDemoBackup,
  getDemoBackups,
  importDemoBackup,
  restoreDemoBackup,
  DEMO_BACKUP_LIMIT,
} from "@/lib/demo/backups";
import type { BackupInfo } from "@/lib/admin/types";
import { PageHeading, Button, Alert, ConfirmDialog, EmptyState } from "./ui";

export function BackupManager() {
  const { data, error, reload, loading } = useDemoQuery(() => getDemoBackups());
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const refresh = () => reload();
    window.addEventListener("panjabi:demo-backups-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("panjabi:demo-backups-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [reload]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [imported, setImported] = useState<BackupInfo | null>(null);
  const [selected, setSelected] = useState<{
    backup: BackupInfo;
    action: "restore" | "delete";
  } | null>(null);
  function create() {
    if (busy) return;
    setBusy(true);
    setFailure("");
    try {
      createDemoBackup();
      setMessage(
        "Backup created in this browser. Download a copy to keep it outside the demo.",
      );
      reload();
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title="Keep a copy of your demo"
        description="Save your products, orders, settings, and images in a portable snapshot."
        actions={
          <Button onClick={create} disabled={busy}>
            {busy ? "Please wait…" : "+ Create backup"}
          </Button>
        }
      />
      <Alert tone="info">
        Keep up to {DEMO_BACKUP_LIMIT} snapshots in this browser. Download a
        JSON copy to keep your work when clearing browser data or switching
        devices. This is a frontend demo.
      </Alert>
      {(failure || error) && <Alert>{failure || error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {imported && (
        <div className={`${adminStyles.card} ${adminStyles.actions}`}>
          <p className={adminStyles.muted}>
            Imported snapshot: {imported.products} products · {imported.orders}{" "}
            orders
          </p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setSelected({ backup: imported, action: "restore" })}
          >
            Restore imported backup
          </Button>
        </div>
      )}
      <section className={adminStyles.card}>
        <div className={adminStyles.cardHeader}>
          <div>
            <h2>Import a downloaded backup</h2>
            <p className={adminStyles.muted}>
              Choose a JSON snapshot, then select Restore from the list.
              Importing does not replace current data.
            </p>
          </div>
        </div>
        <label className={adminStyles.field}>
          Backup file
          <input
            ref={importInput}
            className={adminStyles.input}
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setFailure("");
              try {
                setImported(await importDemoBackup(file));
                setMessage(
                  "Backup imported. Select Restore when you are ready to apply it.",
                );
                reload();
              } catch (error) {
                setFailure(errorMessage(error));
              } finally {
                setBusy(false);
                if (importInput.current) importInput.current.value = "";
              }
            }}
          />
        </label>
      </section>
      <section className={adminStyles.card}>
        <div className={adminStyles.cardHeader}>
          <h2>Saved backups</h2>
          <span className={adminStyles.muted}>
            {data?.length ?? 0} / {DEMO_BACKUP_LIMIT} snapshots
          </span>
        </div>
        {loading ? (
          <div className={`${adminStyles.skeleton} h-[180px]`} />
        ) : !data?.length ? (
          <EmptyState
            title="No backups yet"
            description="Create your first snapshot before making major changes."
          />
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Products</th>
                  <th>Orders</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((backup) => (
                  <tr key={backup.id} data-backup-id={backup.id}>
                    <td data-label="Created">
                      {new Date(backup.createdAt).toLocaleString("en-BD", {
                        timeZone: "Asia/Dhaka",
                      })}
                      <small>Snapshot {backup.id.slice(0, 8)}</small>
                    </td>
                    <td data-label="Products">{backup.products}</td>
                    <td data-label="Orders">{backup.orders}</td>
                    <td data-label="Size">
                      {(backup.bytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td data-label="Actions">
                      <div className={adminStyles.actions}>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setFailure("");
                            try {
                              downloadDemoBackup(backup.id);
                            } catch (error) {
                              setFailure(errorMessage(error));
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            setSelected({ backup, action: "restore" })
                          }
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() =>
                            setSelected({ backup, action: "delete" })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(selected)}
        title={
          selected?.action === "restore"
            ? "Restore this backup?"
            : "Delete this backup?"
        }
        description={
          selected?.action === "restore"
            ? `Restore snapshot ${selected.backup.id.slice(0, 8)} with ${selected.backup.products} products and ${selected.backup.orders} orders? Current demo data will be replaced. Create or download a backup first if you want to keep your current changes.`
            : "This saved snapshot will be permanently removed. Your current shop data will stay unchanged."
        }
        confirmLabel={
          selected?.action === "restore" ? "Restore backup" : "Delete backup"
        }
        busy={busy}
        onClose={() => setSelected(null)}
        onConfirm={() => {
          if (!selected || busy) return;
          setBusy(true);
          setFailure("");
          try {
            const restoring = selected.action === "restore";
            if (restoring) restoreDemoBackup(selected.backup.id);
            else deleteDemoBackup(selected.backup.id);
            setMessage(
              restoring ? "Backup restored successfully." : "Backup deleted.",
            );
            if (imported?.id === selected.backup.id) setImported(null);
            setSelected(null);
            reload();
          } catch (error) {
            setFailure(errorMessage(error));
            setSelected(null);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
