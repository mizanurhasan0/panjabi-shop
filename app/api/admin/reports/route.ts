import { requireAdmin } from "@/lib/admin/auth";
import { withApi, json } from "@/lib/admin/http";
import { getSettings } from "@/lib/admin/repository";
import { getDb } from "@/lib/admin/db";
import { reportWindow, summarizeOrders } from "@/lib/admin/reporting";
import type { Order, ReportPeriod } from "@/lib/admin/types";

export function GET(request: Request) {
 return withApi(async () => {
  await requireAdmin(request);
  const requested = new URL(request.url).searchParams.get("period") ?? "month";
  const period: ReportPeriod = ["day","week","month","year"].includes(requested) ? requested as ReportPeriod : "month";
  const {from,to} = reportWindow(period);
  getSettings();
  const db = getDb();
  const rows = db.prepare("SELECT data FROM orders WHERE deleted = 0 AND created_at >= ? AND created_at < ? ORDER BY created_at DESC").all(from,to);
  const orders = rows.map(row => JSON.parse(row.data as string) as Order);
  const productCounts = db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN stock <= json_extract(data, '$.lowStockThreshold') THEN 1 ELSE 0 END) AS low FROM products WHERE active = 1").get();
  return json({...summarizeOrders(orders,period),totalProducts:Number(productCounts?.total ?? 0),lowStockProducts:Number(productCounts?.low ?? 0)});
 });
}
