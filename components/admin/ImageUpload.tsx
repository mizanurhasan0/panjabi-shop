"use client";
import { useAdminLanguage } from "@/lib/admin/i18n";
import { adminStyles } from "./styles";
import Image from "next/image";
import { useRef, useState } from "react";
import { Alert } from "./ui";
import { readDemoImage } from "@/lib/demo/images";

export function ImageUpload({
  label,
  value,
  onChange,
  onBusyChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useAdminLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-3">
      {value && (
        <div className="relative h-[100px] w-full max-w-[220px] rounded-xl bg-[#f7f6f2]">
          <Image
            src={value}
            alt={t("{label} preview", { label })}
            fill
            unoptimized
            className="object-contain"
            sizes="220px"
          />
        </div>
      )}
      <label className={adminStyles.field}>
        {label}
        <input
          ref={input}
          className={adminStyles.input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy || disabled}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            onBusyChange?.(true);
            setError("");
            try {
              onChange(await readDemoImage(file));
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "The image could not be added. Please try again.",
              );
            } finally {
              setBusy(false);
              onBusyChange?.(false);
              if (input.current) input.current.value = "";
            }
          }}
        />
      </label>
      <p className={adminStyles.muted}>
        {t(
          busy
            ? "Preparing image…"
            : "PNG, JPEG or WebP · up to 5 MB · processed in your browser",
        )}
      </p>
      {error && <Alert>{t(error)}</Alert>}
    </div>
  );
}
