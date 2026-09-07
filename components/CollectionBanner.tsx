import Image from "next/image";
import styles from "./CollectionBanner.module.css";

interface BannerImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const collectionBanners: Record<string, BannerImage> = {
  "fall-2026": {
    src: "/images/panjabishop/banners/panjabi-collection.webp",
    width: 1750,
    height: 700,
    alt: "Panjabi Shop new collection — burgundy waistcoat with black Panjabi",
  },
};

export function CollectionBanner({ handle }: { handle: string }) {
  const banner = collectionBanners[handle];
  if (!banner) return null;

  return (
    <div className={styles.banner}>
      <Image
        src={banner.src}
        width={banner.width}
        height={banner.height}
        alt={banner.alt}
        className={styles.image}
        style={{ aspectRatio: `${banner.width} / ${banner.height}` }}
        sizes="100vw"
        preload
      />
    </div>
  );
}
