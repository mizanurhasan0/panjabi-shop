import Link from "next/link";
import Image from "next/image";
import {
  bannerGrid,
  brandStory,
  campaignText,
  categoryTiles,
  colorDisclaimer,
  heroSlides,
  promoSlides,
} from "@/lib/data/home";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { ImageSlider } from "@/components/ImageSlider";
import styles from "./HomePage.module.css";
import { BrandCarousel } from "./BrandCarousel";
import { CollectionProductCard } from "./CollectionProductCard";
import { products } from "@/lib/data/products";
import { sortProducts } from "@/lib/utils/products";

export function HomePage() {
  const newArrivals = sortProducts(products, "date-desc").slice(0, 8);

  return (
    <>
      <div className="home-hero">
        <ImageSlider
          slides={heroSlides}
          aspectRatio="40%"
          showArrows={false}
        />
      </div>
      <AnnouncementBar />

      <section
        className={`container-ylw campaign-copy text-center ${styles.campaign}`}
      >
        <h2 className="mb-0 text-[10px] font-normal tracking-[0.02em] text-ylw-text-secondary lg:text-[15px]">
          {campaignText.heading}
        </h2>
        {campaignText.paragraphs.map((p, i) => (
          <p
            key={i}
            className="mx-auto mb-0 max-w-[1200px] text-[10px] leading-[15px] tracking-[0.02em] text-ylw-text-secondary lg:text-[15px] lg:leading-[22.5px]"
          >
            {p}
          </p>
        ))}
      </section>

      <section className="container-ylw home-categories pb-10">
        <h3 className="section-heading mb-8">Top Categories</h3>
        <div className="grid grid-cols-2 gap-[10px] lg:grid-cols-4">
          {categoryTiles.map((tile) => (
            <Link
              key={tile.title}
              href={tile.href}
              className={`category-tile block ${styles.category}`}
            >
              <Image
                src={tile.image}
                alt={tile.title}
                width={340}
                height={425}
                sizes="(max-width: 1023px) 50vw, 25vw"
                className="w-full"
              />
              <span className="category-tile-label" style={{ color: "var(--ylw-text)", background: "#fff", bottom: 0 }}>{tile.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-ylw pb-10" aria-labelledby="new-arrivals-heading">
        <h2 id="new-arrivals-heading" className="section-heading mb-8">New Arrivals</h2>
        <div className="grid grid-cols-2 gap-x-4 min-[992px]:grid-cols-4 min-[992px]:gap-x-[30px]">
          {newArrivals.map((product) => (
            <CollectionProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center">
          <Link href="/collections/fall-2026" className="inline-block border border-ylw-text px-8 py-3 text-[12px] uppercase tracking-wider">
            View all new arrivals
          </Link>
        </div>
      </section>

      <p className="container-ylw pb-6 text-center text-[12px] text-ylw-text-secondary">
        {colorDisclaimer}
      </p>

      <div className="home-hero">
        <ImageSlider
          slides={promoSlides}
          aspectRatio="40%"
          showArrows={false}
        />
      </div>

      <section className={`brand-story text-center ${styles.story}`}>
        <p className="mx-auto text-[15px] leading-relaxed text-ylw-text-secondary">
          {brandStory}
        </p>
      </section>

      <section
        className={`brand-banners container-ylw ${styles.brands}`}
        aria-label="Explore collections"
      >
        <BrandCarousel>
          {bannerGrid.map((banner) => (
            <Link
              key={banner.href}
              href={banner.href}
              className="block overflow-hidden"
            >
              <Image
                src={banner.image}
                alt={banner.alt}
                width={360}
                height={360}
                sizes="(max-width: 767px) 90vw, 25vw"
                className="w-full transition-transform duration-[640ms] hover:scale-105"
              />
            </Link>
          ))}
        </BrandCarousel>
      </section>
    </>
  );
}
