"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDemoQuery } from "@/lib/demo/client";
import { defaultShopSettings } from "@/lib/demo/seed";
import { AdminIcon, Button } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const { data: settings } = useDemoQuery((state) => state.settings);
  const shopName = settings?.name ?? defaultShopSettings.name;
  const [opening, setOpening] = useState(false);

  function openDemo() {
    if (opening) return;
    setOpening(true);
    router.replace("/admin");
  }
  return (
    <div className="admin-login-page">
      <section className="admin-login-story">
        <Link href="/" className="admin-login-brand">
          <span className="admin-brand-mark">
            <AdminIcon name="store" size={26} />
          </span>
          {shopName}
        </Link>
        <div className="admin-login-story-content">
          <span className="admin-login-eyebrow">YOUR BUSINESS, SIMPLIFIED</span>
          <h1>
            A little less admin.
            <br />A lot more possibility.
          </h1>
          <p>
            Your orders, your products, your progress.
            <br />
            One thoughtful space to manage it all.
          </p>
          <div className="admin-login-features">
            <span>
              <AdminIcon name="orders" />
              Track every order
            </span>
            <span>
              <AdminIcon name="products" />
              Keep stock in check
            </span>
            <span>
              <AdminIcon name="trend" />
              See your business grow
            </span>
          </div>
        </div>
        <span className="admin-login-story-footer">
          Built around the way you work.
        </span>
        <div
          className="admin-login-orbit admin-login-orbit-one"
          aria-hidden="true"
        />
        <div
          className="admin-login-orbit admin-login-orbit-two"
          aria-hidden="true"
        />
      </section>
      <section className="admin-login-form-section">
        <Link className="admin-login-back" href="/">
          <span aria-hidden="true">←</span> Back to shop
        </Link>
        <div className="admin-login-form-wrap">
          <span className="admin-login-lock">
            <AdminIcon name="dashboard" size={26} />
          </span>
          <p className="admin-eyebrow">DEMO WORKSPACE</p>
          <h2>Meet your shop dashboard</h2>
          <p className="admin-login-description">
            Explore sample products, orders, and sales reports. Try editing your
            shop and see every change in this browser.
          </p>
          <Button
            onClick={openDemo}
            disabled={opening}
            className="admin-login-submit"
          >
            {opening ? "Opening workspace…" : "Open demo dashboard"}
            {!opening && <AdminIcon name="arrow" size={18} />}
          </Button>
          <p className="admin-login-security">
            Sample data · No account required
          </p>
        </div>
        <p className="admin-login-footer">{shopName} · Shop manager</p>
      </section>
    </div>
  );
}
