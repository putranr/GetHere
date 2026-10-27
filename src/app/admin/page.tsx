"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottlePackagingIcon, CupPackagingIcon } from "@/components/PackagingIcons";
import { useAdminUser } from "./AdminShell";

type OrderItem = {
  id: number;
  productId: number;
  name: string;
  packaging: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customerName: string;
  whatsapp: string;
  address?: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

type Product = {
  id: number;
  name: string;
  image?: string | null;
  price: number;
  cupPrice?: number | null;
  bottlePrice?: number | null;
  discountPercent: number;
  category: "COFFEE" | "NON_COFFEE";
  isAvailable: boolean;
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// Dashboard reporting uses WIB dates so order grouping matches the store's local day.
function dateKeyInJakarta(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDateKey(dateKey: string, amount: number): string {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function formatDateKey(dateKey: string, style: "long" | "short" = "long"): string {
  if (!dateKey) return "Memuat tanggal...";
  const date = new Date(`${dateKey}T12:00:00+07:00`);
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: style === "short" ? "short" : "long",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    PROCESSING: "Diproses",
    SHIPPING: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] ?? status;
}

function statusTone(status: string) {
  const tones: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPING: "bg-violet-100 text-violet-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-rose-100 text-rose-800",
  };
  return tones[status] ?? "bg-gray-100 text-gray-700";
}

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu bayar",
    PAID: "Dibayar",
    FAILED: "Gagal",
    EXPIRED: "Kedaluwarsa",
  };
  return labels[status] ?? status;
}

