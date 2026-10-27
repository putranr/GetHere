"use client";

import { useEffect, useMemo, useState } from "react";

type OrderItem = { id: number; productId: number; name: string; price: number; quantity: number };
type Order = { id: number; customerName: string; totalPrice: number; status: string; paymentStatus: string; createdAt: string; items: OrderItem[] };
type Product = { id: number; name: string; category: "COFFEE" | "NON_COFFEE" };
type Range = "7" | "30" | "all";
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<Range>("7");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    async function loadReports() {
      try {
        const [ordersResponse, productsResponse] = await Promise.all([
          fetch("/api/orders", { cache: "no-store", credentials: "include" }),
          fetch("/api/products", { cache: "no-store", credentials: "include" }),
        ]);
        const [ordersData, productsData] = await Promise.all([ordersResponse.json(), productsResponse.json()]);
        if (!ordersResponse.ok || !ordersData.success) throw new Error(ordersData.message || "Gagal memuat laporan pesanan.");
        if (!productsResponse.ok || !productsData.success) throw new Error(productsData.message || "Gagal memuat data produk.");
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      } catch (err) {
        console.error("Reports load error:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
  const filteredOrders = useMemo(() => {
    if (range === "all" || !now) return paidOrders;
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (Number(range) - 1));
    return paidOrders.filter((order) => new Date(order.createdAt) >= cutoff && new Date(order.createdAt) <= now);
  }, [paidOrders, range, now]);

  const revenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const itemsSold = filteredOrders.reduce((sum, order) => sum + (order.items ?? []).reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const averageOrder = filteredOrders.length ? revenue / filteredOrders.length : 0;

  const dailyData = useMemo(() => {
    if (!now) return [] as { label: string; revenue: number }[];
    const numberOfDays = range === "30" ? 30 : range === "all" ? 14 : 7;
    const days: { label: string; revenue: number }[] = [];
    for (let offset = numberOfDays - 1; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const dailyRevenue = filteredOrders.reduce((sum, order) => {
        const created = new Date(order.createdAt);
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth() && created.getDate() === date.getDate() ? sum + order.totalPrice : sum;
      }, 0);
      days.push({ label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), revenue: dailyRevenue });
    }
    return days;
  }, [now, range, filteredOrders]);
  const maxDailyRevenue = Math.max(1, ...dailyData.map((day) => day.revenue));

  const topProducts = useMemo(() => {
    const grouped = new Map<number, { id: number; name: string; quantity: number; revenue: number }>();
    filteredOrders.forEach((order) => (order.items ?? []).forEach((item) => {
      const entry = grouped.get(item.productId) ?? { id: item.productId, name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.price * item.quantity;
      grouped.set(item.productId, entry);
    }));
    return [...grouped.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [filteredOrders]);

  const categorySales = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product.category]));
    const totals = { COFFEE: 0, NON_COFFEE: 0 };
    filteredOrders.forEach((order) => (order.items ?? []).forEach((item) => {
      const category = productMap.get(item.productId);
      if (category === "COFFEE") totals.COFFEE += item.price * item.quantity;
      else if (category === "NON_COFFEE") totals.NON_COFFEE += item.price * item.quantity;
    }));
    return totals;
  }, [filteredOrders, products]);

  const selectedLabel = range === "7" ? "7 hari terakhir" : range === "30" ? "30 hari terakhir" : "Data tersedia";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Analitik bisnis</p><h1 className="mt-2 text-3xl font-black tracking-tight">Laporan</h1><p className="mt-1.5 text-sm text-[#73736D]">Lihat performa penjualan dan kontribusi produk pada periode pilihan.</p></div><label className="flex w-fit items-center gap-2 rounded-xl border border-[#E3E3DF] bg-white px-3.5 py-2.5 text-sm"><span className="text-[#777771]">Periode</span><select value={range} onChange={(event) => setRange(event.target.value as Range)} className="bg-transparent font-semibold outline-none"><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option><option value="all">Semua data tersedia</option></select></label></div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Total penjualan", value: money(revenue), note: "Pembayaran berhasil" }, { label: "Pesanan dibayar", value: filteredOrders.length.toLocaleString("id-ID"), note: selectedLabel }, { label: "Item terjual", value: itemsSold.toLocaleString("id-ID"), note: "Jumlah unit dalam pesanan dibayar" }, { label: "Rata-rata pesanan", value: money(averageOrder), note: "Penjualan dibagi pesanan dibayar" }].map((metric) => <article key={metric.label} className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6"><p className="text-sm text-[#777771]">{metric.label}</p><p className="mt-2 break-words text-2xl font-black tracking-tight">{loading ? "Memuat..." : metric.value}</p><p className="mt-1.5 text-xs text-[#85857F]">{metric.note}</p></article>)}
      </section>

      <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6"><div><h2 className="text-lg font-bold">Tren penjualan</h2><p className="mt-1 text-sm text-[#85857F]">Omzet harian dari pembayaran berstatus dibayar · {selectedLabel}.</p></div><div className="mt-6 flex h-[260px] items-end gap-1.5 overflow-x-auto border-b border-[#E9E9E5] pb-0 sm:gap-2">{dailyData.map((day, index) => { const height = day.revenue === 0 ? 3 : Math.max(8, (day.revenue / maxDailyRevenue) * 205); return <div key={`${day.label}-${index}`} className="group flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-2"><div className="pointer-events-none hidden rounded-lg bg-[#171715] px-2 py-1.5 text-center text-[10px] text-white group-hover:block"><span className="block whitespace-nowrap">{money(day.revenue)}</span></div><div title={`${day.label}: ${money(day.revenue)}`} className={`w-full max-w-[34px] rounded-t-md transition ${day.revenue > 0 ? "bg-[#272725] hover:bg-[#555550]" : "bg-[#E7E7E3]"}`} style={{ height: `${height}px` }} /><span className="max-w-full truncate pb-2 text-[9px] text-[#85857F] sm:text-[10px]">{range === "30" && index % 3 !== 0 ? "" : day.label}</span></div>; })}</div><div className="mt-3 flex items-center gap-2 text-xs text-[#85857F]"><span className="h-2.5 w-2.5 rounded-sm bg-[#272725]" /> Omzet harian</div>{!loading && dailyData.every((day) => day.revenue === 0) && <p className="mt-4 text-sm text-[#85857F]">Belum ada transaksi dibayar pada rentang tanggal ini.</p>}</section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6"><div><h2 className="text-lg font-bold">Produk terlaris</h2><p className="mt-1 text-sm text-[#85857F]">Diurutkan berdasarkan jumlah unit terjual.</p></div>{topProducts.length === 0 ? <p className="py-10 text-center text-sm text-[#85857F]">Belum ada data produk terjual.</p> : <div className="mt-4 divide-y divide-[#EEEEEB]">{topProducts.map((product, index) => <div key={product.id} className="flex items-center gap-3 py-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F0ED] text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="mt-0.5 text-xs text-[#85857F]">{product.quantity} item terjual</p></div><p className="text-sm font-bold">{money(product.revenue)}</p></div>)}</div>}</section>

        <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6"><div><h2 className="text-lg font-bold">Penjualan per kategori</h2><p className="mt-1 text-sm text-[#85857F]">Nilai item dari pesanan yang sudah dibayar.</p></div>{(() => { const total = categorySales.COFFEE + categorySales.NON_COFFEE; const parts = [{ name: "Coffee", value: categorySales.COFFEE, color: "bg-[#292926]" }, { name: "Non Coffee", value: categorySales.NON_COFFEE, color: "bg-[#B6B6AF]" }]; return <div className="mt-5 space-y-5">{parts.map((part) => <div key={part.name}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${part.color}`} /><span className="text-sm font-semibold">{part.name}</span></div><span className="text-sm font-bold">{money(part.value)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#EEEEEB]"><div className={`h-full rounded-full ${part.color}`} style={{ width: `${total ? (part.value / total) * 100 : 0}%` }} /></div><p className="mt-1 text-right text-xs text-[#85857F]">{total ? Math.round(part.value / total * 100) : 0}%</p></div>)}</div>; })()}</section>
      </div>

      <p className="text-xs leading-5 text-[#85857F]">Laporan omzet menggunakan pesanan dengan status pembayaran PAID. Periode dihitung berdasarkan tanggal pembuatan pesanan yang dikembalikan API.</p>
    </div>
  );
}
