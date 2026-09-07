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
      <div className="container-ylw">
        <p key={index} className="animate-appear-down m-0">
          {announcements[index]}
        </p>
      </div>
    </div>
  );
}
