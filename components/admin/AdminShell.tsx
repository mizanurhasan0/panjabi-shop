"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { getDemoStorageWarning, subscribeDemo } from "@/lib/demo/store";
import { markNotificationsRead } from "@/lib/demo/commands";
import { defaultShopSettings, demoOwner } from "@/lib/demo/seed";
import { AdminIcon, Alert, Button, EmptyState, type AdminIconName } from "./ui";

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
    <nav className="admin-navigation" aria-label="Admin navigation">
      {navigation.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`admin-nav-link ${isActive(pathname, href) ? "is-active" : ""}`}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          onClick={onNavigate}
        >
          <AdminIcon name={icon} />
          <span>{label}</span>
          {isActive(pathname, href) && <span className="admin-nav-dot" />}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
    <Link
      href="/admin"
      className="admin-brand"
      onClick={() => setMenuOpen(false)}
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={43}
          height={43}
          unoptimized
          className="admin-brand-logo"
        />
      ) : (
        <span className="admin-brand-mark">
          <AdminIcon name="store" size={23} />
        </span>
      )}
      <span>
        <strong>{shopName}</strong>
        <small>SHOP MANAGER</small>
      </span>
    </Link>
  );

  return (
    <div className="admin-shell">
      <a className="admin-skip-link" href="#admin-main">
        Skip to content
      </a>
      <aside className="admin-sidebar">
        {brand}
        <p className="admin-nav-caption">WORKSPACE</p>
        <Navigation pathname={pathname} />
        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-store-link">
            <AdminIcon name="store" size={18} />
            <span>Visit your storefront</span>
            <AdminIcon name="arrow" size={16} />
          </Link>
          <div className="admin-user">
            <span className="admin-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{user.name}</strong>
              <small>Demo workspace</small>
            </span>
            <button
              className="admin-icon-button"
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
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-leading">
            <button
              className="admin-icon-button admin-mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <AdminIcon name="menu" />
            </button>
            <div className="admin-breadcrumb">
              <span>Workspace</span>
              <AdminIcon name="chevron" size={13} />
              <strong>{activePage}</strong>
            </div>
            <span className="admin-mobile-brand">
              {shopName}
              <small className="admin-demo-caption">Demo workspace</small>
            </span>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-owner-label">
              <span /> Demo workspace
            </span>
            <button
              className="admin-icon-button admin-notification-trigger"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(true)}
            >
              <AdminIcon name="bell" />
              {unread > 0 && (
                <span className="admin-notification-count">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <span
              className="admin-avatar admin-header-avatar"
              title={user.name}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          {storageWarning && <Alert tone="info">{storageWarning}</Alert>}
          <div key={pathname} className="admin-page-enter">
            {children}
          </div>
          <footer className="admin-workspace-footer">
            <span>{shopName} · Shop manager</span>
            <span>Sample data · Browser workspace</span>
          </footer>
        </main>
      </div>
      <nav className="admin-bottom-nav" aria-label="Quick navigation">
        {navigation.slice(0, 3).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? "is-active" : ""}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            <AdminIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          className={
            pathname.startsWith("/admin/settings") ||
            pathname.startsWith("/admin/backups")
              ? "is-active"
              : ""
          }
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
        className="admin-mobile-drawer"
        animateExit
      >
        <div className="admin-drawer-heading">
          {brand}
          <button
            className="admin-icon-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <AdminIcon name="close" />
          </button>
        </div>
        <p className="admin-nav-caption">WORKSPACE</p>
        <Navigation pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        <div className="admin-drawer-footer">
          <Link href="/" className="admin-store-link">
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
      <Modal
        id="admin-notifications"
        label="Order notifications"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        className="admin-notification-dialog"
        animateExit
      >
        <div className="admin-notification-header">
          <div>
            <h2>Notifications</h2>
            <p>
              {unread
                ? `${unread} unread update${unread === 1 ? "" : "s"}`
                : "Your latest order updates"}
            </p>
          </div>
          <button
            className="admin-icon-button"
            onClick={() => setNotificationsOpen(false)}
            aria-label="Close notifications"
          >
            <AdminIcon name="close" />
          </button>
        </div>
        {(notificationActionError || notificationError) && (
          <Alert>{notificationActionError || notificationError}</Alert>
        )}
        {unread > 0 && (
          <button
            className="admin-text-button admin-mark-read"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        )}
        <div className="admin-notification-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const content = (
                <>
                  <span className="admin-notification-icon">
                    <AdminIcon name="orders" size={18} />
                  </span>
                  <span className="admin-notification-copy">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <time dateTime={notification.createdAt}>
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
                    <span className="admin-unread-dot" aria-label="Unread" />
                  )}
                </>
              );
              return notification.orderId ? (
                <Link
                  key={notification.id}
                  href={`/admin/orders/${notification.orderId}`}
                  className={`admin-notification-item ${notification.read ? "" : "is-unread"}`}
                  onClick={() => setNotificationsOpen(false)}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  className={`admin-notification-item ${notification.read ? "" : "is-unread"}`}
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
              className="admin-stack admin-notification-loading"
              role="status"
              aria-label="Loading notifications"
            >
              <div className="admin-skeleton" />
              <div className="admin-skeleton" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
