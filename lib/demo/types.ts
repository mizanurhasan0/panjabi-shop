import type {
  AdminProduct,
  Notification,
  Order,
  ShopSettings,
} from "../admin/types.ts";

export interface DemoSnapshot {
  version: 1;
  products: AdminProduct[];
  orders: Order[];
  notifications: Notification[];
  settings: ShopSettings;
}
