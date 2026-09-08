"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { errorMessage } from "@/lib/demo/client";
import { readDemoImage } from "@/lib/demo/images";
import { AdminIcon, Alert, Button, Field } from "../ui";
import { adminStyles } from "../styles";

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
    <div className={adminStyles.stack}>
      <div className={`${adminStyles.cardHeader} pb-0! [&_p]:max-w-[350px]`}>
        <div>
          <h2>Product images</h2>
          <p>The first image is the cover shown in your shop.</p>
        </div>
        <span className={adminStyles.muted}>{images.length} / 20</span>
      </div>
      {error && <Alert>{error}</Alert>}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 max-[1201px]:grid-cols-2 max-[761px]:grid-cols-3 max-[641px]:grid-cols-2">
          {images.map((url, index) => (
            <div
              className="relative aspect-[4/5] min-w-0 overflow-hidden rounded-[10px] border border-[#e8e9ed] bg-[#fafafa]"
              key={url}
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 40vw, 150px"
                unoptimized
                className="object-contain"
              />
              {index === 0 && (
                <span className="absolute top-[7px] left-[7px] rounded border border-[#f4e5c4] bg-[#fff7e6] px-[7px] py-[3px] text-[8px] text-[#98702c]">
                  Cover
                </span>
              )}
              <div className="absolute right-1.5 bottom-1.5 left-1.5 flex items-center justify-end gap-1">
                {index > 0 && (
                  <button
                    className="rounded-md border border-[#e6e6e9] bg-white/95 px-[7px] py-[5px] text-[8px] text-[#6a6d76] max-[641px]:min-h-[34px] max-[641px]:text-[9px]"
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
                  className="inline-flex size-7 items-center justify-center rounded-md border border-[#e6e6e9] bg-white text-[#a4716b] max-[641px]:size-[34px]"
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
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={upload}
        tabIndex={-1}
        aria-label="Upload product images"
        disabled={busy || disabled}
      />
      <button
        className="flex w-full flex-col items-center gap-[9px] rounded-[10px] border-[1.5px] border-dashed border-[#dcdfe6] bg-[#fdfdfd] px-[15px] py-7 transition-colors duration-150 hover:border-[#d5b678] hover:bg-[#fffdf7] disabled:opacity-50 motion-reduce:transition-none [&>span]:flex [&>span]:size-[38px] [&>span]:items-center [&>span]:justify-center [&>span]:rounded-[9px] [&>span]:bg-[#f6f3ed] [&>span]:text-[#b1925d] [&_strong]:text-[11px] [&_strong]:font-medium [&_strong]:text-[#686c76] [&_small]:text-[9px] [&_small]:text-[#a1a5af]"
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
      <div className="flex items-end gap-2.5 max-[1201px]:flex-col max-[1201px]:items-stretch [&>div]:flex-1 max-[641px]:[&>button]:self-end">
        <Field label="Or use an existing local image path">
          <input
            className={adminStyles.input}
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
