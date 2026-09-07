"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { mainNav } from "@/lib/data/navigation";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { IconCart, IconHeart, IconMenu, IconSearch, IconUser } from "./icons";
import { MegaMenu } from "./MegaMenu";
import { MobileDrawer } from "./MobileDrawer";
import { SearchDrawer } from "./SearchDrawer";
import styles from "./Header.module.css";
import { brand } from "@/lib/data/brand";

export function Header() {
  const { count, openCart, isOpen: cartOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <>
      <header className="relative z-40 bg-white">
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
          >
            <IconMenu />
          </button>

          <Link
            href="/"
            className={styles.brand}
            aria-label={`${brand.name} home`}
          >
            <Image
              src={brand.logo}
              alt={brand.name}
              width={brand.logoWidth}
              height={brand.logoHeight}
              preload
              className={styles.logo}
            />
          </Link>

          <form
            action="/search"
            role="search"
            aria-label="Site search"
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              const term = searchQuery.trim();
              if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
              else setSearchOpen(true);
            }}
          >
            <button
              type="button"
              className={styles.suggestionsButton}
              onClick={() => setSearchOpen(true)}
              aria-label="Browse search suggestions"
              title="Browse search suggestions"
              aria-haspopup="dialog"
              aria-controls="site-search"
              aria-expanded={searchOpen}
            >
              <IconSearch />
            </button>
            <input
              ref={searchInput}
              type="search"
              name="q"
              aria-label="Search products"
              placeholder="Search products"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSearchOpen(true);
                }
                if (event.key === "Escape") setSearchQuery("");
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearch}
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("");
                  searchInput.current?.focus();
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
            <button
              type="submit"
              className={styles.searchSubmit}
              aria-label="Submit search"
            >
              <span>Search</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className={styles.actions}>
            <Link
              href="/account/login"
              className={`${styles.action} ${styles.account}`}
              aria-label="Sign in to your account"
            >
              <IconUser />
              <span className={styles.actionLabel}>
                <span className={styles.actionHint}>Welcome</span>
                <span>Sign in</span>
              </span>
            </Link>
            <Link
              href="/wishlist"
              className={styles.action}
              aria-label={`Wishlist, ${wishCount} saved ${wishCount === 1 ? "item" : "items"}`}
            >
              <span className={styles.iconWrap}>
                <IconHeart />
                {wishCount > 0 && (
                  <span className={styles.wishlistBadge} aria-hidden="true">
                    {wishCount > 99 ? "99+" : wishCount}
                  </span>
                )}
              </span>
              <span className={styles.actionLabel}>Wishlist</span>
            </Link>
            <button
              type="button"
              onClick={openCart}
              className={`${styles.action} ${styles.cart}`}
              aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
              aria-haspopup="dialog"
              aria-expanded={cartOpen}
              aria-controls="shopping-cart"
            >
              <IconCart />
              <span className={styles.actionLabel}>Cart</span>
              <span className={styles.cartBadge} aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop nav bar */}
        <nav className="desktop-only bg-ylw-black" aria-label="Main navigation">
          <div className="container-ylw">
            <ul className="m-0 flex list-none items-center justify-center p-0">
              {mainNav.map((item) => (
                <li
                  key={item.label}
                  className="nav-item"
                  onMouseEnter={() =>
                    item.children?.length && setActiveMenu(item.label)
                  }
                  onMouseLeave={() => setActiveMenu(null)}
                  onFocus={() =>
                    item.children?.length && setActiveMenu(item.label)
                  }
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setActiveMenu(null);
                  }}
                  onClick={() => setActiveMenu(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.currentTarget
                        .querySelector<HTMLAnchorElement>("a")
                        ?.focus();
                      setActiveMenu(null);
                    }
                  }}
                >
                  <Link href={item.href} className="header-nav-link">
                    {item.label}
                  </Link>
                  {item.children && (
                    <MegaMenu item={item} open={activeMenu === item.label} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchDrawer
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        initialQuery={searchQuery}
        onQueryChange={setSearchQuery}
      />
    </>
  );
}
