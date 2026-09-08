"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDemoQuery } from "@/lib/demo/client";
import { defaultShopSettings } from "@/lib/demo/seed";
import { AdminIcon, Button } from "./ui";
import { adminStyles } from "./styles";

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
    <div className="grid min-h-dvh grid-cols-2 bg-white max-[641px]:grid-cols-1">
      <section className="relative flex flex-col overflow-hidden bg-[#27282a] px-[54px] py-[46px] text-white max-[1201px]:p-9 max-[901px]:p-[30px] max-[641px]:hidden">
        <Link
          href="/"
          className="relative z-1 inline-flex w-fit items-center gap-[13px] text-[25px] font-medium tracking-[-0.8px]"
        >
          <span className="inline-flex size-[43px] shrink-0 items-center justify-center rounded-xl bg-admin-accent text-[#272727]">
            <AdminIcon name="store" size={26} />
          </span>
          {shopName}
        </Link>
        <div className="relative z-1 my-auto py-[70px]">
          <span className="text-[9px] tracking-[2.4px] text-[#e6b76c]">
            YOUR BUSINESS, SIMPLIFIED
          </span>
          <h1 className="mt-[21px] text-[clamp(30px,3.4vw,51px)] leading-[1.3] font-medium tracking-[-1.8px] max-[901px]:text-[32px] max-[901px]:tracking-[-1px]">
            A little less admin.
            <br />A lot more possibility.
          </h1>
          <p className="mt-[25px] text-xs leading-[1.9] text-[#b8b8bc]">
            Your orders, your products, your progress.
            <br />
            One thoughtful space to manage it all.
          </p>
          <div className="mt-[42px] grid gap-[19px] [&>span]:flex [&>span]:items-center [&>span]:gap-3 [&>span]:text-[11px] [&>span]:text-[#d4d3d3] [&_svg]:text-[#ddb777]">
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
        <span className="relative z-1 text-[10px] text-[#8d8d93]">
          Built around the way you work.
        </span>
        <div
          className="pointer-events-none absolute -right-[330px] -bottom-[120px] size-[540px] rounded-full border border-[#e6b76c16]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-[410px] -bottom-[200px] size-[700px] rounded-full border border-[#e6b76c16]"
          aria-hidden="true"
        />
      </section>
      <section className="flex flex-col px-[60px] pt-12 pb-[30px] max-[1201px]:p-9 max-[901px]:p-[30px] max-[641px]:min-h-dvh max-[641px]:px-6 max-[641px]:pt-7 max-[641px]:pb-6">
        <Link
          className="flex w-fit items-center gap-[9px] text-[10px] text-[#8a8d96] hover:text-[#353840] max-[641px]:text-[11px]"
          href="/"
        >
          <span aria-hidden="true">←</span> Back to shop
        </Link>
        <div className="m-auto w-full max-w-[360px] py-[54px] max-[641px]:max-w-[390px] max-[641px]:py-[46px]">
          <span className="mb-[22px] flex size-[55px] items-center justify-center rounded-[15px] border border-[#f5e9d3] bg-admin-accent-soft text-[#b58b44]">
            <AdminIcon name="dashboard" size={26} />
          </span>
          <p className={adminStyles.eyebrow}>DEMO WORKSPACE</p>
          <h2 className="mt-2 text-[29px] leading-[1.3] font-semibold tracking-[-1px] max-[901px]:text-[25px] max-[641px]:text-[30px]">
            Meet your shop dashboard
          </h2>
          <p className="mt-3 mb-[30px] text-[11px] leading-[1.8] text-[#8a8d96] max-[641px]:text-xs">
            Explore sample products, orders, and sales reports. Try editing your
            shop and see every change in this browser.
          </p>
          <Button
            onClick={openDemo}
            disabled={opening}
            className="mt-[5px] min-h-[47px]! w-full justify-between! px-[19px]!"
          >
            {opening ? "Opening workspace…" : "Open demo dashboard"}
            {!opening && <AdminIcon name="arrow" size={18} />}
          </Button>
          <p className="mt-[25px] flex items-center justify-center gap-[7px] text-[9px] text-[#a6a9b1] max-[641px]:text-[10px]">
            Sample data · No account required
          </p>
        </div>
        <p className="text-center text-[9px] text-[#b0b3bb]">
          {shopName} · Shop manager
        </p>
      </section>
    </div>
  );
}
