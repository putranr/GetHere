"use client";

import { useEffect, useState } from "react";
import {
  BottlePackagingIcon,
  CoffeeMugIcon,
  CupPackagingIcon,
} from "@/components/PackagingIcons";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  cupPrice?: number | null;
  bottlePrice?: number | null;
  discountPercent: number;
  image?: string | null;
  isAvailable: boolean;
  category: "COFFEE" | "NON_COFFEE";
};

type ProductForm = {
  name: string;
  description: string;
  image: string;
  price: string;
  cupPrice: string;
  bottlePrice: string;
  discountPercent: string;
  isAvailable: boolean;
  category: "COFFEE" | "NON_COFFEE";
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  image: "",
  price: "",
  cupPrice: "",
  bottlePrice: "",
  discountPercent: "0",
  isAvailable: true,
  category: "COFFEE",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Gagal mengambil data produk."
        );
      }

      setProducts(data.products);
    } catch (error) {
      console.error("LOAD PRODUCTS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data produk."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  function openEditForm(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description || "",
      image: product.image || "",
      price: String(product.price),
      cupPrice: product.cupPrice == null ? "" : String(product.cupPrice),
      bottlePrice: product.bottlePrice == null ? "" : String(product.bottlePrice),
      discountPercent: String(product.discountPercent),
      isAvailable: product.isAvailable,
      category: product.category,
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  // ==========================================
  // CLOSE FORM
  // ==========================================

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // ==========================================
  // FORM CHANGE
  // ==========================================

  function updateForm(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const price = Number(form.price);
      const cupPrice = Number(form.cupPrice);
      const bottlePrice = Number(form.bottlePrice);
      const discountPercent = Number(form.discountPercent);

      if (!form.name.trim()) {
        throw new Error("Nama produk wajib diisi.");
      }

      if (!Number.isInteger(price) || price < 0) {
        throw new Error("Harga dasar produk tidak valid.");
      }

      if (form.cupPrice.trim() === "" || !Number.isInteger(cupPrice) || cupPrice < 0) {
        throw new Error("Harga Cup wajib diisi dengan angka yang valid.");
      }

      if (form.bottlePrice.trim() === "" || !Number.isInteger(bottlePrice) || bottlePrice < 0) {
        throw new Error("Harga Bottle wajib diisi dengan angka yang valid.");
      }

      if (
        !Number.isInteger(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        throw new Error(
          "Diskon harus berada di antara 0 sampai 100%."
        );
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image: form.image.trim() || null,
        price,
        cupPrice,
        bottlePrice,
        discountPercent,
        isAvailable: form.isAvailable,
        category: form.category,
      };
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `/api/products/${editingId}`
          : "/api/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Gagal menyimpan produk."
        );
      }

      setMessage(
        isEditing
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan."
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadProducts();
    } catch (error) {
      console.error("SAVE PRODUCT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus produk "${product.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Gagal menghapus produk."
        );
      }

      setMessage("Produk berhasil dihapus.");

      await loadProducts();
    } catch (error) {
      console.error("DELETE PRODUCT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menghapus produk."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // FORMAT RUPIAH
  // ==========================================

  function formatRupiah(value: number) {
    return `Rp${value.toLocaleString("id-ID")}`;
  }

  // ==========================================
  // HITUNG HARGA SETELAH DISKON
  // ==========================================

  function discountedPrice(product: Product, originalPrice = product.price) {
    if (product.discountPercent <= 0) return originalPrice;
    return Math.round(originalPrice - (originalPrice * product.discountPercent) / 100);
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-full bg-transparent px-0 py-0 text-[#171717]">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              GET-HERE ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Kelola Produk
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Tambahkan, ubah, hapus, dan atur diskon produk.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Tambah Produk
          </button>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FORM */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Isi informasi produk di bawah ini.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-sm text-gray-500 hover:text-black"
              >
                Tutup
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5"
            >
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nama Produk
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Butterscotch"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Caption / Deskripsi
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Deskripsi singkat produk..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              {/* PRODUCT IMAGE */}
              <div>
                <label className="mb-2 block text-sm font-medium">URL foto produk</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(event) => updateForm("image", event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                />
                {form.image && (
                  <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-[#E5E5E1] bg-[#F2F2EF]">
                    <img src={form.image} alt="Preview produk" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Satu foto utama dipakai untuk kartu produk pada website.</p>
              </div>

              {/* CATEGORY */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Kategori Menu
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value as
                          | "COFFEE"
                          | "NON_COFFEE"
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  >
                    <option value="COFFEE">
                      ☕ Coffee
                    </option>

                    <option value="NON_COFFEE">
                      🥤 Non Coffee
                    </option>
                  </select>

                  <p className="mt-1 text-xs text-gray-500">
                    Tentukan menu ini termasuk Coffee atau Non Coffee.
                  </p>
                </div>

              {/* BASE PRICE, PACKAGING PRICES + DISCOUNT */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Harga dasar</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                    placeholder="22000"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Harga Cup</label>
                  <input
                    type="number"
                    min="0"
                    value={form.cupPrice}
                    onChange={(event) => updateForm("cupPrice", event.target.value)}
                    placeholder="22500"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Harga Bottle</label>
                  <input
                    type="number"
                    min="0"
                    value={form.bottlePrice}
                    onChange={(event) => updateForm("bottlePrice", event.target.value)}
                    placeholder="25000"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Diskon (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={(event) => updateForm("discountPercent", event.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>
              </div>

              {/* AVAILABILITY */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    updateForm(
                      "isAvailable",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium">
                    Produk tersedia
                  </p>

                  <p className="text-xs text-gray-500">
                    Produk dapat dibeli oleh customer.
                  </p>
                </div>
              </label>

              {/* BUTTON */}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium hover:bg-gray-100"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PRODUCT LIST */}

        <div className="rounded-2xl border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold">
              Daftar Produk
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {products.length} produk terdaftar
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Memuat produk...
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">
                Belum ada produk.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Tambahkan produk pertama kamu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.map((product) => (
            <div
              key={product.id}
                  className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* PRODUCT INFO */}

                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : product.category === "COFFEE" ? (
                        <CoffeeMugIcon className="h-5 w-5" />
                      ) : (
                        <CupPackagingIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">
                          {product.name}
                        </h3>

                        {product.discountPercent > 0 && (
                          <span className="rounded-full bg-black px-2 py-1 text-[10px] font-medium text-white">
                            -{product.discountPercent}%
                          </span>
                        )}

                        {!product.isAvailable && (
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-medium text-gray-600">
                            Tidak tersedia
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {product.description ||
                          "Tidak ada deskripsi."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F1EE] px-2.5 py-1.5 text-[#33332F]"><CupPackagingIcon className="h-3.5 w-3.5" />Cup: {product.cupPrice == null ? "—" : formatRupiah(discountedPrice(product, product.cupPrice))}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F1EE] px-2.5 py-1.5 text-[#33332F]"><BottlePackagingIcon className="h-3.5 w-3.5" />Bottle: {product.bottlePrice == null ? "—" : formatRupiah(discountedPrice(product, product.bottlePrice))}</span>
                      </div>
                      {product.discountPercent > 0 && (
                        <p className="mt-1 text-[11px] text-gray-500">Diskon {product.discountPercent}% · harga dasar {formatRupiah(product.price)}</p>
                      )}
                    </div>
                  </div>

                  {/* ACTION */}

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(product)
                      }
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product)
                      }
                      disabled={
                        deletingId === product.id
                      }
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === product.id
                        ? "Menghapus..."
                        : "Hapus"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}