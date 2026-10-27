"use client";

import { useEffect, useMemo, useState } from "react";

type OrderItem = { id: number; productId: number; name: string; packaging: string; price: number; quantity: number };
type Order = {
  id: number;
  customerName: string;
  whatsapp: string;
  address: string;
  note?: string | null;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};
type Filter = "ALL" | "PENDING" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED";

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const statusLabel: Record<string, string> = { PENDING: "Menunggu", PROCESSING: "Diproses", SHIPPING: "Dikirim", COMPLETED: "Selesai", CANCELLED: "Dibatalkan" };
const paymentLabel: Record<string, string> = { PENDING: "Menunggu bayar", PAID: "Dibayar", FAILED: "Gagal", EXPIRED: "Kedaluwarsa" };
const statusTone: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", PROCESSING: "bg-blue-100 text-blue-800", SHIPPING: "bg-violet-100 text-violet-800", COMPLETED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-rose-100 text-rose-800" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/orders", { cache: "no-store", credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Gagal memuat pesanan.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("Load orders error:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialSearch = new URLSearchParams(window.location.search).get("search");
    if (initialSearch) setSearch(initialSearch);
    loadOrders();
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      setUpdatingId(id);
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengubah status pesanan.");
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    } catch (err) {
      console.error("Update order status error:", err);
      window.alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(() => ({
    ALL: orders.length,
    PENDING: orders.filter((order) => order.status === "PENDING").length,
    PROCESSING: orders.filter((order) => order.status === "PROCESSING").length,
    SHIPPING: orders.filter((order) => order.status === "SHIPPING").length,
    COMPLETED: orders.filter((order) => order.status === "COMPLETED").length,
    CANCELLED: orders.filter((order) => order.status === "CANCELLED").length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...orders]
      .filter((order) => filter === "ALL" || order.status === filter)
      .filter((order) => !query || [String(order.id), order.customerName, order.whatsapp, order.address, ...(order.items ?? []).map((item) => item.name)].some((value) => value?.toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter, search]);

  const filters: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Semua" },
    { value: "PENDING", label: "Menunggu" },
    { value: "PROCESSING", label: "Diproses" },
    { value: "SHIPPING", label: "Dikirim" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "CANCELLED", label: "Dibatalkan" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Operasional</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Pesanan</h1>
          <p className="mt-1.5 text-sm text-[#73736D]">Kelola pesanan dari pembayaran hingga selesai diantar.</p>
        </div>
        <button type="button" onClick={loadOrders} className="rounded-xl border border-[#E1E1DD] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F7F7F5]">↻ Refresh data</button>
      </div>

      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {filters.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-2xl border p-4 text-left transition ${filter === item.value ? "border-[#171715] bg-[#171715] text-white" : "border-[#E7E7E3] bg-white hover:border-[#B7B7B0]"}`}>
            <p className={`text-xs ${filter === item.value ? "text-white/65" : "text-[#777771]"}`}>{item.label}</p>
            <p className="mt-1.5 text-2xl font-black">{loading ? "—" : counts[item.value]}</p>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#EEEEEB] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="font-bold">Daftar pesanan</h2><p className="mt-1 text-xs text-[#85857F]">Status pembayaran terpisah dari status pemrosesan pesanan.</p></div>
          <label className="flex w-full max-w-sm items-center gap-2 rounded-xl bg-[#F3F3F0] px-3.5 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#777771]" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor, pelanggan, produk..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#999992]" />
          </label>
        </div>

        {error && <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {loading ? <div className="px-6 py-16 text-center text-sm text-[#777771]">Memuat data pesanan...</div> : filteredOrders.length === 0 ? (
          <div className="px-6 py-16 text-center"><p className="font-semibold">Tidak ada pesanan ditemukan</p><p className="mt-1 text-sm text-[#85857F]">Coba ubah filter atau kata pencarian.</p></div>
        ) : (
          <div className="divide-y divide-[#EEEEEB]">
            {filteredOrders.map((order) => (
              <article key={order.id} className="p-5 transition hover:bg-[#FCFCFA] sm:p-6">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-black">Order #{order.id}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[order.status] ?? "bg-gray-100 text-gray-700"}`}>{statusLabel[order.status] ?? order.status}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : order.paymentStatus === "FAILED" || order.paymentStatus === "EXPIRED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{paymentLabel[order.paymentStatus] ?? order.paymentStatus}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#85857F]">{new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#888882]">Pelanggan</p><p className="mt-1 text-sm font-semibold">{order.customerName}</p><p className="mt-0.5 text-xs text-[#777771]">{order.whatsapp}</p></div>
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#888882]">Alamat pengiriman</p><p className="mt-1 line-clamp-2 text-sm text-[#555550]">{order.address || "—"}</p></div>
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#888882]">Total transaksi</p><p className="mt-1 text-sm font-black">{money(order.totalPrice)}</p><p className="mt-0.5 text-xs text-[#777771]">{(order.items ?? []).reduce((sum, item) => sum + item.quantity, 0)} item</p></div>
                    </div>
                    <div className="mt-4 rounded-xl bg-[#F6F6F3] p-3.5">
                      <p className="mb-2 text-xs font-semibold text-[#676760]">Ringkasan item</p>
                      <div className="flex flex-wrap gap-2">
                        {(order.items ?? []).map((item) => <span key={item.id} className="rounded-lg border border-[#E4E4E0] bg-white px-2.5 py-1.5 text-xs text-[#44443F]">{item.name} · {item.quantity}× · {item.packaging === "BOTTLE" ? "Bottle" : "Cup"}</span>)}
                      </div>
                      {order.note && <p className="mt-3 text-xs text-[#666660]"><strong>Catatan:</strong> {order.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:w-[190px] xl:justify-end">
                    {order.status === "PENDING" && <><button type="button" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "PROCESSING")} className="rounded-xl bg-[#171715] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#3B3B36] disabled:opacity-50">Proses pesanan</button><button type="button" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "CANCELLED")} className="rounded-xl border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Batalkan</button></>}
                    {order.status === "PROCESSING" && <><button type="button" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "SHIPPING")} className="rounded-xl bg-[#171715] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#3B3B36] disabled:opacity-50">Tandai dikirim</button><button type="button" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "CANCELLED")} className="rounded-xl border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Batalkan</button></>}
                    {order.status === "SHIPPING" && <button type="button" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "COMPLETED")} className="rounded-xl bg-emerald-700 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Tandai selesai</button>}
                    {(order.status === "COMPLETED" || order.status === "CANCELLED") && <span className="self-start rounded-xl bg-[#F0F0ED] px-3.5 py-2.5 text-xs font-semibold text-[#63635D]">{order.status === "COMPLETED" ? "Pesanan selesai" : "Pesanan dibatalkan"}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && filteredOrders.length > 0 && <div className="border-t border-[#EEEEEB] bg-[#FAFAF8] px-5 py-3.5 text-xs text-[#777771]">Menampilkan {filteredOrders.length} dari {orders.length} pesanan.</div>}
      </section>
    </div>
  );
}
