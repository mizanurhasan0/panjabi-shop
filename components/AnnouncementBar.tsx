"use client";

import { useEffect, useState } from "react";
import { announcements } from "@/lib/data/home";

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="overflow-hidden bg-white py-[5px] text-center text-[12px] font-medium text-[#3c3c3c]"
      role="region"
      aria-label="Announcement"
    >
      <div
        className="container-ylw relative h-[18px] overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        <p
          key={index}
          className="animate-appear-down absolute inset-0 m-0 flex items-center justify-center whitespace-nowrap text-[10px] sm:text-[12px]"
        >
          {announcements[index]}
        </p>
      </div>
    </div>
  );
}
