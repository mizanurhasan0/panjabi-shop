"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { errorMessage } from "@/lib/demo/client";
import { readDemoImage } from "@/lib/demo/images";
import { AdminIcon, Alert, Button, Field } from "../ui";

export function ProductImageManager({
  images,
  onChange,
  disabled,
  onBusyChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (files.length + images.length > 20) {
      setError("You can add up to 20 images per product.");
      event.target.value = "";
      return;
    }
    setError("");
    setBusy(true);
    onBusyChange(true);
    const uploaded = [...images];
    try {
      for (const file of files) {
        const image = await readDemoImage(file);
        if (!uploaded.includes(image)) uploaded.push(image);
        onChange([...uploaded]);
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
      onBusyChange(false);
      event.target.value = "";
    }
  }
  function addUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    if (
      !/^\/images\//.test(url) ||
      url.includes("..") ||
      /[\\\u0000-\u001f]/.test(url)
    ) {
      setError("Choose an image or use an existing path under /images/.");
      return;
    }
    if (images.includes(url)) {
      setError("This image is already added.");
      return;
    }
    if (images.length >= 20) {
      setError("You can add up to 20 images per product.");
      return;
    }
    onChange([...images, url]);
    setImageUrl("");
    setError("");
  }
  return (
    <div className="admin-stack">
      <div className="admin-card-header">
        <div>
          <h2>Product images</h2>
          <p>The first image is the cover shown in your shop.</p>
        </div>
        <span className="admin-muted">{images.length} / 20</span>
      </div>
      {error && <Alert>{error}</Alert>}
      {images.length > 0 && (
        <div className="admin-product-image-grid">
          {images.map((url, index) => (
            <div className="admin-product-image-item" key={url}>
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 40vw, 150px"
                unoptimized
                className="admin-product-preview"
              />
              {index === 0 && (
                <span className="admin-product-cover-badge">Cover</span>
              )}
              <div className="admin-product-image-actions">
                {index > 0 && (
                  <button
                    className="admin-image-cover"
                    type="button"
                    onClick={() =>
                      onChange([
                        url,
                        ...images.filter((_, current) => current !== index),
                      ])
                    }
                    disabled={busy || disabled}
                  >
                    Make cover
                  </button>
                )}
                <button
                  type="button"
                  className="admin-image-remove"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() =>
                    onChange(images.filter((_, current) => current !== index))
                  }
                  disabled={busy || disabled}
                >
                  <AdminIcon name="close" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInput}
        className="admin-sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={upload}
        tabIndex={-1}
        aria-label="Upload product images"
        disabled={busy || disabled}
      />
      <button
        className="admin-product-upload"
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={busy || disabled || images.length >= 20}
      >
        <span>
          <AdminIcon name="plus" size={23} />
        </span>
        <strong>
          {busy ? "Preparing images…" : "Choose images from your device"}
        </strong>
        <small>JPG, PNG, or WebP · Up to 5 MB per image</small>
      </button>
      <div className="admin-product-url-row">
        <Field label="Or use an existing local image path">
          <input
            className="admin-input"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="/images/…"
            disabled={busy || disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={addUrl}
          disabled={busy || disabled || !imageUrl.trim() || images.length >= 20}
        >
          Add image
        </Button>
      </div>
    </div>
  );
}
