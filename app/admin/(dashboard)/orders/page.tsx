import { OrdersList } from "@/components/admin/orders/OrdersList";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = await searchParams;
  const params = new URLSearchParams();
  for (const name of ["query", "stage", "from", "to", "page"])
    if (typeof values[name] === "string") params.set(name, values[name]);
  return <OrdersList key={params.toString()} queryString={params.toString()} />;
}
