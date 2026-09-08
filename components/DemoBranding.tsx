"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDemoQuery } from "@/lib/demo/client";
import { defaultShopSettings } from "@/lib/demo/seed";

/** Keep browser branding in sync with local settings across both app layouts. */
export function DemoBranding() {
  const { data: settings } = useDemoQuery((state) => state.settings);
  const pathname = usePathname();
  const previousName = useRef(defaultShopSettings.name);
  useEffect(() => {
    if (!settings) return;
    function applyBranding() {
      document
        .querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
        .forEach((icon) => {
          if (icon.getAttribute("href") !== settings!.icon)
            icon.href = settings!.icon;
        });
      const title = document.title;
      const nextTitle =
        pathname === "/" ||
        title === previousName.current ||
        title === defaultShopSettings.name
          ? settings!.name
          : title.includes(" | ")
            ? `${title.slice(0, title.lastIndexOf(" | "))} | ${settings!.name}`
            : title;
      if (title !== nextTitle) document.title = nextTitle;
    }
    applyBranding();
    // Next can insert route metadata after hydration. Keep local branding when
    // those title/icon nodes are replaced, without polling or reloading the page.
    const observer = new MutationObserver(applyBranding);
    observer.observe(document.head, { childList: true, subtree: true });
    previousName.current = settings.name;
    return () => observer.disconnect();
  }, [settings, pathname]);
  return null;
}
