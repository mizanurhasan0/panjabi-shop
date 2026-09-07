"use client";

import type { ReactNode } from "react";
import styles from "./HomePage.module.css";

/** Native touch scrolling, with focused links brought fully into view. */
export function BrandCarousel({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.brandTrack}
      onFocusCapture={(event) => {
        const track = event.currentTarget;
        const link = (event.target as HTMLElement).closest("a");
        if (link && track.scrollWidth > track.clientWidth) {
          track.scrollTo({ left: link.offsetLeft - track.offsetLeft });
        }
      }}
    >
      {children}
    </div>
  );
}
