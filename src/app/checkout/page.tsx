"use client";

import Link from "next/link";
import { useState } from "react";
import Script from "next/script";
import { useCart } from "../context/CartContext";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default function CheckoutPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
  } = useCart();

  // ==========================================
  // PERHITUNGAN HARGA
  // ==========================================

  // Total berdasarkan harga normal sebelum diskon
  const subtotalBeforeDiscount = cart.reduce(
    (total, item) =>
      total +
      (item.originalPrice ?? item.price) * item.quantity,
    0
  );

  // Total uang yang dihemat dari semua produk
  const totalDiscount = Math.max(
    subtotalBeforeDiscount - totalPrice,
    0
  );

  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // PROSES CHECKOUT
  // ==========================================
  const handleCheckout = async () => {
    if (!customerName || !whatsapp || !address) {
      alert("Nama, WhatsApp, dan alamat wajib diisi.");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang masih kosong.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // 1. BUAT ORDER
      // ==========================================
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          whatsapp,
          address,
          note,

          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const orderText = await orderResponse.text();

      let orderData;

      try {
        orderData = JSON.parse(orderText);
      } catch {
        console.error(
          "Response order bukan JSON:",
          orderText
        );

        alert(
          `Server error (${orderResponse.status}). Cek terminal npm run dev.`
        );

        return;
      }

      if (!orderResponse.ok || !orderData.success) {
        alert(
          orderData.message ||
            "Gagal membuat order."
        );

        return;
      }

      console.log(
        "ORDER BERHASIL:",
        orderData
      );

      const orderId = orderData.order.id;

      console.log(
        "ORDER ID:",
        orderId
      );

      // ==========================================
      // 2. BUAT TRANSAKSI MIDTRANS
      // ==========================================
      const paymentResponse = await fetch(
        "/api/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
          }),
        }
      );

      const paymentText =
        await paymentResponse.text();

      let paymentData;

      try {
        paymentData =
          JSON.parse(paymentText);
      } catch {
        console.error(
          "Response payment bukan JSON:",
          paymentText
        );

        alert(
          `Payment server error (${paymentResponse.status}). Cek terminal npm run dev.`
        );

        return;
      }

      if (
        !paymentResponse.ok ||
        !paymentData.success
      ) {
        console.error(
          "PAYMENT ERROR:",
          paymentData
        );

        alert(
          paymentData.message ||
            "Gagal membuat transaksi pembayaran."
        );

        return;
      }

      console.log(
        "MIDTRANS TOKEN:",
        paymentData.token
      );

      // ==========================================
      // 3. CEK SNAP
      // ==========================================
      if (!window.snap) {
        alert(
          "Midtrans Snap belum siap. Silakan refresh halaman dan coba lagi."
        );

        return;
      }

      // ==========================================
      // 4. BUKA MIDTRANS
      // ==========================================
      window.snap.pay(
        paymentData.token,
        {
          onSuccess: (result) => {
            console.log(
              "PEMBAYARAN BERHASIL:",
              result
            );

            alert(
              "Pembayaran berhasil! Terima kasih sudah order di GET-HERE Coffee."
            );

            window.location.href =
              `/tracking?orderId=${orderData.order.id}`;
          },

          onPending: (result) => {
            console.log(
              "PEMBAYARAN PENDING:",
              result
            );

            alert(
              "Pembayaran masih menunggu. Silakan selesaikan pembayaran."
            );
          },

          onError: (result) => {
            console.error(
              "PEMBAYARAN GAGAL:",
              result
            );

            alert(
              "Pembayaran gagal. Silakan coba lagi."
            );
          },

          onClose: () => {
            console.log(
              "POPUP MIDTRANS DITUTUP"
            );

            alert(
              "Pembayaran belum selesai."
            );
          },
        }
      );
    } catch (error) {
      console.error(
        "CHECKOUT ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat checkout."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // KERANJANG KOSONG
  // ==========================================
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#F6F2EC] px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 text-6xl">
            🛒
          </div>

          <h1 className="mb-3 text-3xl font-bold text-[#211A16]">
            Keranjang Kamu Kosong
          </h1>

          <p className="mb-8 text-gray-600">
            Yuk pilih kopi favoritmu terlebih dahulu.
          </p>

          <Link
            href="/"
            className="inline-block rounded-full bg-[#211A16] px-8 py-3 font-semibold text-white transition hover:bg-[#8A6348]"
          >
            Pilih Kopi
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // HALAMAN CHECKOUT
  // ==========================================
  return (
    <>
      {/* MIDTRANS SNAP */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={
          process.env
            .NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
        }
      />

      <main className="min-h-screen bg-[#F6F2EC] px-6 py-10">
        <div className="mx-auto max-w-6xl">

          {/* HEADER */}
          <div className="mb-10">
            <Link
              href="/"
              className="mb-5 inline-block text-sm text-[#8A6348] hover:underline"
            >
              ← Kembali ke menu
            </Link>

            <h1 className="text-4xl font-bold text-[#211A16]">
              Checkout
            </h1>

            <p className="mt-2 text-gray-600">
              Lengkapi data kamu untuk menyelesaikan pesanan.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">

           {/* ==========================================
                FORM PEMBELI
            ========================================== */}
            <section className="lg:col-span-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">

                <h2 className="mb-6 text-2xl font-bold text-[#211A16]">
                  Data Pembeli
                </h2>

                <div className="space-y-5">

                  {/* NAMA */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#211A16]">
                      Nama Lengkap
                    </label>

                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={customerName}
                      onChange={(e) =>
                        setCustomerName(e.target.value)
                      }
                      className="
                        w-full
                        rounded-xl
                        border border-[#D9D1C9]
                        bg-white
                        px-4 py-3
                        text-sm text-[#211A16]
                        placeholder:text-[#8F857C]
                        outline-none
                        transition
                        focus:border-[#8A6348]
                        focus:ring-2
                        focus:ring-[#8A6348]/10
                      "
                    />
                  </div>

                  {/* WHATSAPP */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#211A16]">
                      Nomor WhatsApp
                    </label>

                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(e.target.value)
                      }
                      className="
                        w-full
                        rounded-xl
                        border border-[#D9D1C9]
                        bg-white
                        px-4 py-3
                        text-sm text-[#211A16]
                        placeholder:text-[#8F857C]
                        outline-none
                        transition
                        focus:border-[#8A6348]
                        focus:ring-2
                        focus:ring-[#8A6348]/10
                      "
                    />
                  </div>

                  {/* ALAMAT */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#211A16]">
                      Alamat Pengiriman
                    </label>

                    <textarea
                      rows={4}
                      placeholder="Masukkan alamat lengkap"
                      value={address}
                      onChange={(e) =>
                        setAddress(e.target.value)
                      }
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border border-[#D9D1C9]
                        bg-white
                        px-4 py-3
                        text-sm text-[#211A16]
                        placeholder:text-[#8F857C]
                        outline-none
                        transition
                        focus:border-[#8A6348]
                        focus:ring-2
                        focus:ring-[#8A6348]/10
                      "
                    />
                  </div>

                  {/* CATATAN */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#211A16]">
                      Catatan Pesanan

                      <span className="ml-1 font-normal text-[#8F857C]">
                        (opsional)
                      </span>
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Contoh: Kurangi gula, kirim sore hari, dll."
                      value={note}
                      onChange={(e) =>
                        setNote(e.target.value)
                      }
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border border-[#D9D1C9]
                        bg-white
                        px-4 py-3
                        text-sm text-[#211A16]
                        placeholder:text-[#8F857C]
                        outline-none
                        transition
                        focus:border-[#8A6348]
                        focus:ring-2
                        focus:ring-[#8A6348]/10
                      "
                    />
                  </div>

                </div>
              </div>
            </section>

            {/* ==========================================
                RINGKASAN PESANAN
            ========================================== */}
            <section>
              <div className="sticky top-6 rounded-3xl bg-white p-6 shadow-sm">

                <h2 className="mb-6 text-2xl font-bold text-[#211A16]">
                  Pesanan Kamu
                </h2>

                <div className="space-y-5">

                  {cart.map((item) => {
                    const originalPrice =
                      item.originalPrice ??
                      item.price;

                    const finalPrice =
                      item.finalPrice ??
                      item.price;

                    const discountAmount =
                      Math.max(
                        originalPrice - finalPrice,
                        0
                      );

                    const totalItemDiscount =
                      discountAmount *
                      item.quantity;

                    const hasDiscount =
                      originalPrice > finalPrice &&
                      (item.discountPercent ?? 0) > 0;

                   const productImage = item.image;

                    return (
                      <div
                        key={item.id}
                        className="border-b border-gray-100 pb-5"
                      >

                        {/* PRODUK */}
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <h3 className="font-semibold text-[#211A16]">
                              {item.name}
                            </h3>

                            {/* HARGA */}
                            <div className="mt-2">

                              {hasDiscount && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* HARGA NORMAL */}
                                  <span className="text-sm text-[#9A9087] line-through">
                                    Rp{" "}
                                    {originalPrice.toLocaleString("id-ID")}
                                  </span>

                                  {/* PERSENTASE DISKON */}
                                  <span className="rounded-full bg-[#40551F] px-2 py-0.5 text-[11px] font-bold text-white">
                                    -{item.discountPercent}%
                                  </span>
                                </div>
                              )}

                              {/* HARGA SETELAH DISKON */}
                              <p className="text-sm font-semibold text-[#261C17]">
                                Rp{" "}
                                {finalPrice.toLocaleString("id-ID")}
                              </p>

                              {/* HEMAT */}
                              {hasDiscount && (
                                <p className="mt-1 text-xs font-medium text-[#40551F]">
                                  Hemat Rp{" "}
                                  {totalItemDiscount.toLocaleString("id-ID")}
                                </p>
                              )}

                            </div>
                          </div>

                          {/* TOTAL PRODUK */}
                          <p className="whitespace-nowrap font-semibold text-[#211A16]">
                            Rp{" "}
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString(
                              "id-ID"
                            )}
                          </p>

                        </div>

                        {/* QUANTITY */}
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8C9BA] bg-[#F3EEE8] text-lg font-bold text-[#211A16] transition hover:bg-[#E7DED4]"
                          >
                            −
                          </button>

                          <span className="w-5 text-center font-bold text-[#211A16]">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8C9BA] bg-[#F3EEE8] text-lg font-bold text-[#211A16] transition hover:bg-[#E7DED4]"
                          >
                            +
                          </button>

                        </div>

                      </div>
                    );
                  })}

                </div>

                {/* ==========================================
                    TOTAL
                ========================================== */}
                <div className="mt-6 border-t border-[#E5DED6] pt-6">

                  {/* SUBTOTAL */}
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-[#756B63]">
                      Subtotal
                    </span>

                    <span className="font-medium text-[#261C17]">
                      Rp{" "}
                      {subtotalBeforeDiscount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* DISKON */}
                  {totalDiscount > 0 && (
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-[#40551F]">
                        Diskon
                      </span>

                      <span className="font-semibold text-[#40551F]">
                        -Rp{" "}
                        {totalDiscount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  {/* ONGKIR */}
                  <div className="mb-5 flex items-center justify-between text-sm">
                    <span className="text-[#756B63]">
                      Ongkir
                    </span>

                    <span className="font-medium text-[#261C17]">
                      Rp 0
                    </span>
                  </div>

                  {/* TOTAL AKHIR */}
                  <div className="flex items-end justify-between border-t border-[#E5DED6] pt-5">
                    <span className="text-lg font-bold text-[#211A16]">
                      Total
                    </span>

                    <span className="text-2xl font-black text-[#211A16]">
                      Rp{" "}
                      {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>

                </div>

                {/* ==========================================
                    PAYMENT BUTTON
                ========================================== */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCheckout}
                  className="mt-6 w-full rounded-full bg-[#211A16] py-4 font-semibold text-white transition hover:bg-[#8A6348] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Memproses..."
                    : "Bayar Sekarang →"}
                </button>

                <p className="mt-4 text-center text-xs text-gray-400">
                  Pembayaran aman dan diproses melalui Midtrans.
                </p>

              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  );
}