import type { AdminProduct, Order, ShopSettings } from "../admin/types";

function safeFilename(filename: string): string {
  return (
    filename.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "-").slice(0, 180) ||
    "download"
  );
}

/** Trigger a browser download and release its temporary URL after it starts. */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined")
    throw new Error("Open this page in your browser to download a file.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // A short grace period also allows Safari to begin reading the Blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

export async function exportSpreadsheet(
  type: "orders" | "products",
  records: Order[] | AdminProduct[],
  settings: ShopSettings,
): Promise<void> {
  const { generateSpreadsheet } = await import("./exports.ts");
  const bytes = await generateSpreadsheet(type, records, settings);
  downloadBlob(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${settings.name}-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function downloadOrderPdf(
  order: Order,
  settings: ShopSettings,
): Promise<void> {
  const { generateOrderPdf } = await import("./exports.ts");
  const bytes = await generateOrderPdf(order, settings);
  downloadBlob(
    new Blob([bytes], { type: "application/pdf" }),
    `${order.number}.pdf`,
  );
}
