"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: number;
  customerName: string;
  whatsapp: string;
  address?: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
};
type Customer = {
  key: string;
  name: string;
  whatsapp: string;
  address: string;
  orderCount: number;
  paidTotal: number;
  lastOrder: string;
};
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders", { cache: "no-store", credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Gagal memuat data pelanggan.");
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error("Load customers error:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat data pelanggan.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const customers = useMemo(() => {
    const grouped = new Map<string, Customer>();
    for (const order of orders) {
      const phone = (order.whatsapp ?? "").trim();
      const key = phone || `name:${(order.customerName ?? "Pelanggan").trim().toLowerCase()}`;
      const customer = grouped.get(key) ?? {
        key,
        name: order.customerName || "Pelanggan",
        whatsapp: phone,
        address: order.address || "",
        orderCount: 0,
        paidTotal: 0,
        lastOrder: order.createdAt,
      };
      customer.orderCount += 1;
      if (order.paymentStatus === "PAID") customer.paidTotal += order.totalPrice;
      if (new Date(order.createdAt).getTime() > new Date(customer.lastOrder).getTime()) {
        customer.lastOrder = order.createdAt;
        customer.name = order.customerName || customer.name;
        customer.address = order.address || customer.address;
      }
      grouped.set(key, customer);
    }
    return Array.from(grouped.values()).sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [orders]);

  const filtered = customers.filter((customer) => [customer.name, customer.whatsapp, customer.address].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));
  const totalSpend = customers.reduce((sum, customer) => sum + customer.paidTotal, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Relasi pelanggan</p><h1 className="mt-2 text-3xl font-black tracking-tight">Pelanggan</h1><p className="mt-1.5 text-sm text-[#73736D]">Ringkasan pelanggan berdasarkan informasi yang tersimpan pada pesanan.</p></div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <section className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Total pelanggan", value: loading ? "—" : customers.length.toLocaleString("id-ID"), note: "Dikelompokkan dari nomor WhatsApp" }, { label: "Total pesanan", value: loading ? "—" : totalOrders.toLocaleString("id-ID"), note: "Termasuk semua status pesanan" }, { label: "Belanja terbayar", value: loading ? "—" : money(totalSpend), note: "Akumulasi transaksi berstatus dibayar" }].map((metric) => <article key={metric.label} className="rounded-2xl border border-[#E7E7E3] bg-white p-5"><p className="text-sm text-[#777771]">{metric.label}</p><p className="mt-2 text-2xl font-black">{metric.value}</p><p className="mt-1.5 text-xs text-[#85857F]">{metric.note}</p></article>)}
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#EEEEEB] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-bold">Daftar pelanggan</h2><p className="mt-1 text-xs text-[#85857F]">Informasi diambil dari data checkout yang sudah tersedia.</p></div><label className="flex w-full max-w-sm items-center gap-2 rounded-xl bg-[#F3F3F0] px-3.5 py-2.5"><svg viewBox="0 0 24 24" className="h-4 w-4 text-[#777771]" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, nomor, alamat..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#999992]" /></label></div>
        {loading ? <div className="px-6 py-16 text-center text-sm text-[#777771]">Memuat pelanggan...</div> : filtered.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-semibold">Belum ada pelanggan yang cocok</p><p className="mt-1 text-sm text-[#85857F]">Pelanggan muncul setelah data pesanan tersedia.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left text-sm"><thead className="bg-[#F7F7F5] text-xs text-[#666660]"><tr><th className="px-5 py-3.5 font-semibold">Pelanggan</th><th className="px-5 py-3.5 font-semibold">WhatsApp</th><th className="px-5 py-3.5 font-semibold">Alamat terakhir</th><th className="px-5 py-3.5 font-semibold">Pesanan</th><th className="px-5 py-3.5 font-semibold">Total dibayar</th><th className="px-5 py-3.5 font-semibold">Pesanan terakhir</th></tr></thead><tbody className="divide-y divide-[#EEEEEB]">{filtered.map((customer) => <tr key={customer.key} className="hover:bg-[#FAFAF8]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEEEB] text-xs font-bold">{customer.name.slice(0, 1).toUpperCase()}</span><span className="font-semibold">{customer.name}</span></div></td><td className="whitespace-nowrap px-5 py-4 text-[#555550]">{customer.whatsapp || "—"}</td><td className="max-w-[240px] px-5 py-4"><span className="line-clamp-2 text-xs text-[#666660]">{customer.address || "—"}</span></td><td className="px-5 py-4 font-semibold">{customer.orderCount}</td><td className="whitespace-nowrap px-5 py-4 font-semibold">{money(customer.paidTotal)}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-[#777771]">{new Date(customer.lastOrder).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="text-xs leading-5 text-[#85857F]">Catatan: belum terlihat endpoint pelanggan khusus di struktur admin yang dikirim. Karena itu, data pelanggan dirangkum dari pesanan dan dikelompokkan menggunakan nomor WhatsApp ketika tersedia.</p>
    </div>
  );
}
