"use client";

import { useEffect, useState } from "react";

type Packaging = "CUP" | "BOTTLE";

type OrderItem = {
  id: number;
  productId: number;
  name: string;
  packaging: string;
  originalPrice: number;
  discountPercent: number;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customerName: string;
  whatsapp: string;
  address: string;
  note: string | null;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

type Product = {
  id: number;
  name: string;
  description?: string | null;

  // FOTO PRODUK
  image?: string | null;

  // CATEGORY
  category: "COFFEE" | "NON_COFFEE";

  // HARGA
  price: number;
  cupPrice?: number | null;
  bottlePrice?: number | null;

  discountPercent: number;
  isAvailable: boolean;
};

export default function AdminPage() {
  /* =====================================================
     ORDER
  ===================================================== */

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // SALES REPORT
  // ==========================================================

  type ReportPeriod = "DAY" | "WEEK" | "MONTH";

  const [reportPeriod, setReportPeriod] =
    useState<ReportPeriod>("DAY");

  function isSamePeriod(
    dateString: string,
    period: ReportPeriod
  ) {
    const date = new Date(dateString);
    const now = new Date();

    if (period === "DAY") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }

    if (period === "MONTH") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    // WEEK = Senin sampai Minggu
    const currentDay = now.getDay();

    const diffToMonday =
      currentDay === 0
        ? 6
        : currentDay - 1;

    const monday = new Date(now);

    monday.setHours(0, 0, 0, 0);
    monday.setDate(
      now.getDate() - diffToMonday
    );

    const sunday = new Date(monday);

    sunday.setDate(
      monday.getDate() + 6
    );

    sunday.setHours(
      23,
      59,
      59,
      999
    );

    return (
      date >= monday &&
      date <= sunday
    );
  }

  const paidOrders = orders.filter(
    (order) =>
      order.paymentStatus === "PAID"
  );

  const reportOrders = paidOrders.filter(
    (order) =>
      isSamePeriod(
        order.createdAt,
        reportPeriod
      )
  );

  const reportRevenue =
    reportOrders.reduce(
      (total, order) =>
        total + order.totalPrice,
      0
    );

  const reportProductsSold =
    reportOrders.reduce(
      (total, order) =>
        total +
        order.items.reduce(
          (itemTotal, item) =>
            itemTotal + item.quantity,
          0
        ),
      0
    );

  const bestSellingProducts = Object.values(
    reportOrders
      .flatMap((order) => order.items)
      .reduce(
        (
          result,
          item
        ) => {
          if (!result[item.productId]) {
            result[item.productId] = {
              productId:
                item.productId,
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }

          result[item.productId].quantity +=
            item.quantity;

          result[item.productId].revenue +=
            item.price * item.quantity;

          return result;
        },
        {} as Record<
          number,
          {
            productId: number;
            name: string;
            quantity: number;
            revenue: number;
          }
        >
      )
  )
    .sort(
      (a, b) =>
        b.quantity - a.quantity
    )
    .slice(0, 5);

    async function fetchOrders() {
      try {
        setLoading(true);

        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error("Gagal mengambil order:", error);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      fetchOrders();
    }, []);

    async function updateStatus(id: number, status: string) {
      try {
        const response = await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Gagal mengubah status.");
          return;
        }

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status,
                }
              : order
          )
        );
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan.");
      }
    }

  /* =====================================================
     PRODUCT
  ===================================================== */

  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [productName, setProductName] =
    useState("");

  const [productDescription, setProductDescription] =
    useState("");

  const [productPrice, setProductPrice] =
    useState("");

  const [productCategory, setProductCategory] =
    useState<"COFFEE" | "NON_COFFEE">("COFFEE");

  const [productCupPrice, setProductCupPrice] =
    useState("");

  const [productBottlePrice, setProductBottlePrice] =
    useState("");

  const [productDiscount, setProductDiscount] =
    useState("0");

  const [productAvailable, setProductAvailable] =
    useState(true);

  // FOTO UTAMA
  const [productImage, setProductImage] =
    useState("");

  const [savingProduct, setSavingProduct] =
    useState(false);

  async function fetchProducts() {
    try {
      setProductLoading(true);

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        console.error(
          "Gagal mengambil produk:",
          data.message
        );
      }
    } catch (error) {
      console.error(
        "Gagal mengambil produk:",
        error
      );
    } finally {
      setProductLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  /* =====================================================
     RESET FORM
  ===================================================== */

  function resetProductForm() {
    setProductName("");
    setProductDescription("");

    setProductCategory("COFFEE");

    setProductPrice("");
    setProductCupPrice("");
    setProductBottlePrice("");

    setProductDiscount("0");

    setProductAvailable(true);

    setProductImage("");

    setEditingProduct(null);
  }

  /* =====================================================
     ADD PRODUCT
  ===================================================== */

  function openAddProduct() {
    resetProductForm();
    setShowProductForm(true);
  }

  /* =====================================================
     EDIT PRODUCT
  ===================================================== */

  function openEditProduct(product: Product) {
    setEditingProduct(product);

    setProductName(product.name);

    setProductDescription(
      product.description || ""
    );

    setProductCategory(product.category);

    setProductPrice(
      String(product.price ?? "")
    );

    setProductCupPrice(
      product.cupPrice !== null &&
      product.cupPrice !== undefined
        ? String(product.cupPrice)
        : ""
    );

    setProductBottlePrice(
      product.bottlePrice !== null &&
      product.bottlePrice !== undefined
        ? String(product.bottlePrice)
        : ""
    );

    setProductDiscount(
      String(product.discountPercent ?? 0)
    );

    setProductAvailable(
      product.isAvailable
    );

    setProductImage(
      product.image || ""
    );

    setShowProductForm(true);
  }

  /* =====================================================
     SAVE PRODUCT
  ===================================================== */

  async function saveProduct(
    e: React.FormEvent
  ) {
      e.preventDefault();

      if (!productName.trim()) {
        alert("Nama produk wajib diisi.");
        return;
      }

      if (
        !productPrice ||
        Number(productPrice) < 0
      ) {
        alert("Harga produk tidak valid.");
        return;
      }

      if (
        !productCupPrice ||
        Number(productCupPrice) < 0
      ) {
        alert("Harga cup tidak valid.");
        return;
      }

      if (
        !productBottlePrice ||
        Number(productBottlePrice) < 0
      ) {
        alert("Harga bottle tidak valid.");
        return;
      }

      if (
        Number(productDiscount) < 0 ||
        Number(productDiscount) > 100
      ) {
        alert(
          "Diskon harus antara 0 sampai 100."
        );
        return;
      }

      try {
        setSavingProduct(true);

        const payload = {
          name: productName.trim(),

          description:
            productDescription.trim() || null,

          category: productCategory,

          price: Number(productPrice),

          discountPercent:
            Number(productDiscount),

          isAvailable:
            productAvailable,

          // SATU FOTO PRODUK SAJA
          image:
            productImage.trim() || null,

          // HARGA KEMASAN
          cupPrice:
            Number(productCupPrice),

          bottlePrice:
            Number(productBottlePrice),
        };

        let response: Response;

        if (editingProduct) {
          response = await fetch(
            `/api/products/${editingProduct.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );
        } else {
          response = await fetch(
            "/api/products",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Gagal menyimpan produk."
          );
          return;
        }

        alert(
          editingProduct
            ? "Produk berhasil diperbarui."
            : "Produk berhasil ditambahkan."
        );

        setShowProductForm(false);

        resetProductForm();

        await fetchProducts();
      } catch (error) {
        console.error(error);

        alert(
          "Terjadi kesalahan saat menyimpan produk."
        );
      } finally {
        setSavingProduct(false);
      }
    }
  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Yakin ingin menghapus produk "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Gagal menghapus produk."
        );
        return;
      }

      alert(
        "Produk berhasil dihapus."
      );

      await fetchProducts();
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat menghapus produk."
      );
    }
  }

  /* =====================================================
     FORMAT
  ===================================================== */

  function formatRupiah(price: number) {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(price);
  }

  function getStatusClass(
    status: string
  ) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";

      case "PROCESSING":
        return "bg-blue-100 text-blue-700";

      case "SHIPPING":
        return "bg-purple-100 text-purple-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  /* =====================================================
     HELPER FOTO ORDER
  ===================================================== */

  function getPackagingLabel(
    packaging: string
  ) {
    const normalized =
      packaging.toUpperCase();

    if (
      normalized === "BOTTLE" ||
      normalized === "BOTOL"
    ) {
      return "Bottle";
    }

    return "Cup";
  }

  function getOrderItemImage(
    item: OrderItem
  ) {
    const product =
      products.find(
        (product) =>
          product.id === item.productId
      );

    return product?.image || null;
  }

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "PENDING"
    ).length;

  const processingOrders =
    orders.filter(
      (order) =>
        order.status === "PROCESSING"
    ).length;

  const completedOrders =
    orders.filter(
      (order) =>
        order.status === "COMPLETED"
    ).length;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#211A16]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-[#E8E0D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
              GET-HERE COFFEE
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Admin Dashboard
            </h1>
          </div>

          <button
            onClick={async () => {
              await fetch(
                "/api/admin/logout",
                {
                  method: "POST",
                }
              );

              window.location.href =
                "/admin/login";
            }}
            className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
          >
            Logout
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid gap-4 md:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6F625A]">
              Total Pesanan
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalOrders}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6F625A]">
              Menunggu
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6F625A]">
              Diproses
            </p>

            <p className="mt-2 text-3xl font-bold">
              {processingOrders}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6F625A]">
              Selesai
            </p>

            <p className="mt-2 text-3xl font-bold">
              {completedOrders}
            </p>
          </div>

        </div>

        {/* ==========================================================
                LAPORAN PENJUALAN
            ========================================================== */}

            <section className="mt-8">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8A6348]">
                  Sales Report
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#261C17]">
                  Laporan Penjualan
                </h2>

                <p className="mt-1 text-sm text-[#756B63]">
                  Pantau performa penjualan GetHere
                  berdasarkan periode.
                </p>
              </div>

              {/* FILTER PERIODE */}

              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReportPeriod("DAY")
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    reportPeriod === "DAY"
                      ? "bg-[#40551F] text-white"
                      : "bg-white text-[#5F5147] border border-[#DED2C6]"
                  }`}
                >
                  Hari Ini
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setReportPeriod("WEEK")
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    reportPeriod === "WEEK"
                      ? "bg-[#40551F] text-white"
                      : "bg-white text-[#5F5147] border border-[#DED2C6]"
                  }`}
                >
                  Minggu Ini
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setReportPeriod("MONTH")
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    reportPeriod === "MONTH"
                      ? "bg-[#40551F] text-white"
                      : "bg-white text-[#5F5147] border border-[#DED2C6]"
                  }`}
                >
                  Bulan Ini
                </button>
              </div>

              {/* STATISTIK */}

              <div className="grid gap-4 md:grid-cols-3">

                {/* PESANAN */}

                <div className="rounded-3xl border border-[#E6DCD1] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#756B63]">
                        Pesanan
                      </p>

                      <h3 className="mt-2 text-3xl font-black text-[#261C17]">
                        {reportOrders.length}
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF3E5] text-xl">
                      🧾
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-[#756B63]">
                    Pesanan yang sudah dibayar
                  </p>
                </div>

                {/* PRODUK TERJUAL */}

                <div className="rounded-3xl border border-[#E6DCD1] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#756B63]">
                        Produk Terjual
                      </p>

                      <h3 className="mt-2 text-3xl font-black text-[#261C17]">
                        {reportProductsSold}
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E9DE] text-xl">
                      ☕
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-[#756B63]">
                    Total item yang terjual
                  </p>
                </div>

                {/* OMZET */}

                <div className="rounded-3xl border border-[#40551F] bg-[#40551F] p-6 text-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">
                        Omzet
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {formatRupiah(
                          reportRevenue
                        )}
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                      💰
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-white/70">
                    Total penjualan periode ini
                  </p>
                </div>

              </div>

              {/* PRODUK TERLARIS */}

              <div className="mt-5 rounded-3xl border border-[#E6DCD1] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#261C17]">
                      Produk Terlaris
                    </h3>

                    <p className="mt-1 text-xs text-[#756B63]">
                      Produk dengan jumlah penjualan
                      terbanyak.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EEF3E5] px-3 py-1 text-xs font-bold text-[#40551F]">
                    Top 5
                  </span>
                </div>

                {bestSellingProducts.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#756B63]">
                    Belum ada penjualan pada
                    periode ini.
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-[#EEE6DE]">
                    {bestSellingProducts.map(
                      (product, index) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between gap-4 py-4"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1E9E0] text-sm font-black text-[#6D321B]">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#261C17]">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#756B63]">
                                {product.quantity} item
                                terjual
                              </p>
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-[#40551F]">
                            {formatRupiah(
                              product.revenue
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

        {/* =================================================
            PRODUCT MANAGEMENT
        ================================================= */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <h2 className="text-2xl font-bold">
                Manajemen Produk
              </h2>

              <p className="mt-1 text-sm text-[#6F625A]">
                Kelola produk yang
                ditampilkan di GET-HERE
                Coffee.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={fetchProducts}
                className="rounded-full border border-[#DCCFC5] bg-white px-5 py-2 text-sm font-semibold transition hover:bg-[#F1EAE3]"
              >
                Refresh
              </button>

              <button
                onClick={openAddProduct}
                className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
              >
                + Tambah Produk
              </button>

            </div>

          </div>

          {productLoading ? (

            <div className="rounded-3xl bg-white p-10 text-center">
              <p className="text-[#6F625A]">
                Memuat produk...
              </p>
            </div>

          ) : products.length === 0 ? (

            <div className="rounded-3xl bg-white p-10 text-center">

              <p className="text-lg font-semibold">
                Belum ada produk.
              </p>

              <p className="mt-2 text-sm text-[#6F625A]">
                Tambahkan produk pertama
                GET-HERE Coffee.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {products.map(
                (product) => {

                  const finalPrice =
                    product.price -
                    product.price *
                      (product.discountPercent /
                        100);

                  return (

                    <div
                      key={product.id}
                      className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md"
                    >

                      {/* =================================
                          FOTO UTAMA
                      ================================= */}

                      <div
                        className="relative h-52 overflow-hidden bg-[#F1EAE3]"
                      >

                        {product.image ? (

                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full items-center justify-center text-5xl">
                            ☕
                          </div>

                        )}

                        {/* AVAILABLE BADGE */}

                        <div className="absolute left-3 top-3">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
                              product.isAvailable
                                ? "bg-green-100/90 text-green-700"
                                : "bg-red-100/90 text-red-700"
                            }`}
                          >
                            {product.isAvailable
                              ? "Tersedia"
                              : "Tidak tersedia"}
                          </span>

                        </div>

                      </div>

                      {/* =================================
                          PRODUCT CONTENT
                      ================================= */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="text-lg font-bold">
                              {product.name}
                            </h3>

                            <span
                              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                product.category ===
                                "COFFEE"
                                  ? "bg-[#E8DED3] text-[#6B4F3A]"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {product.category ===
                              "COFFEE"
                                ? "☕ Coffee"
                                : "🥤 Non Coffee"}
                            </span>

                            {product.description && (
                              <p className="mt-2 text-sm text-[#6F625A]">
                                {
                                  product.description
                                }
                              </p>
                            )}

                          </div>

                        </div>

                        {/* PRICE */}

                        <div className="mt-5">

                          {product.discountPercent >
                          0 ? (

                            <>
                              <p className="text-sm text-[#8A7A70] line-through">
                                {formatRupiah(
                                  product.price
                                )}
                              </p>

                              <div className="flex items-center gap-2">

                                <p className="text-xl font-bold">
                                  {formatRupiah(
                                    finalPrice
                                  )}
                                </p>

                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                                  -
                                  {
                                    product.discountPercent
                                  }
                                  %
                                </span>

                              </div>
                            </>

                          ) : (

                            <p className="text-xl font-bold">
                              {formatRupiah(
                                product.price
                              )}
                            </p>

                          )}

                        </div>

                        {/* QUICK PACKAGING INFO */}

                        <div className="mt-4 grid grid-cols-2 gap-2">

                          <div className="rounded-xl bg-[#F6F2EC] px-3 py-2">

                            <p className="text-[10px] font-bold uppercase text-[#8A7A70]">
                              Cup
                            </p>

                            <p className="mt-1 text-xs font-semibold">
                              {product.cupPrice !==
                              null &&
                              product.cupPrice !==
                              undefined
                                ? formatRupiah(
                                    product.cupPrice
                                  )
                                : "-"}
                            </p>

                          </div>

                          <div className="rounded-xl bg-[#F6F2EC] px-3 py-2">

                            <p className="text-[10px] font-bold uppercase text-[#8A7A70]">
                              Bottle
                            </p>

                            <p className="mt-1 text-xs font-semibold">
                              {product.bottlePrice !==
                              null &&
                              product.bottlePrice !==
                              undefined
                                ? formatRupiah(
                                    product.bottlePrice
                                  )
                                : "-"}
                            </p>

                          </div>

                        </div>

                        {/* ACTION */}

                        <div className="mt-5 flex gap-3">

                          <button
                            onClick={() =>
                              openEditProduct(
                                product
                              )
                            }
                            className="flex-1 rounded-full border border-[#DCCFC5] px-4 py-2 text-sm font-semibold transition hover:bg-[#F1EAE3]"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteProduct(
                                product
                              )
                            }
                            className="flex-1 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Hapus
                          </button>

                        </div>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </div>

        {/* =================================================
            PRODUCT FORM MODAL
        ================================================= */}

        {showProductForm && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">

              {/* HEADER MODAL */}

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    {editingProduct
                      ? "Edit Produk"
                      : "Tambah Produk"}
                  </h2>

                  <p className="mt-1 text-sm text-[#6F625A]">
                    Isi informasi produk
                    GET-HERE Coffee.
                  </p>

                </div>

                <button
                  onClick={() => {
                    setShowProductForm(
                      false
                    );
                    resetProductForm();
                  }}
                  className="text-xl text-[#6F625A] hover:text-[#211A16]"
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={saveProduct}
                className="space-y-5"
              >

                {/* NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Nama Produk
                  </label>

                  <input
                    type="text"
                    value={productName}
                    onChange={(e) =>
                      setProductName(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Matcha Latte"
                    className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Deskripsi
                  </label>

                  <textarea
                    value={
                      productDescription
                    }
                    onChange={(e) =>
                      setProductDescription(
                        e.target.value
                      )
                    }
                    placeholder="Deskripsi produk..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                  />

                </div>

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Kategori Menu
                  </label>

                  <select
                    value={
                      productCategory
                    }
                    onChange={(e) =>
                      setProductCategory(
                        e.target.value as
                          | "COFFEE"
                          | "NON_COFFEE"
                      )
                    }
                    className="w-full rounded-2xl border border-[#E8E0D8] bg-white px-4 py-3 outline-none focus:border-[#8A6348]"
                  >
                    <option value="COFFEE">
                      ☕ Coffee
                    </option>

                    <option value="NON_COFFEE">
                      🥤 Non Coffee
                    </option>
                  </select>

                  <p className="mt-1 text-xs text-[#8A7A70]">
                    Pilih kategori menu
                    untuk produk ini.
                  </p>

                </div>

                {/* HARGA */}

                <div className="space-y-4">

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Harga Dasar
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={productPrice}
                      onChange={(e) =>
                        setProductPrice(
                          e.target.value
                        )
                      }
                      placeholder="22000"
                      className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                    />

                    <p className="mt-1 text-xs text-[#8A7A70]">
                      Harga dasar produk.
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="mb-2 block text-sm font-semibold">
                        🥤 Harga Cup
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          productCupPrice
                        }
                        onChange={(e) =>
                          setProductCupPrice(
                            e.target.value
                          )
                        }
                        placeholder="22500"
                        className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                      />

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-semibold">
                        🍶 Harga Bottle
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          productBottlePrice
                        }
                        onChange={(e) =>
                          setProductBottlePrice(
                            e.target.value
                          )
                        }
                        placeholder="25000"
                        className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                      />

                    </div>

                  </div>

                </div>

                {/* DISCOUNT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Diskon (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      productDiscount
                    }
                    onChange={(e) =>
                      setProductDiscount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                  />

                </div>

                {/* =================================================
                    FOTO UTAMA
                ================================================= */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    🖼️ Foto Utama Produk
                  </label>

                  <input
                    type="text"
                    value={productImage}
                    onChange={(e) =>
                      setProductImage(
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none focus:border-[#8A6348]"
                  />

                  {productImage && (
                    <div className="mt-3 h-32 overflow-hidden rounded-2xl bg-[#F1EAE3]">

                      <img
                        src={productImage}
                        alt="Preview produk"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />

                    </div>
                  )}

                  <p className="mt-1 text-xs text-[#8A7A70]">
                    Foto yang tampil sebagai
                    foto utama kartu produk.
                  </p>

                </div>

                {/* AVAILABLE */}

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F6F2EC] p-4">

                  <input
                    type="checkbox"
                    checked={
                      productAvailable
                    }
                    onChange={(e) =>
                      setProductAvailable(
                        e.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />

                  <div>

                    <p className="text-sm font-semibold">
                      Produk tersedia
                    </p>

                    <p className="text-xs text-[#6F625A]">
                      Produk dapat dibeli
                      oleh pelanggan.
                    </p>

                  </div>

                </label>

                {/* BUTTON */}

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(
                        false
                      );
                      resetProductForm();
                    }}
                    className="flex-1 rounded-full border border-[#DCCFC5] px-5 py-3 text-sm font-semibold hover:bg-[#F1EAE3]"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      savingProduct
                    }
                    className="flex-1 rounded-full bg-[#211A16] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8A6348] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProduct
                      ? "Menyimpan..."
                      : editingProduct
                      ? "Simpan Perubahan"
                      : "Tambah Produk"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* =================================================
            ORDER LIST
        ================================================= */}

        <div className="mt-10">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                Daftar Pesanan
              </h2>

              <p className="mt-1 text-sm text-[#6F625A]">
                Kelola pesanan pelanggan
                GET-HERE Coffee.
              </p>

            </div>

            <button
              onClick={fetchOrders}
              className="rounded-full border border-[#DCCFC5] bg-white px-5 py-2 text-sm font-semibold transition hover:bg-[#F1EAE3]"
            >
              Refresh
            </button>

          </div>

          {loading ? (

            <div className="rounded-3xl bg-white p-10 text-center">

              <p className="text-[#6F625A]">
                Memuat pesanan...
              </p>

            </div>

          ) : orders.length === 0 ? (

            <div className="rounded-3xl bg-white p-10 text-center">

              <p className="text-lg font-semibold">
                Belum ada pesanan.
              </p>

              <p className="mt-2 text-sm text-[#6F625A]">
                Pesanan pelanggan akan
                muncul di sini.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {orders.map(
                (order) => (

                  <div
                    key={order.id}
                    className="rounded-3xl bg-white p-6 shadow-sm"
                  >

                    {/* ORDER HEADER */}

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                      <div>

                        <div className="flex items-center gap-3">

                          <h3 className="text-xl font-bold">
                            Order #{order.id}
                          </h3>

                          <div className="flex flex-wrap gap-2">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              Order:{" "}
                              {
                                order.status
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                order.paymentStatus ===
                                "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : order.paymentStatus ===
                                    "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : order.paymentStatus ===
                                    "EXPIRED"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              Payment:{" "}
                              {
                                order.paymentStatus
                              }
                            </span>

                          </div>

                        </div>

                        <p className="mt-2 text-sm text-[#6F625A]">
                          {new Date(
                            order.createdAt
                          ).toLocaleString(
                            "id-ID"
                          )}
                        </p>

                      </div>

                      <p className="text-xl font-bold">
                        {formatRupiah(
                          order.totalPrice
                        )}
                      </p>

                    </div>

                    {/* CUSTOMER */}

                    <div className="mt-6 grid gap-5 md:grid-cols-3">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A70]">
                          Pelanggan
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            order.customerName
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A70]">
                          WhatsApp
                        </p>

                        <p className="mt-1 font-semibold">
                          {order.whatsapp}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A70]">
                          Alamat
                        </p>

                        <p className="mt-1 text-sm">
                          {order.address}
                        </p>

                      </div>

                    </div>

                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    <div className="mt-6 rounded-2xl bg-[#F6F2EC] p-4">

                      <p className="mb-3 text-sm font-semibold">
                        Produk
                      </p>

                      <div className="space-y-3">

                        {order.items.map(
                          (item) => {

                            const product =
                              products.find(
                                (
                                  product
                                ) =>
                                  product.id ===
                                  item.productId
                              );

                            const itemImage =
                              getOrderItemImage(
                                item
                              );

                            const packagingLabel =
                              getPackagingLabel(
                                item.packaging
                              );

                            return (

                              <div
                                key={
                                  item.id
                                }
                                className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3"
                              >

                                {/* LEFT */}

                                <div className="flex min-w-0 items-center gap-3">

                                  {/* FOTO */}

                                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#E8DED3]">

                                    {itemImage ? (

                                      <img
                                        src={
                                          itemImage
                                        }
                                        alt={
                                          item.name
                                        }
                                        className="h-full w-full object-cover"
                                      />

                                    ) : (

                                      <div className="flex h-full w-full items-center justify-center text-2xl">
                                        {packagingLabel ===
                                        "Bottle"
                                          ? "🍶"
                                          : "🥤"}
                                      </div>

                                    )}

                                  </div>

                                  {/* INFO */}

                                  <div className="min-w-0">

                                    <p className="truncate font-semibold">
                                      {
                                        item.name
                                      }
                                    </p>

                                    <div className="mt-1 flex flex-wrap items-center gap-2">

                                      <span className="rounded-full bg-[#F1EAE3] px-2 py-1 text-[11px] font-semibold text-[#6B4F3A]">
                                        {packagingLabel}
                                      </span>

                                      <span className="text-sm text-[#6F625A]">
                                        {
                                          item.quantity
                                        }{" "}
                                        ×{" "}
                                        {formatRupiah(
                                          item.price
                                        )}
                                      </span>

                                    </div>

                                    {product && (
                                      <p className="mt-1 text-xs text-[#8A7A70]">
                                        {product.category ===
                                        "COFFEE"
                                          ? "Coffee"
                                          : "Non Coffee"}
                                      </p>
                                    )}

                                  </div>

                                </div>

                                {/* TOTAL */}

                                <p className="shrink-0 font-semibold">
                                  {formatRupiah(
                                    item.price *
                                      item.quantity
                                  )}
                                </p>

                              </div>

                            );
                          }
                        )}

                      </div>

                    </div>

                    {/* NOTE */}

                    {order.note && (

                      <div className="mt-4 rounded-2xl border border-[#E8E0D8] p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A70]">
                          Catatan
                        </p>

                        <p className="mt-1 text-sm">
                          {order.note}
                        </p>

                      </div>

                    )}

                    {/* ACTION */}

                    <div className="mt-6 flex flex-wrap gap-3">

                      {order.status ===
                        "PENDING" && (

                        <>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "PROCESSING"
                              )
                            }
                            className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
                          >
                            Proses Pesanan
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "CANCELLED"
                              )
                            }
                            className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Batalkan
                          </button>

                        </>

                      )}

                      {order.status ===
                        "PROCESSING" && (

                        <>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "SHIPPING"
                              )
                            }
                            className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
                          >
                            🛵 Kirim Pesanan
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "CANCELLED"
                              )
                            }
                            className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Batalkan
                          </button>

                        </>

                      )}

                      {order.status ===
                        "SHIPPING" && (

                        <button
                          onClick={() =>
                            updateStatus(
                              order.id,
                              "COMPLETED"
                            )
                          }
                          className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          ✓ Tandai Selesai
                        </button>

                      )}

                      {order.status ===
                        "COMPLETED" && (

                        <span className="rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
                          Pesanan Selesai
                        </span>

                      )}

                      {order.status ===
                        "CANCELLED" && (

                        <span className="rounded-full bg-red-100 px-5 py-2 text-sm font-semibold text-red-700">
                          Pesanan Dibatalkan
                        </span>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}