"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SlideItem } from "@/lib/types";
import { IconChevronLeft, IconChevronRight } from "./icons";

interface ImageSliderProps {
  slides: SlideItem[];
  autoPlay?: boolean;
  interval?: number;
  aspectRatio?: string;
  showArrows?: boolean;
  showDots?: boolean;
}

export function ImageSlider({
  slides,
  autoPlay = true,
  interval = 3000,
  aspectRatio = "56.25%",
  showArrows = true,
  showDots = true,
}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay || paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      if (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !document.hidden
      )
        next();
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next, paused, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-[#f6f6f6]"
      role="region"
      aria-roledescription="carousel"
      aria-label={slides[0].alt || "Featured collections"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      <div className="relative w-full" style={{ paddingTop: aspectRatio }}>
        {slides.map((slide, i) => {
          const content = (
            <Image
              src={slide.image}
              alt={slide.alt || ""}
              fill
              className={`object-cover transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              sizes="100vw"
              priority={i === 0}
            />
          );

          return (
            <div
              key={slide.image}
              className={`absolute inset-0 ${i === current ? "z-10" : "z-0"}`}
              aria-hidden={i !== current}
              inert={i !== current}
            >
              {slide.href ? (
                <Link href={slide.href} className="block h-full w-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}

        {showArrows && slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ylw-text shadow hover:bg-white"
              aria-label="Previous slide"
            >
              <IconChevronLeft />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ylw-text shadow hover:bg-white"
              aria-label="Next slide"
            >
              <IconChevronRight />
            </button>
          </>
        )}
      </div>

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`slider-dot ${i === current ? "active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
              aria-pressed={i === current}
            />
          ))}
        </div>
      )}
    </div>
  );
}