export default function AdminDashboardPage() {
  const { username } = useAdminUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [todayKey, setTodayKey] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const today = dateKeyInJakarta(new Date());
    setTodayKey(today);
    setSelectedDate(today);
    async function loadDashboard() {
      try {
        setLoading(true);
        setLoadError("");
        const [ordersResponse, productsResponse] = await Promise.all([
          fetch("/api/orders", { cache: "no-store", credentials: "include" }),
          fetch("/api/products", { cache: "no-store", credentials: "include" }),
        ]);
        const [ordersData, productsData] = await Promise.all([
          ordersResponse.json(),
          productsResponse.json(),
        ]);
        if (!ordersResponse.ok || !ordersData.success) {
          throw new Error(ordersData.message || "Gagal memuat pesanan.");
        }
        if (!productsResponse.ok || !productsData.success) {
          throw new Error(productsData.message || "Gagal memuat produk.");
        }
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      } catch (error) {
        console.error("Dashboard load error:", error);
        setLoadError(error instanceof Error ? error.message : "Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const minimumReportDate = todayKey ? shiftDateKey(todayKey, -30) : "";
  const reportIsReady = Boolean(selectedDate);

  // All dashboard sales/order widgets follow the selected report date.
  const selectedOrders = useMemo(
    () => orders.filter((order) => dateKeyInJakarta(order.createdAt) === selectedDate),
    [orders, selectedDate]
  );
  const paidOrdersForDate = useMemo(
    () => selectedOrders.filter((order) => order.paymentStatus === "PAID"),
    [selectedOrders]
  );
  const totalRevenue = paidOrdersForDate.reduce((sum, order) => sum + order.totalPrice, 0);
  const customerCount = new Set(
    selectedOrders
      .map((order) => order.whatsapp?.trim() || order.customerName.trim().toLowerCase())
      .filter(Boolean)
  ).size;
  const soldItems = paidOrdersForDate.reduce(
    (sum, order) => sum + (order.items ?? []).reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const topProducts = useMemo(() => {
    const grouped = new Map<number, { productId: number; name: string; quantity: number; revenue: number }>();
    paidOrdersForDate.forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const current = grouped.get(item.productId) ?? { productId: item.productId, name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.price * item.quantity;
        grouped.set(item.productId, current);
      });
    });
    return Array.from(grouped.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [paidOrdersForDate]);

  // Show seven daily points ending on the chosen date; the date picker itself
  // limits reports to today and the prior 30 days.
  const chartData = useMemo(() => {
    if (!selectedDate) return [] as { dateKey: string; label: string; revenue: number }[];
    const days: { dateKey: string; label: string; revenue: number }[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const dateKey = shiftDateKey(selectedDate, -offset);
      if (dateKey < minimumReportDate) continue;
      const revenue = orders.reduce((sum, order) => {
        if (order.paymentStatus !== "PAID" || dateKeyInJakarta(order.createdAt) !== dateKey) return sum;
        return sum + order.totalPrice;
      }, 0);
      days.push({ dateKey, label: formatDateKey(dateKey, "short").replace(/\s+\d{4}$/, ""), revenue });
    }
    return days;
  }, [orders, selectedDate, minimumReportDate]);

  const chartMax = Math.max(1, ...chartData.map((item) => item.revenue));
  const chartPoints = chartData.map((item, index) => ({
    ...item,
    x: chartData.length <= 1 ? 350 : 45 + (index * 610) / (chartData.length - 1),
    y: 184 - (item.revenue / chartMax) * 130,
  }));
  const linePoints = chartPoints.map((item) => `${item.x},${item.y}`).join(" ");
  const areaPoints = chartPoints.length > 1
    ? `${chartPoints[0].x},184 ${linePoints} ${chartPoints[chartPoints.length - 1].x},184`
    : "";
  const latestOrders = [...selectedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const displayName = username || "Naya";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Ringkasan GetHere Coffee</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-[34px]">Selamat datang, {displayName}!</h1>
          <p className="mt-1.5 text-sm text-[#73736D]">Pantau penjualan, pesanan, dan performa toko dari satu tempat.</p>
        </div>
        <div className="flex w-fit flex-col gap-1.5">
          <label htmlFor="dashboard-report-date" className="text-[11px] font-semibold text-[#777771]">
            Tanggal laporan
          </label>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E4E4E0] bg-white px-3.5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
            <input
              id="dashboard-report-date"
              type="date"
              value={selectedDate}
              min={minimumReportDate}
              max={todayKey}
              disabled={!reportIsReady}
              onChange={(event: { target: { value: string } }) => {
                const nextDate = event.target.value;
                if (!nextDate || nextDate < minimumReportDate || nextDate > todayKey) return;
                setSelectedDate(nextDate);
              }}
              aria-label="Pilih tanggal laporan, maksimal 30 hari ke belakang"
              className="min-w-0 cursor-pointer bg-transparent text-sm font-medium text-[#33332F] outline-none disabled:cursor-wait disabled:opacity-60"
            />
          </div>
          <p className="text-[10px] text-[#85857F]">Hari ini hingga 30 hari sebelumnya</p>
        </div>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError} Coba refresh halaman setelah memastikan API admin dapat diakses.</div>}

      {/* KEY METRICS */}
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: "Total Penjualan", value: reportIsReady ? money(totalRevenue) : "—", note: `Pembayaran berhasil · ${selectedDate ? formatDateKey(selectedDate) : "memuat tanggal"}`, icon: "Rp" },
          { label: "Total Pesanan", value: loading || !reportIsReady ? "—" : String(selectedOrders.length), note: `${selectedOrders.filter((order) => order.status === "PENDING").length} menunggu diproses pada tanggal ini`, icon: "#" },
          { label: "Total Produk", value: loading ? "—" : String(products.length), note: `${products.filter((product) => product.isAvailable).length} produk tersedia`, icon: "▱" },
          { label: "Pelanggan pada Tanggal Ini", value: loading || !reportIsReady ? "—" : String(customerCount), note: `${soldItems} item terjual dari pembayaran berhasil`, icon: "◎" },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-[#E7E7E3] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[#73736D]">{metric.label}</p>
                <p className="mt-2 break-words text-2xl font-black tracking-tight text-[#171717] sm:text-[28px]">{loading && metric.label === "Total Penjualan" ? "Memuat..." : metric.value}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0F0ED] text-sm font-black text-[#242420]">{metric.icon}</span>
            </div>
            <p className="mt-3 text-xs text-[#85857F]">{metric.note}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.9fr)]">
        {/* SALES CHART */}
        <section className="min-w-0 rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Grafik Penjualan</h2>
              <p className="mt-1 text-sm text-[#85857F]">Omzet harian dari pembayaran berhasil, 7 hari hingga {selectedDate ? formatDateKey(selectedDate) : "tanggal dipilih"}.</p>
            </div>
            <span className="rounded-lg border border-[#E5E5E1] px-3 py-2 text-xs font-medium text-[#555550]">7 hari terakhir</span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <svg viewBox="0 0 700 235" className="h-[240px] min-w-[580px] w-full" role="img" aria-label="Grafik omzet penjualan tujuh hari terakhir">
              {[54, 86, 119, 151, 184].map((y) => <line key={y} x1="45" y1={y} x2="655" y2={y} stroke="#EAEAE7" strokeWidth="1" />)}
              {[45, 147, 248, 350, 451, 553, 655].map((x) => <line key={x} x1={x} y1="40" x2={x} y2="184" stroke="#F0F0ED" strokeWidth="1" />)}
              {areaPoints && <polygon points={areaPoints} fill="url(#salesGradient)" />}
              {linePoints && <polyline points={linePoints} fill="none" stroke="#171717" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
              {chartPoints.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="4" fill="#171717" /><title>{point.label}: {money(point.revenue)}</title></g>)}
              <defs><linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#171717" stopOpacity="0.16"/><stop offset="100%" stopColor="#171717" stopOpacity="0.01"/></linearGradient></defs>
              {chartPoints.map((point) => <text key={`label-${point.label}`} x={point.x} y="211" textAnchor="middle" fontSize="11" fill="#777771">{point.label}</text>)}
            </svg>
          </div>
          {chartData.every((item) => item.revenue === 0) && !loading && <p className="-mt-2 text-center text-xs text-[#85857F]">Belum ada omzet dari transaksi dibayar dalam rentang grafik ini.</p>}
        </section>

        {/* TOP PRODUCTS */}
        <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Produk Terlaris</h2>
              <p className="mt-1 text-sm text-[#85857F]">Berdasarkan item pada pesanan dibayar.</p>
            </div>
            <Link href="/admin/products" className="shrink-0 text-xs font-semibold text-[#33332F] hover:underline">Lihat produk ↗</Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F1EE] text-xl">—</span>
              <p className="mt-3 text-sm font-semibold">Belum ada data penjualan</p>
              <p className="mt-1 text-xs text-[#85857F]">Produk akan diurutkan setelah ada pembayaran berhasil.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#EEEEEB]">
              {topProducts.map((item, index) => {
                const product = products.find((entry) => entry.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F0ED] text-xs font-bold">{index + 1}</span>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F2F2EF] text-[#42423D]">
                      {product?.image ? <img src={product.image} alt={item.name} className="h-full w-full object-cover" /> : item.name.toLowerCase().includes("bottle") ? <BottlePackagingIcon className="h-6 w-6" /> : <CupPackagingIcon className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#85857F]">{item.quantity} terjual</p>
                    </div>
                    <p className="shrink-0 text-xs font-bold sm:text-sm">{money(item.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* RECENT ORDERS */}
      <section className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold">Pesanan pada Tanggal Laporan</h2>
            <p className="mt-1 text-sm text-[#85857F]">Pesanan yang dibuat pada {selectedDate ? formatDateKey(selectedDate) : "tanggal terpilih"}.</p>
          </div>
          <Link href="/admin/orders" className="rounded-xl border border-[#E2E2DE] px-4 py-2 text-xs font-semibold transition hover:bg-[#F5F5F2]">Lihat semua pesanan ↗</Link>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-[#777771]">Memuat pesanan terbaru...</div>
        ) : latestOrders.length === 0 ? (
          <div className="px-6 py-12 text-center"><p className="font-semibold">Belum ada pesanan pada tanggal ini</p><p className="mt-1 text-sm text-[#85857F]">Pilih tanggal lain, maksimal 30 hari ke belakang, untuk melihat laporan historis.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-[#F7F7F5] text-xs text-[#666660]"><tr><th className="px-5 py-3.5 font-semibold">No. Pesanan</th><th className="px-5 py-3.5 font-semibold">Pelanggan</th><th className="px-5 py-3.5 font-semibold">Item</th><th className="px-5 py-3.5 font-semibold">Total</th><th className="px-5 py-3.5 font-semibold">Pembayaran</th><th className="px-5 py-3.5 font-semibold">Status</th><th className="px-5 py-3.5 font-semibold">Tanggal</th></tr></thead>
              <tbody className="divide-y divide-[#EEEEEB]">
                {latestOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-[#FAFAF8]">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">#{order.id}</td>
                    <td className="px-5 py-4"><p className="font-medium">{order.customerName}</p><p className="mt-0.5 text-xs text-[#85857F]">{order.whatsapp}</p></td>
                    <td className="px-5 py-4">{(order.items ?? []).reduce((sum, item) => sum + item.quantity, 0)} item</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{money(order.totalPrice)}</td>
                    <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : order.paymentStatus === "FAILED" || order.paymentStatus === "EXPIRED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{paymentLabel(order.paymentStatus)}</span></td>
                    <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(order.status)}`}>{statusLabel(order.status)}</span></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#777771]">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QUICK ACTION */}
      <section className="flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-[#EAEAE6] p-6 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#62625C]">Kelola toko</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">Pastikan menu dan pesanan selalu terbarui.</h2>
          <p className="mt-1 text-sm text-[#666660]">Perbarui produk atau proses pesanan pelanggan berikutnya.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/admin/products" className="rounded-xl bg-[#171715] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#373733]">Kelola produk</Link>
          <Link href="/admin/orders" className="rounded-xl border border-[#D1D1CC] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#F7F7F5]">Buka pesanan</Link>
        </div>
      </section>
    </div>
  );
}
