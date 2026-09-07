import { CollectionBanner } from "@/components/CollectionBanner";
import { CollectionPageClient } from "@/components/CollectionPageClient";
import { getCollectionTitle } from "@/lib/data/collections";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  const title = getCollectionTitle(handle);
  return { title: `${title} | YELLOW` };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  return (
    <>
      <h1 className="sr-only">{getCollectionTitle(handle)}</h1>
      <CollectionBanner handle={handle} />
      <CollectionPageClient key={handle} handle={handle} />
    </>
  );
}
