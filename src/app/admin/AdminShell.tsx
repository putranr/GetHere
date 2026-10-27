"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AdminUserContextValue = {
  username: string;
};

const AdminUserContext = createContext<AdminUserContextValue>({
  username: "Admin",
});

export function useAdminUser() {
  return useContext(AdminUserContext);
}

type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "orders" | "products" | "categories" | "customers" | "reports" | "settings";
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Pesanan", href: "/admin/orders", icon: "orders" },
  { label: "Produk", href: "/admin/products", icon: "products" },
  { label: "Kategori", href: "/admin/categories", icon: "categories" },
  { label: "Pelanggan", href: "/admin/customers", icon: "customers" },
  { label: "Laporan", href: "/admin/reports", icon: "reports" },
  { label: "Pengaturan", href: "/admin/settings", icon: "settings" },
];

function NavIcon({ name, size = 19 }: { name: NavItem["icon"] | "search" | "bell" | "user" | "logout" | "calendar"; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.3" /><rect x="14" y="3" width="7" height="7" rx="1.3" /><rect x="3" y="14" width="7" height="7" rx="1.3" /><rect x="14" y="14" width="7" height="7" rx="1.3" /></svg>;
    case "orders":
      return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
    case "products":
      return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.7 7.5 4.4 7.5-4.4M12 12.1V21" /></svg>;
    case "categories":
      return <svg {...common}><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></svg>;
    case "customers":
      return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.8 20v-1.5A4.5 4.5 0 0 1 7.3 14h3.4a4.5 4.5 0 0 1 4.5 4.5V20M16 4.8a3.5 3.5 0 0 1 0 6.5M18 14.3a4.5 4.5 0 0 1 3.2 4.3V20" /></svg>;
    case "reports":
      return <svg {...common}><path d="M4 20V11M10 20V5M16 20v-8M22 20H2" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2 1-1.2 2.1-1.5-.5a7.5 7.5 0 0 1-1.8 1l-.3 1.6h-2.4l-.3-1.6a7.5 7.5 0 0 1-1.8-1l-1.5.5-1.2-2.1 1.2-1a7.8 7.8 0 0 1 0-2l-1.2-1 1.2-2.1 1.5.5a7.5 7.5 0 0 1 1.8-1l.3-1.6h2.4l.3 1.6a7.5 7.5 0 0 1 1.8 1l1.5-.5 1.2 2.1-1.2 1a7.8 7.8 0 0 1 0 2Z" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "logout":
      return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    default:
      return null;
  }
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1.5" aria-label="Navigasi admin">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? "bg-white/15 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("Admin");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedUsername = window.localStorage.getItem("gethere_admin_username");
    if (savedUsername?.trim()) setUsername(savedUsername.trim());
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.localStorage.removeItem("gethere_admin_username");
      window.localStorage.removeItem("gethere_admin_notifications_orders");
      window.localStorage.removeItem("gethere_admin_notifications_payments");
      router.push("/admin/login");
      router.refresh();
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    router.push(`/admin/orders?search=${encodeURIComponent(value)}`);
  }

  const currentPage = navItems.find((item) => item.href === pathname)?.label
    ?? (pathname.startsWith("/admin/products/") ? "Produk" : "Admin");

  return (
    <AdminUserContext.Provider value={{ username }}>
      <div className="min-h-screen bg-[#F5F5F3] text-[#171717]">
        {/* DESKTOP SIDEBAR */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-[#171715] px-4 py-5 text-white lg:flex">
          <Link href="/admin" className="mb-8 flex h-[76px] items-center justify-center rounded-xl bg-white px-4 py-2" aria-label="GetHere Admin Dashboard">
            <img src="/GetHere_Logo.png" alt="GetHere Coffee" className="max-h-full w-full max-w-[172px] object-contain" />
          </Link>

          <NavLinks pathname={pathname} />

          <div className="mt-auto border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold uppercase">
                {username.slice(0, 1) || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{username}</p>
                <p className="text-xs text-white/50">Admin Panel</p>
              </div>
              <button type="button" onClick={handleLogout} aria-label="Logout" title="Logout" className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
                <NavIcon name="logout" size={17} />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] tracking-wide text-white/35">GET-HERE COFFEE · ADMIN</p>
          </div>
        </aside>

        {/* MOBILE NAV OVERLAY */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} aria-label="Tutup navigasi" />
            <aside className="relative flex h-full w-[280px] flex-col bg-[#171715] px-4 py-5 text-white shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/admin" className="flex h-14 flex-1 items-center justify-center rounded-xl bg-white px-3 py-2">
                  <img src="/GetHere_Logo.png" alt="GetHere Coffee" className="max-h-full w-full max-w-[150px] object-contain" />
                </Link>
                <button type="button" onClick={() => setMobileNavOpen(false)} className="ml-3 rounded-lg px-3 py-2 text-xl text-white/70 hover:bg-white/10" aria-label="Tutup menu">×</button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
              <div className="mt-auto border-t border-white/10 pt-4">
                <p className="text-sm font-semibold">{username}</p>
                <button type="button" onClick={handleLogout} className="mt-3 flex items-center gap-2 text-sm text-white/65 hover:text-white"><NavIcon name="logout" size={16} /> Keluar</button>
              </div>
            </aside>
          </div>
        )}

        <div className="min-h-screen lg:pl-[252px]">
          {/* TOP BAR */}
          <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-4 border-b border-[#E5E5E1] bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E2DE] lg:hidden" aria-label="Buka navigasi">
                <span className="text-xl">☰</span>
              </button>
              <form onSubmit={handleSearchSubmit} className="flex w-full max-w-[460px] items-center gap-2 rounded-xl bg-[#F1F1EF] px-3.5 py-2.5">
                <NavIcon name="search" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pesanan atau pelanggan..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#888882]" aria-label="Cari pesanan atau pelanggan" />
                <button type="submit" className="sr-only">Cari</button>
              </form>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <span className="hidden text-xs text-[#777771] md:block">{currentPage}</span>
              <div className="hidden h-8 w-px bg-[#E5E5E1] sm:block" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171715] text-white"><NavIcon name="user" size={20} /></div>
              <div className="hidden sm:block">
                <p className="max-w-[115px] truncate text-sm font-semibold">{username}</p>
                <p className="text-[11px] text-[#888882]">Administrator</p>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-7 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </AdminUserContext.Provider>
  );
}
