"use client";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="admin-stack" style={{ gap: 12 }}>
      {value && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 220,
            height: 100,
            background: "#f7f6f2",
            borderRadius: 12,
          }}
        >
          <Image
            src={value}
            alt={`${label} preview`}
            fill
            unoptimized
            className="object-contain"
            sizes="220px"
          />
        </div>
      )}
      <label className="admin-field">
        {label}
        <input
          ref={input}
          className="admin-input"
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
      <p className="admin-muted">
        {busy
          ? "Preparing image…"
          : "PNG, JPEG or WebP · up to 5 MB · processed in your browser"}
      </p>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
