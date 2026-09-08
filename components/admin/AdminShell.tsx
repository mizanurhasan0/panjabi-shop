"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Modal } from "@/components/Modal";
import { Popover } from "@/components/Popover";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { getDemoStorageWarning, subscribeDemo } from "@/lib/demo/store";
import { markNotificationsRead } from "@/lib/demo/commands";
import { defaultShopSettings, demoOwner } from "@/lib/demo/seed";
import { AdminIcon, Alert, Button, EmptyState, type AdminIconName } from "./ui";
import { adminStyles } from "./styles";
import { AdminBrand } from "./AdminBrand";

const captionClassName =
  "mt-6 mb-3 px-[14px] text-[9px] font-medium tracking-[1.7px] text-[#93959c]";
const avatarClassName =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1ede6] text-[13px] font-semibold text-[#765b35]";
const storeLinkClassName =
  "flex items-center gap-[10px] px-3 py-[15px] text-[11px] text-[#70737c] hover:text-admin-ink [&_svg:last-child]:ml-auto";
const bottomNavItemClassName =
  "flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-lg border-0 text-[9px]";
const notificationItemClassName =
  "flex items-start gap-3 border-b border-[#f1f2f5] px-5 py-[18px] hover:bg-[#fafbfc]";

const navigation: Array<{ href: string; label: string; icon: AdminIconName }> =
  [
    { href: "/admin", label: "Overview", icon: "dashboard" },
    { href: "/admin/orders", label: "Orders", icon: "orders" },
    { href: "/admin/products", label: "Products", icon: "products" },
    { href: "/admin/settings", label: "Shop settings", icon: "settings" },
    { href: "/admin/backups", label: "Backups", icon: "backup" },
  ];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-[6px]" aria-label="Admin navigation">
      {navigation.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex min-h-12 items-center gap-[13px] rounded-[9px] px-[14px] py-3 transition-colors duration-160 ${isActive(pathname, href) ? "bg-admin-accent-soft font-medium text-[#6c4813]" : "text-[#73767f] hover:bg-admin-bg hover:text-admin-ink"}`}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          onClick={onNavigate}
        >
          <AdminIcon name={icon} />
          <span>{label}</span>
          {isActive(pathname, href) && (
            <span className="ml-auto size-[5px] rounded-full bg-[#d99b32]" />
          )}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isListPage =
    pathname === "/admin/orders" || pathname === "/admin/products";
  const router = useRouter();
  const user = demoOwner;
  const { data: settings } = useDemoQuery((state) => state.settings);
  const shopName = settings?.name ?? defaultShopSettings.name;
  const logo = settings?.logo ?? defaultShopSettings.logo;
  const {
    data: notificationData,
    loading: notificationsLoading,
    error: notificationError,
  } = useDemoQuery((state) => state.notifications);
  const notifications = notificationData ?? [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [notificationActionError, setNotificationActionError] = useState("");
  const storageWarning = useSyncExternalStore(
    subscribeDemo,
    getDemoStorageWarning,
    () => null,
  );
  const activePage =
    navigation.find((item) => isActive(pathname, item.href))?.label ??
    "Overview";
  const unread = notifications.filter(
    (notification) => !notification.read,
  ).length;

  useEffect(() => {
    notificationsRef.current?.hidePopover();
  }, [pathname]);

  function logout() {
    setSigningOut(true);
    router.replace("/admin/login");
  }

  function markAllRead() {
    setNotificationActionError("");
    try {
      markNotificationsRead();
    } catch (error) {
      setNotificationActionError(errorMessage(error));
    }
  }

  const brand = (
    <AdminBrand
      name={shopName}
      logo={logo}
      onNavigate={() => setMenuOpen(false)}
    />
  );

  return (
    <div
      className={
        isListPage
          ? "h-dvh overflow-hidden print:h-auto print:overflow-visible"
          : "min-h-dvh"
      }
    >
      <a
        className="fixed top-2 left-2 z-100 -translate-y-[150%] rounded-lg bg-[#232323] px-4 py-[10px] text-white focus:translate-y-0"
        href="#admin-main"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-[var(--modal-inset-left,0px)] z-40 flex w-60 flex-col border-r border-admin-line bg-admin-surface px-[18px] pt-4 pb-[18px] max-[1201px]:w-[215px] max-[1201px]:px-[14px] max-[901px]:hidden print:hidden">
        <div className="px-[11px]">{brand}</div>
        <p className={captionClassName}>WORKSPACE</p>
        <Navigation pathname={pathname} />
        <div className="mt-auto pt-8">
          <Link href="/" className={storeLinkClassName}>
            <AdminIcon name="store" size={18} />
            <span>Visit your storefront</span>
            <AdminIcon name="arrow" size={16} />
          </Link>
          <div className="mt-[10px] flex items-center gap-[10px] border-t border-admin-line px-[2px] pt-5">
            <span className={avatarClassName}>
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-medium">
                {user.name}
              </strong>
              <small className="block text-[10px] text-admin-muted">
                Demo workspace
              </small>
            </span>
            <button
              className={adminStyles.iconButton}
              aria-label="Leave demo"
              title="Leave demo"
              disabled={signingOut}
              onClick={logout}
            >
              <AdminIcon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div
        className={`ml-60 min-w-0 max-[1201px]:ml-[215px] max-[901px]:ml-0 print:ml-0 ${isListPage ? "flex h-full min-h-0 flex-col print:h-auto" : ""}`}
      >
        <header className="flex h-[78px] shrink-0 items-center justify-between gap-4 border-b border-admin-line bg-white/96 px-9 min-[1600px]:px-12 max-[1201px]:px-6 max-[901px]:sticky max-[901px]:top-0 max-[901px]:z-30 max-[901px]:h-[66px] max-[641px]:gap-[10px] max-[641px]:px-[14px] print:hidden">
          <div className="flex min-w-0 items-center gap-[18px] max-[901px]:gap-[10px]">
            <button
              className={`${adminStyles.iconButton} min-[901px]:hidden`}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <AdminIcon name="menu" />
            </button>
            <div className="flex items-center gap-[13px] text-[11px] text-[#93959d] max-[901px]:hidden">
              <span>Workspace</span>
              <AdminIcon name="chevron" size={13} />
              <strong className="font-medium text-[#4c4f57]">
                {activePage}
              </strong>
            </div>
            <div className="hidden max-[901px]:block">
              <AdminBrand
                name={shopName}
                logo={logo}
                compact
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-[18px] max-[641px]:gap-[10px]">
            <span className="mr-2 flex items-center gap-[7px] text-[10px] text-admin-muted max-[901px]:hidden">
              <span className="size-[6px] rounded-full bg-[#62a489]" /> Demo
              workspace
            </span>
            <button
              className={`${adminStyles.iconButton} relative border border-admin-line`}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              aria-expanded={notificationsOpen}
              aria-controls="admin-notifications"
              aria-haspopup="dialog"
              popoverTarget="admin-notifications"
            >
              <AdminIcon name="bell" />
              {unread > 0 && (
                <span className="absolute -top-[6px] -right-[6px] min-w-[17px] rounded-[10px] border-2 border-white bg-[#e77d54] px-1 py-px text-[8px] leading-3 font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <span
              className={`${avatarClassName} max-[641px]:size-[31px] max-[641px]:text-[11px]`}
              title={user.name}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main
          id="admin-main"
          className={`mx-auto w-full max-w-[1670px] px-9 pt-6 pb-5 focus:outline-none min-[1600px]:px-12 max-[1201px]:px-6 max-[641px]:px-4 print:p-0 ${isListPage ? "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden max-[901px]:pb-[calc(76px+env(safe-area-inset-bottom))] max-[641px]:px-3 max-[641px]:pt-3 print:overflow-visible" : "min-h-[calc(100dvh-78px)] min-[1600px]:pt-8 min-[1600px]:pb-6 max-[901px]:min-h-[calc(100dvh-66px)] max-[901px]:pb-[90px] max-[641px]:pt-5 max-[641px]:pb-[92px]"}`}
          tabIndex={-1}
        >
          {storageWarning && <Alert tone="info">{storageWarning}</Alert>}
          <div
            key={pathname}
            className={`animate-admin-enter ${isListPage ? "flex min-h-0 flex-1 flex-col" : "min-h-[calc(100dvh-204px)]"}`}
          >
            {children}
          </div>
          {!isListPage && (
            <footer className="mt-[30px] flex justify-between gap-[14px] border-t border-admin-line pt-[17px] text-[9px] text-[#a1a4ad] max-[641px]:mt-[25px] max-[641px]:text-[8px] max-[641px]:[&>span:last-child]:hidden print:hidden">
              <span>{shopName} · Shop manager</span>
              <span>Sample data · Browser workspace</span>
            </footer>
          )}
        </main>
      </div>
      <nav
        className="fixed right-[var(--modal-inset-right,0px)] bottom-0 left-[var(--modal-inset-left,0px)] z-35 hidden grid-cols-4 border-t border-admin-line bg-white px-3 pt-[7px] pb-[max(7px,env(safe-area-inset-bottom))] shadow-[0_-3px_14px_#1f293703] max-[901px]:grid print:hidden"
        aria-label="Quick navigation"
      >
        {navigation.slice(0, 3).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${bottomNavItemClassName} ${isActive(pathname, item.href) ? "bg-[#fff8ed] text-[#a4782c]" : "bg-transparent text-[#9295a0]"}`}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            <AdminIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          className={`${bottomNavItemClassName} ${
            pathname.startsWith("/admin/settings") ||
            pathname.startsWith("/admin/backups")
              ? "bg-[#fff8ed] text-[#a4782c]"
              : "bg-transparent text-[#9295a0]"
          }`}
          onClick={() => setMenuOpen(true)}
          aria-label="More navigation"
        >
          <AdminIcon name="menu" />
          <span>More</span>
        </button>
      </nav>
      <Modal
        id="admin-menu"
        label="Admin navigation"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        className={`${adminStyles.modal} fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(320px,calc(100vw-42px))] -translate-x-full translate-y-0! rounded-r-2xl border-0! px-4! py-6! open:flex open:flex-col data-[state=open]:translate-x-0`}
        animateExit
        unstyled
      >
        <div className="flex items-center justify-between gap-2">
          {brand}
          <button
            className={adminStyles.iconButton}
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <AdminIcon name="close" />
          </button>
        </div>
        <p className={captionClassName}>WORKSPACE</p>
        <Navigation pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        <div className="mt-auto grid gap-3 pt-[30px]">
          <Link href="/" className={storeLinkClassName}>
            <AdminIcon name="store" />
            Visit storefront
            <AdminIcon name="arrow" size={16} />
          </Link>
          <Button variant="secondary" onClick={logout} disabled={signingOut}>
            <AdminIcon name="logout" size={18} />
            {signingOut ? "Leaving…" : "Leave demo"}
          </Button>
        </div>
      </Modal>
      <Popover
        ref={notificationsRef}
        id="admin-notifications"
        label="Order notifications"
        onOpenChange={setNotificationsOpen}
        className="top-[68px] right-8 bottom-auto left-auto z-50 m-0 max-h-[min(650px,calc(100dvh-110px))] w-[430px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-[14px] border border-admin-line bg-white p-0 text-admin-ink shadow-[0_12px_40px_#10131e20] max-[641px]:top-[74px] max-[641px]:right-3 max-[641px]:w-full motion-safe:[&:popover-open]:animate-admin-enter"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-admin-line px-5 pt-5 pb-4">
          <div>
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="mt-[3px] text-[10px] text-admin-muted">
              {unread
                ? `${unread} unread update${unread === 1 ? "" : "s"}`
                : "Your latest order updates"}
            </p>
          </div>
          <button
            className={adminStyles.iconButton}
            popoverTarget="admin-notifications"
            popoverTargetAction="hide"
            aria-label="Close notifications"
          >
            <AdminIcon name="close" />
          </button>
        </div>
        {(notificationActionError || notificationError) && (
          <div className="m-[14px]">
            <Alert>{notificationActionError || notificationError}</Alert>
          </div>
        )}
        {unread > 0 && (
          <button
            className={`${adminStyles.textButton} mx-5 my-[10px] shrink-0 self-start`}
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        )}
        <div className="min-h-0 max-h-[min(490px,calc(100dvh-235px))] flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#c8cbd2_transparent]">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const content = (
                <>
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#f7f0e4] text-[#b28c4d]">
                    <AdminIcon name="orders" size={18} />
                  </span>
                  <span className="grid min-w-0 gap-1">
                    <strong className="text-[11px] font-medium">
                      {notification.title}
                    </strong>
                    <span className="text-[10px] wrap-anywhere text-admin-muted">
                      {notification.message}
                    </span>
                    <time
                      className="mt-1 text-[9px] text-[#a0a4ad]"
                      dateTime={notification.createdAt}
                    >
                      {new Date(notification.createdAt).toLocaleString(
                        "en-BD",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "Asia/Dhaka",
                        },
                      )}
                    </time>
                  </span>
                  {!notification.read && (
                    <span
                      className="mt-[7px] ml-auto size-[6px] shrink-0 rounded-full bg-[#d7a249]"
                      aria-label="Unread"
                    />
                  )}
                </>
              );
              return notification.orderId ? (
                <Link
                  key={notification.id}
                  href={`/admin/orders/${notification.orderId}`}
                  className={`${notificationItemClassName} ${notification.read ? "" : "bg-[#fffdf8]"}`}
                  onClick={() => notificationsRef.current?.hidePopover()}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  className={`${notificationItemClassName} ${notification.read ? "" : "bg-[#fffdf8]"}`}
                >
                  {content}
                </div>
              );
            })
          ) : !notificationsLoading ? (
            <EmptyState
              title="You're all caught up"
              description="New order notifications will appear here."
            />
          ) : (
            <div
              className={`${adminStyles.stack} p-5`}
              role="status"
              aria-label="Loading notifications"
            >
              <div className={`${adminStyles.skeleton} h-16`} />
              <div className={`${adminStyles.skeleton} h-16`} />
            </div>
          )}
        </div>
      </Popover>
    </div>
  );
}
