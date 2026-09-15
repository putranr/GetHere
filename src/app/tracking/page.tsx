"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
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

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const orderIdFromUrl = params.get("orderId");

  if (orderIdFromUrl) {
    setOrderId(orderIdFromUrl);
  }
}, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `/api/orders/track?orderId=${encodeURIComponent(
          orderId
        )}&whatsapp=${encodeURIComponent(whatsapp)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Pesanan tidak ditemukan.");
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "PENDING":
        return "Pesanan diterima";
      case "PROCESSING":
        return "Sedang diproses";
      case "SHIPPING":
        return "Sedang diantar";
      case "COMPLETED":
        return "Pesanan selesai";
      case "CANCELLED":
        return "Pesanan dibatalkan";
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
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

  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <main className="min-h-screen bg-[#F6F2EC] px-6 py-12">
      <div className="mx-auto max-w-2xl">
       {/* HEADER */}
        <div className="mb-8 text-center">
          {orderId ? (
            <>
              <div className="mb-4 text-4xl">
                🎉
              </div>

              <h1 className="text-3xl font-bold text-[#211A16]">
                Pesanan Berhasil Dibuat!
              </h1>

              <p className="mt-2 text-gray-600">
                Nomor pesanan kamu:
              </p>

              <p className="mt-1 text-2xl font-bold text-[#8A6348]">
                #{orderId}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                Simpan nomor pesanan ini untuk mengecek status pesananmu.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-[#211A16]">
                Lacak Pesanan
              </h1>

              <p className="mt-2 text-gray-600">
                Masukkan nomor order dan WhatsApp untuk melihat status pesananmu.
              </p>
            </>
          )}
        </div>

        {/* FORM */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#211A16]">
                Nomor Order
              </label>

              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Nomor order"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#8A6348]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#211A16]">
                Nomor WhatsApp
              </label>

              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#8A6348]"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#211A16] px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Mencari Pesanan..." : "Lacak Pesanan"}
            </button>
          </form>
        </div>

        {/* RESULT */}
        {order && (
          <div className="mt-6 space-y-4">
            {/* STATUS */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nomor Order</p>
                  <h2 className="text-2xl font-bold text-[#211A16]">
                    #{order.id}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-lg font-semibold text-[#211A16]">
                Status Pesanan
              </h3>

              <div className="space-y-5">
                <div
                  className={`flex items-center gap-3 ${
                    ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED"].includes(
                      order.status
                    )
                      ? "text-[#211A16]"
                      : "text-gray-300"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-current" />
                  <span>Pesanan diterima</span>
                </div>

                <div
                  className={`flex items-center gap-3 ${
                    ["PROCESSING", "SHIPPING", "COMPLETED"].includes(
                      order.status
                    )
                      ? "text-[#211A16]"
                      : "text-gray-300"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-current" />
                  <span>Sedang diproses</span>
                </div>

                <div
                  className={`flex items-center gap-3 ${
                    ["SHIPPING", "COMPLETED"].includes(order.status)
                      ? "text-[#211A16]"
                      : "text-gray-300"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-current" />
                  <span>Sedang diantar</span>
                </div>

                <div
                  className={`flex items-center gap-3 ${
                    order.status === "COMPLETED"
                      ? "text-[#211A16]"
                      : "text-gray-300"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-current" />
                  <span>Pesanan selesai</span>
                </div>
              </div>
            </div>

            {/* CUSTOMER */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#211A16]">
                Detail Pesanan
              </h3>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Nama:</span>{" "}
                  {order.customerName}
                </p>

                <p>
                  <span className="text-gray-500">WhatsApp:</span>{" "}
                  {order.whatsapp}
                </p>

                <p>
                  <span className="text-gray-500">Alamat:</span>{" "}
                  {order.address}
                </p>

                {order.note && (
                  <p>
                    <span className="text-gray-500">Catatan:</span>{" "}
                    {order.note}
                  </p>
                )}
              </div>
            </div>

            {/* ITEMS */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#211A16]">
                Produk
              </h3>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3"
                  >
                    <div>
                      <p className="font-medium text-[#211A16]">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="font-medium text-[#211A16]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between text-lg font-bold text-[#211A16]">
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status Pembayaran</span>

                <span
                  className={`font-semibold ${
                    order.paymentStatus === "PAID"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}