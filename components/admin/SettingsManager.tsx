"use client";
import { adminStyles } from "./styles";
import { useState } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { saveSettings } from "@/lib/demo/commands";
import { resetDemoData } from "@/lib/demo/store";
import type { ShopSettings } from "@/lib/admin/types";
import {
  PageHeading,
  Field,
  Button,
  Alert,
  ConfirmDialog,
  AdminIcon,
  AdminActionBar,
} from "./ui";
import { ImageUpload } from "./ImageUpload";

export function SettingsManager() {
  const { data, error, loading, reload } = useDemoQuery(
    (state) => state.settings,
  );
  const [resetRevision, setResetRevision] = useState(0);
  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title="Make it your shop"
        description="Your identity, contact details and inventory preferences."
      />
      {error && <Alert>{error}</Alert>}
      {loading && <div className={`${adminStyles.skeleton} h-[400px]`} />}
      {data && (
        <SettingsForm key={resetRevision} settings={data} onSaved={reload} />
      )}
      <ResetDemoPanel onReset={() => setResetRevision((value) => value + 1)} />
    </div>
  );
}
function SettingsForm({
  settings,
  onSaved,
}: {
  settings: ShopSettings;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState({ logo: false, icon: false });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function update<K extends keyof ShopSettings>(key: K, next: ShopSettings[K]) {
    setValue((previous) => ({ ...previous, [key]: next }));
    setSaved(false);
  }
  return (
    <form
      className={adminStyles.stack}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || uploads.logo || uploads.icon) return;
        setBusy(true);
        setError("");
        try {
          saveSettings(value);
          setSaved(true);
          onSaved();
        } catch (error) {
          setError(errorMessage(error));
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className={adminStyles.card}>
        <div className={adminStyles.cardHeader}>
          <div>
            <h2>Shop identity</h2>
            <p className={adminStyles.muted}>
              Shown in your demo storefront, dashboard and downloaded documents.
            </p>
          </div>
        </div>
        <div className={adminStyles.formGrid}>
          <Field label="Shop name">
            <input
              className={adminStyles.input}
              required
              maxLength={100}
              value={value.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <Field label="Tagline">
            <input
              className={adminStyles.input}
              maxLength={200}
              value={value.tagline}
              onChange={(event) => update("tagline", event.target.value)}
            />
          </Field>
          <ImageUpload
            disabled={busy}
            label="Shop logo"
            value={value.logo}
            onChange={(url) => update("logo", url)}
            onBusyChange={(busy) =>
              setUploads((previous) => ({ ...previous, logo: busy }))
            }
          />
          <ImageUpload
            disabled={busy}
            label="Browser icon"
            value={value.icon}
            onChange={(url) => update("icon", url)}
            onBusyChange={(busy) =>
              setUploads((previous) => ({ ...previous, icon: busy }))
            }
          />
        </div>
      </section>
      <section className={adminStyles.card}>
        <div className={adminStyles.cardHeader}>
          <h2>Contact & inventory</h2>
        </div>
        <div className={adminStyles.formGrid}>
          <Field label="Email">
            <input
              className={adminStyles.input}
              type="email"
              maxLength={254}
              value={value.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={adminStyles.input}
              type="tel"
              maxLength={40}
              value={value.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
          <Field label="Shop address">
            <textarea
              className={adminStyles.textarea}
              rows={3}
              maxLength={1000}
              value={value.address}
              onChange={(event) => update("address", event.target.value)}
            />
          </Field>
          <Field
            label="Default low-stock alert"
            hint="New products use this threshold. Existing products retain their own settings."
          >
            <input
              className={adminStyles.input}
              type="number"
              min={0}
              max={1000000}
              required
              value={value.lowStockThreshold}
              onChange={(event) =>
                update("lowStockThreshold", Number(event.target.value))
              }
            />
          </Field>
          <Field label="Currency">
            <input
              className={adminStyles.input}
              value="Bangladeshi Taka (BDT)"
              readOnly
            />
          </Field>
          <Field label="Reporting timezone">
            <input
              className={adminStyles.input}
              value="Asia/Dhaka (UTC+6)"
              readOnly
            />
          </Field>
        </div>
        <AdminActionBar
          label="Shop settings actions"
          className="mt-4 border-t border-admin-line pt-4"
          actions={
            <Button
              type="submit"
              disabled={busy || uploads.logo || uploads.icon}
            >
              {busy ? "Saving…" : "Save settings"}
            </Button>
          }
        >
          <span className="text-[11px] text-admin-muted">
            Shop details and preferences
          </span>
        </AdminActionBar>
      </section>
      {error && <Alert>{error}</Alert>}
      {saved && (
        <Alert tone="success">Shop settings saved in this browser.</Alert>
      )}
    </form>
  );
}

function ResetDemoPanel({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <section className={`${adminStyles.card} ${adminStyles.stack}`}>
      <AdminActionBar
        label="Reset demo actions"
        actions={
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <AdminIcon name="refresh" size={17} />
            Reset demo data
          </Button>
        }
      >
        <div>
          <h2>Start fresh with sample data</h2>
          <p className="mt-1 text-[11px] text-admin-muted">
            Bring back the original demo products, orders, notifications, and
            branding.
          </p>
        </div>
      </AdminActionBar>
      <p className={adminStyles.muted}>
        Changes are saved in this browser. Resetting replaces your current demo
        changes; downloaded files and saved backups remain available.
      </p>
      {error && <Alert>{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <ConfirmDialog
        open={open}
        title="Reset the demo workspace?"
        description="Your current products, orders, notifications, and shop settings will be replaced with fresh sample data. Create a backup first if you want to keep your changes."
        confirmLabel="Reset demo"
        busy={busy}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          if (busy) return;
          setBusy(true);
          setError("");
          setMessage("");
          try {
            resetDemoData();
            onReset();
            setMessage(
              "Fresh sample data is ready. Your saved backups are still available.",
            );
            setOpen(false);
          } catch (error) {
            setError(errorMessage(error));
            setOpen(false);
          } finally {
            setBusy(false);
          }
        }}
      />
    </section>
  );
}
