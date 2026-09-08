"use client";

import Image from "next/image";
import { useAdminLanguage } from "@/lib/admin/i18n";
import Link from "next/link";
import { useState } from "react";
import { AdminIcon } from "./ui";

export function AdminBrand({
  name,
  logo,
  href = "/admin",
  compact = false,
  onNavigate,
}: {
  name: string;
  logo?: string;
  href?: "/" | "/admin";
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useAdminLanguage();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  return (
    <Link
      href={href}
      aria-label={t(href === "/" ? "{name} home" : "{name} dashboard", {
        name,
      })}
      onClick={onNavigate}
      className={`inline-flex max-w-full shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-admin-accent ${compact ? "h-11 w-32" : "h-12 w-44"}`}
    >
      {logo && logo !== failedLogo ? (
        <Image
          src={logo}
          alt=""
          width={176}
          height={48}
          unoptimized
          className="h-full! w-full object-contain object-left"
          onError={() => setFailedLogo(logo)}
        />
      ) : (
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-admin-accent-soft text-[#8b682f]">
          <AdminIcon name="store" size={27} />
        </span>
      )}
    </Link>
  );
}
