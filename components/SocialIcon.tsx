const paths: Record<string, string> = {
  Facebook: "M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1h-3c-4 0-5 2-5 5v3H7v4h3v8z",
  Instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m5-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3",
  TikTok:
    "M14 2h3c.3 3 2 4 5 4v3a9 9 0 0 1-5-2v9a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z",
  YouTube:
    "M21 5c1 1 1 3 1 7s0 6-1 7c-1 1-17 1-18 0-1-1-1-3-1-7s0-6 1-7c1-1 17-1 18 0M10 8v8l6-4z",
};

export function SocialIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
