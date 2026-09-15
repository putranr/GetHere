"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  productId: number;
  name: string;
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

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders");

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

  function formatRupiah(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getStatusClass(status: string) {
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

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "PROCESSING"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#211A16]">

      {/* HEADER */}
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
            onClick={() => {
              window.location.href = "/admin/login";
            }}
            className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
          >
            Logout
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* STATISTICS */}
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

        {/* ORDER LIST */}
        <div className="mt-8">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Daftar Pesanan
              </h2>

              <p className="mt-1 text-sm text-[#6F625A]">
                Kelola pesanan pelanggan GET-HERE Coffee.
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
                Pesanan pelanggan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {orders.map((order) => (
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
                          Order: {order.status}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : order.paymentStatus === "EXPIRED"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Payment: {order.paymentStatus}
                        </span>
                      </div>

                      </div>

                      <p className="mt-2 text-sm text-[#6F625A]">
                        {new Date(order.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <p className="text-xl font-bold">
                      {formatRupiah(order.totalPrice)}
                    </p>

                  </div>

                  {/* CUSTOMER */}
                  <div className="mt-6 grid gap-5 md:grid-cols-3">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A7A70]">
                        Pelanggan
                      </p>

                      <p className="mt-1 font-semibold">
                        {order.customerName}
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

                  {/* ITEMS */}
                  <div className="mt-6 rounded-2xl bg-[#F6F2EC] p-4">

                    <p className="mb-3 text-sm font-semibold">
                      Produk
                    </p>

                    <div className="space-y-3">

                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-semibold">
                              {item.name}
                            </p>

                            <p className="text-[#6F625A]">
                              {item.quantity} ×{" "}
                              {formatRupiah(item.price)}
                            </p>
                          </div>

                          <p className="font-semibold">
                            {formatRupiah(
                              item.price * item.quantity
                            )}
                          </p>
                        </div>
                      ))}

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

                    {order.status === "PENDING" && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(order.id, "PROCESSING")
                          }
                          className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
                        >
                          Proses Pesanan
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(order.id, "CANCELLED")
                          }
                          className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Batalkan
                        </button>
                      </>
                    )}

                    {order.status === "PROCESSING" && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(order.id, "SHIPPING")
                          }
                          className="rounded-full bg-[#211A16] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A6348]"
                        >
                          🛵 Kirim Pesanan
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(order.id, "CANCELLED")
                          }
                          className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Batalkan
                        </button>
                      </>
                    )}

                    {order.status === "SHIPPING" && (
                      <button
                        onClick={() =>
                          updateStatus(order.id, "COMPLETED")
                        }
                        className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        ✓ Tandai Selesai
                      </button>
                    )}

                    {order.status === "COMPLETED" && (
                      <span className="rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
                        Pesanan Selesai
                      </span>
                    )}

                    {order.status === "CANCELLED" && (
                      <span className="rounded-full bg-red-100 px-5 py-2 text-sm font-semibold text-red-700">
                        Pesanan Dibatalkan
                      </span>
                    )}

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