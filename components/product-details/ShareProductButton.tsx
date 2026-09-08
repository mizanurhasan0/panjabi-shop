import { useState } from "react";
import { IconShare } from "../icons";

export function ShareProductButton({ title }: { title: string }) {
  const [status, setStatus] = useState("");

  const handleShare = async () => {
    setStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("Product link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(
        "Unable to share this product. Copy the link from your address bar.",
      );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="flex shrink-0 items-center gap-1 text-[12px] text-ylw-text-secondary"
      >
        <IconShare />
        Share
      </button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}
