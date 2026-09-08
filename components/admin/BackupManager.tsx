"use client";
import { useAdminLanguage } from "@/lib/admin/i18n";
import { AdminTableViewport } from "./AdminTableViewport";
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
import {
  AdminActionBar,
  PageHeading,
  Button,
  Alert,
  ConfirmDialog,
  EmptyState,
} from "./ui";

export function BackupManager() {
  const { t, formatDate, formatNumber } = useAdminLanguage();
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
    setMessage("");
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
        title={t("Keep a copy of your demo")}
        description={t(
          "Save your products, orders, settings, and images in a portable snapshot.",
        )}
      />
      {(failure || error) && <Alert>{t(failure || error)}</Alert>}
      {message && <Alert tone="success">{t(message)}</Alert>}
      {imported && (
        <div className={adminStyles.card}>
          <AdminActionBar
            label={t("Imported backup actions")}
            actions={
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  setSelected({ backup: imported, action: "restore" })
                }
              >
                {t("Restore imported backup")}
              </Button>
            }
          >
            <p className={adminStyles.muted}>
              {t("Imported snapshot: {products} products · {orders} orders", {
                products: formatNumber(imported.products),
                orders: formatNumber(imported.orders),
              })}
            </p>
          </AdminActionBar>
        </div>
      )}
      <section className={adminStyles.card}>
        <AdminActionBar
          label={t("Backup actions")}
          actions={
            <Button onClick={create} disabled={busy}>
              {t(busy ? "Please wait…" : "+ Create backup")}
            </Button>
          }
        >
          <h2>{t("Saved backups")}</h2>
          <span className="text-[11px] text-admin-muted">
            {t("{count} / {limit} snapshots", {
              count: formatNumber(data?.length ?? 0),
              limit: formatNumber(DEMO_BACKUP_LIMIT),
            })}
          </span>
        </AdminActionBar>
        <p className="mt-3 mb-4 text-[11px] text-admin-muted">
          {t(
            "Keep up to {limit} snapshots. Download a JSON copy to keep a backup outside this browser.",
            { limit: formatNumber(DEMO_BACKUP_LIMIT) },
          )}
        </p>
        {loading ? (
          <div className={`${adminStyles.skeleton} h-[180px]`} />
        ) : !data?.length ? (
          <EmptyState
            title={t("No backups yet")}
            description={t(
              "Create your first snapshot before making major changes.",
            )}
          />
        ) : (
          <AdminTableViewport label={t("Saved backups table")}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>{t("Created")}</th>
                  <th>{t("Products")}</th>
                  <th>{t("Orders")}</th>
                  <th>{t("Size")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((backup) => (
                  <tr key={backup.id} data-backup-id={backup.id}>
                    <td data-label={t("Created")}>
                      {formatDate(backup.createdAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      <small>
                        {t("Snapshot {id}", { id: backup.id.slice(0, 8) })}
                      </small>
                    </td>
                    <td data-label={t("Products")}>
                      {formatNumber(backup.products)}
                    </td>
                    <td data-label={t("Orders")}>
                      {formatNumber(backup.orders)}
                    </td>
                    <td data-label={t("Size")}>
                      {t("{size} MB", {
                        size: formatNumber(
                          Math.round((backup.bytes / 1024 / 1024) * 100) / 100,
                        ),
                      })}
                    </td>
                    <td data-label={t("Actions")}>
                      <div className={adminStyles.actions}>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setFailure("");
                            setMessage("");
                            try {
                              downloadDemoBackup(backup.id);
                            } catch (error) {
                              setFailure(errorMessage(error));
                            }
                          }}
                        >
                          {t("Download")}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            setSelected({ backup, action: "restore" })
                          }
                        >
                          {t("Restore")}
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() =>
                            setSelected({ backup, action: "delete" })
                          }
                        >
                          {t("Delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableViewport>
        )}
      </section>
      <section className={adminStyles.card}>
        <div className={adminStyles.cardHeader}>
          <div>
            <h2>{t("Import a downloaded backup")}</h2>
            <p className={adminStyles.muted}>
              {t(
                "Choose a JSON snapshot, then select Restore from the list. Importing does not replace current data.",
              )}
            </p>
          </div>
        </div>
        <label className={adminStyles.field}>
          {t("Backup file")}
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
              setMessage("");
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
      <ConfirmDialog
        open={Boolean(selected)}
        title={t(
          selected?.action === "restore"
            ? "Restore this backup?"
            : "Delete this backup?",
        )}
        description={
          selected?.action === "restore"
            ? t(
                "Restore snapshot {id} with {products} products and {orders} orders? Current demo data will be replaced. Create or download a backup first if you want to keep your current changes.",
                {
                  id: selected.backup.id.slice(0, 8),
                  products: formatNumber(selected.backup.products),
                  orders: formatNumber(selected.backup.orders),
                },
              )
            : t(
                "This saved snapshot will be permanently removed. Your current shop data will stay unchanged.",
              )
        }
        confirmLabel={t(
          selected?.action === "restore" ? "Restore backup" : "Delete backup",
        )}
        busy={busy}
        onClose={() => setSelected(null)}
        onConfirm={() => {
          if (!selected || busy) return;
          setBusy(true);
          setFailure("");
          setMessage("");
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
