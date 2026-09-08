"use client";
import { useAdminLanguage, type AdminLanguage } from "@/lib/admin/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useAdminLanguage();
  return (
    <select
      aria-label={t("Language")}
      value={language}
      onChange={(event) => setLanguage(event.target.value as AdminLanguage)}
      className="min-h-10 max-w-24 shrink-0 cursor-pointer rounded-lg border border-admin-line bg-white px-2 text-xs text-admin-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="bn" lang="bn">
        বাংলা
      </option>
    </select>
  );
}
