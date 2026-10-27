"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottlePackagingIcon, CoffeeMugIcon, CupPackagingIcon } from "@/components/PackagingIcons";

type Product = {
  id: number;
  name: string;
  category: "COFFEE" | "NON_COFFEE";
  image?: string | null;
  isAvailable: boolean;
};

export default function AdminCategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store", credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Gagal memuat kategori produk.");
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error("Load categories error:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat kategori produk.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = [
    { key: "COFFEE" as const, name: "Coffee", description: "Minuman berbasis kopi.", Icon: CoffeeMugIcon },
    { key: "NON_COFFEE" as const, name: "Non Coffee", description: "Pilihan minuman non-kopi.", Icon: CupPackagingIcon },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Katalog</p><h1 className="mt-2 text-3xl font-black tracking-tight">Kategori</h1><p className="mt-1.5 text-sm text-[#73736D]">Lihat pengelompokan menu yang digunakan pada katalog GetHere.</p></div>
        <Link href="/admin/products" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#171715] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3B3B36]">Kelola produk <span aria-hidden="true">↗</span></Link>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-2">
        {categories.map(({ key, name, description, Icon }) => {
          const items = products.filter((product) => product.category === key);
          const availableCount = items.filter((product) => product.isAvailable).length;
          return (
            <article key={key} className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
              <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEB] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F1EE] text-[#171715]"><Icon className="h-7 w-7" /></div>
                  <div><h2 className="text-xl font-black">{name}</h2><p className="mt-1 text-sm text-[#777771]">{description}</p></div>
                </div>
                <span className="rounded-full bg-[#F1F1EE] px-3 py-1.5 text-xs font-semibold text-[#555550]">{loading ? "—" : `${items.length} produk`}</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#EEEEEB]">
                <div className="p-5"><p className="text-xs text-[#85857F]">Total produk</p><p className="mt-1 text-2xl font-black">{loading ? "—" : items.length}</p></div>
                <div className="p-5"><p className="text-xs text-[#85857F]">Tersedia untuk dipesan</p><p className="mt-1 text-2xl font-black">{loading ? "—" : availableCount}</p></div>
              </div>
              <div className="divide-y divide-[#EEEEEB] px-6">
                {loading ? <p className="py-6 text-sm text-[#85857F]">Memuat produk...</p> : items.length === 0 ? <p className="py-6 text-sm text-[#85857F]">Belum ada produk pada kategori ini.</p> : items.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 py-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F2F2EF] text-[#555550]">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : key === "COFFEE" ? <CoffeeMugIcon className="h-5 w-5" /> : <BottlePackagingIcon className="h-5 w-5" />}</div>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>{product.isAvailable ? "Aktif" : "Nonaktif"}</span>
                  </div>
                ))}
              </div>
              {items.length > 5 && <div className="border-t border-[#EEEEEB] bg-[#FAFAF8] px-6 py-3 text-xs text-[#777771]">+ {items.length - 5} produk lainnya</div>}
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F1EE] text-lg">i</span><div><h2 className="font-bold">Struktur kategori saat ini</h2><p className="mt-1 text-sm leading-6 text-[#777771]">Kategori mengikuti struktur data produk yang tersedia saat ini: <strong>Coffee</strong> dan <strong>Non Coffee</strong>. Menambahkan kategori baru memerlukan perubahan pada model data dan API, jadi halaman ini menampilkan ringkasan kategori yang benar-benar tersimpan pada produk, bukan data kategori tiruan.</p></div></div>
      </section>
    </div>
  );
}
