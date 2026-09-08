import type { Product } from "../types";

export const orderStages = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStage = (typeof orderStages)[number];
export const orderStageTransitions: Record<OrderStage, readonly OrderStage[]> =
  {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: ["returned"],
    cancelled: [],
    returned: [],
  };
export type ReportPeriod = "day" | "week" | "month" | "year";
export interface AdminProduct extends Product {
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  updatedAt: string;
}
export interface OrderLine {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  sku: string;
  variant: string;
  quantity: number;
  price: number;
  costPrice: number;
  customizations: string;
}
export interface OrderEvent {
  id: string;
  stage: OrderStage;
  note: string;
  createdAt: string;
}
export interface Order {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  notes: string;
  source: "storefront" | "admin" | "custom";
  stage: OrderStage;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "cod" | "bank" | "mobile" | "cash";
  items: OrderLine[];
  subtotal: number;
  discount: number;
  shippingCharge: number;
  deliveryCost: number;
  additionalCost: number;
  total: number;
  profit: number;
  stockDeducted: boolean;
  history: OrderEvent[];
  createdAt: string;
  updatedAt: string;
}
export interface OrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  notes?: string;
  source?: Order["source"];
  paymentMethod?: Order["paymentMethod"];
  paymentStatus?: Order["paymentStatus"];
  discount?: number;
  shippingCharge?: number;
  deliveryCost?: number;
  additionalCost?: number;
  items: Array<{
    productId?: string | null;
    variantId?: string | null;
    title?: string;
    sku?: string;
    variant?: string;
    quantity: number;
    price?: number;
    costPrice?: number;
    customizations?: string;
  }>;
}
export interface ShopSettings {
  name: string;
  tagline: string;
  logo: string;
  icon: string;
  email: string;
  phone: string;
  address: string;
  currency: "BDT";
  timezone: "Asia/Dhaka";
  lowStockThreshold: number;
}
export interface AdminUser {
  id: string;
  name: string;
  email: string;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
}
export interface BackupInfo {
  id: string;
  createdAt: string;
  bytes: number;
  products: number;
  orders: number;
}
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface DashboardStats {
  period: ReportPeriod;
  from: string;
  to: string;
  revenue: number;
  profit: number;
  orderCount: number;
  totalProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  chart: Array<{
    label: string;
    revenue: number;
    profit: number;
    orders: number;
  }>;
  recentOrders: Order[];
}
