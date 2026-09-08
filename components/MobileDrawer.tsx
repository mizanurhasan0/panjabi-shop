"use client";

import Link from "next/link";
import Image from "next/image";
import { mainNav } from "@/lib/data/navigation";
import { IconClose } from "./icons";
import { Modal } from "./Modal";
import { brand } from "@/lib/data/brand";
import { MobileNavItem } from "./MegaMenu";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  return (
    <Modal
      id="mobile-menu"
      label="Menu"
      open={open}
      onClose={onClose}
      className="menu-panel"
    >
      <div className="flex items-center justify-between border-b border-ylw-border p-4">
        <Link href="/" onClick={onClose}>
          <Image
            src={brand.logo}
            alt={brand.name}
            width={brand.logoWidth}
            height={brand.logoHeight}
            className="h-8 w-auto"
          />
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu">
          <IconClose />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-4 flex gap-4 border-b border-ylw-border pb-4 text-[12px]">
          <Link href="/account/login" onClick={onClose}>
            Sign In
          </Link>
          <Link href="/account/register" onClick={onClose}>
            Create an Account
          </Link>
          <Link href="/wishlist" onClick={onClose}>
            My Wish List
          </Link>
        </div>
        <nav
          aria-label="Mobile navigation"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a")) {
              onClose();
            }
          }}
        >
          {mainNav.map((item) => (
            <MobileNavItem key={item.label} item={item} />
          ))}
        </nav>
      </div>
    </Modal>
  );
}
