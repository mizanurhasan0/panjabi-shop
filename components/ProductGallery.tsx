"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { IconChevronLeft, IconChevronRight } from "./icons";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const images = product.images;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div>
      <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-[#f6f6f6]">
        <Image
          src={images[current]}
          alt={product.title}
          fill
          className="object-contain"
          sizes="(max-width:1024px) 100vw, 50vw"
          preload
        />

        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
          {product.isNew && <span className="badge-new">New</span>}
          {!product.available && (
            <span className="badge-sold-out">Sold Out</span>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow"
              aria-label="Previous image"
            >
              <IconChevronLeft />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow"
              aria-label="Next image"
            >
              <IconChevronRight />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`View image ${i + 1} of ${product.title}`}
              aria-pressed={i === current}
              className={`relative h-20 w-16 shrink-0 overflow-hidden border-2 ${
                i === current ? "border-ylw-text" : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                className="object-contain"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
