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

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);

const fieldClassName =
  "w-full rounded-xl border border-[#DADAD6] bg-white px-4 py-3.5 text-sm text-[#171717] placeholder:text-[#92928C] outline-none transition focus:border-[#252525] focus:ring-2 focus:ring-[#171717]/10";

export default function CheckoutPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
  } = useCart();

  // ==========================================
  // PRICE SUMMARY
  // ==========================================
  const subtotalBeforeDiscount = cart.reduce(
    (total, item) =>
      total + (item.originalPrice ?? item.price) * item.quantity,
    0
  );

  const totalDiscount = Math.max(
    subtotalBeforeDiscount - totalPrice,
    0
  );

  const totalQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // CHECKOUT FLOW — KEEP EXISTING ORDER + MIDTRANS
  // ==========================================
  const handleCheckout = async () => {
    if (!customerName.trim() || !whatsapp.trim() || !address.trim()) {
      alert("Nama, WhatsApp, dan alamat wajib diisi.");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang masih kosong.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create the order; packaging is required by the orders API.
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          whatsapp: whatsapp.trim(),
          address: address.trim(),
          note: note.trim(),
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            packaging: item.packaging,
          })),
        }),
      });

      const orderText = await orderResponse.text();
      let orderData;

      try {
        orderData = JSON.parse(orderText);
      } catch {
        console.error("Response order bukan JSON:", orderText);
        alert(
          `Server error (${orderResponse.status}). Cek terminal npm run dev.`
        );
        return;
      }

      if (!orderResponse.ok || !orderData.success) {
        alert(orderData.message || "Gagal membuat order.");
        return;
      }

      const orderId = orderData.order.id;
      console.log("ORDER BERHASIL:", orderData);
      console.log("ORDER ID:", orderId);

      // 2. Create Midtrans transaction.
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const paymentText = await paymentResponse.text();
      let paymentData;

      try {
        paymentData = JSON.parse(paymentText);
      } catch {
        console.error("Response payment bukan JSON:", paymentText);
        alert(
          `Payment server error (${paymentResponse.status}). Cek terminal npm run dev.`
        );
        return;
      }

      if (!paymentResponse.ok || !paymentData.success) {
        console.error("PAYMENT ERROR:", paymentData);
        alert(
          paymentData.message || "Gagal membuat transaksi pembayaran."
        );
        return;
      }

      // 3. Check Snap availability before opening the existing payment popup.
      if (!window.snap) {
        alert(
          "Midtrans Snap belum siap. Silakan refresh halaman dan coba lagi."
        );
        return;
      }

      // 4. Open Midtrans; keep the current success/pending/error behavior.
      window.snap.pay(paymentData.token, {
        onSuccess: (result) => {
          console.log("PEMBAYARAN BERHASIL:", result);
          alert(
            "Pembayaran berhasil! Terima kasih sudah order di GET-HERE Coffee."
          );
          window.location.href = `/tracking?orderId=${orderId}`;
        },
        onPending: (result) => {
          console.log("PEMBAYARAN PENDING:", result);
          alert(
            "Pembayaran masih menunggu. Silakan selesaikan pembayaran."
          );
        },
        onError: (result) => {
          console.error("PEMBAYARAN GAGAL:", result);
          alert("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          console.log("POPUP MIDTRANS DITUTUP");
          alert("Pembayaran belum selesai.");
        },
      });
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat checkout."
      );
    } finally {
      setLoading(false);
    }
  };

  // Shared header for the checkout and empty-cart states.
  const checkoutHeader = (
    <header className="border-b border-[#E5E5E1] bg-white">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="GetHere beranda">
          <span className="block text-[25px] font-black leading-none tracking-[-0.07em] text-[#111111]">
            GetHere
          </span>
          <span className="mt-1 block text-[8px] font-semibold tracking-[0.02em] text-[#686862]">
            Together, We Get Here.
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#33332F] md:flex">
          <Link href="/" className="transition hover:text-black">
            Beranda
          </Link>
          <Link href="/#produk" className="transition hover:text-black">
            Menu
          </Link>
          <Link href="/#tentang" className="transition hover:text-black">
            Tentang
          </Link>
          <Link href="/tracking" className="transition hover:text-black">
            Lacak Pesanan
          </Link>
        </nav>

        <Link
          href="/#produk"
          className="rounded-full border border-[#D6D6D1] px-4 py-2.5 text-xs font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white sm:text-sm"
        >
          Lanjut Belanja
        </Link>
      </div>
    </header>
  );

  // ==========================================
  // EMPTY CART
  // ==========================================
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#F4F4F1] text-[#171717]">
        {checkoutHeader}
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5 py-16">
          <div className="w-full rounded-[28px] border border-[#E4E4DF] bg-white px-6 py-12 text-center shadow-[0_12px_40px_rgba(0,0,0,0.035)] sm:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F0ED] text-3xl">
              🛒
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[#777770]">
              GetHere Checkout
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Keranjang Kamu Kosong
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#696963]">
              Pilih minuman favoritmu terlebih dahulu, lalu kembali ke sini untuk menyelesaikan pesanan.
            </p>
            <Link
              href="/#produk"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-[#111111] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#333333]"
            >
              Pilih Menu <span className="ml-2">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // CHECKOUT PAGE
  // ==========================================
  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      <main className="min-h-screen bg-[#F4F4F1] text-[#171717]">
        {checkoutHeader}

        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
          {/* PAGE INTRO */}
          <div className="mb-8 sm:mb-10">
            <Link
              href="/#produk"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#666660] transition hover:text-black sm:text-sm"
            >
              <span aria-hidden="true">←</span> Kembali ke menu
            </Link>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#777770]">
              GetHere Coffee · Checkout
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Selesaikan Pesanan
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#696963] sm:text-base">
              Isi informasi pengiriman dan periksa kembali pesananmu sebelum melanjutkan pembayaran.
            </p>
          </div>

          {/* CHECKOUT STEPS */}
          <div className="mb-8 rounded-2xl border border-[#E3E3DE] bg-white px-4 py-5 sm:px-7">
            <div className="mx-auto grid max-w-3xl grid-cols-3">
              <div className="relative flex flex-col items-center text-center">
                <span className="absolute left-1/2 top-4 h-px w-full bg-[#171717]" />
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-xs font-bold text-white ring-4 ring-white">
                  1
                </span>
                <span className="mt-2 text-[11px] font-bold text-[#171717] sm:text-sm">
                  Pengiriman
                </span>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <span className="absolute right-1/2 top-4 h-px w-full bg-[#DADAD5]" />
                <span className="absolute left-1/2 top-4 h-px w-full bg-[#DADAD5]" />
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#DADAD5] bg-white text-xs font-bold text-[#777770] ring-4 ring-white">
                  2
                </span>
                <span className="mt-2 text-[11px] font-medium text-[#777770] sm:text-sm">
                  Pembayaran
                </span>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <span className="absolute right-1/2 top-4 h-px w-full bg-[#DADAD5]" />
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#DADAD5] bg-white text-xs font-bold text-[#777770] ring-4 ring-white">
                  3
                </span>
                <span className="mt-2 text-[11px] font-medium text-[#777770] sm:text-sm">
                  Selesai
                </span>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:gap-8">
            {/* CUSTOMER FORM */}
            <section className="overflow-hidden rounded-[26px] border border-[#E3E3DE] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.025)]">
              <div className="border-b border-[#EEEEEA] px-5 py-5 sm:px-8 sm:py-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#777770]">
                  01 / Informasi Pengiriman
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  Data Pembeli
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#696963]">
                  Kami menggunakan data ini untuk menghubungi dan mengirim pesananmu.
                </p>
              </div>

              <div className="space-y-5 px-5 py-6 sm:space-y-6 sm:px-8 sm:py-8">
                <div>
                  <label htmlFor="customerName" className="mb-2 block text-sm font-bold text-[#242420]">
                    Nama Lengkap <span className="text-[#777770]">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    autoComplete="name"
                    placeholder="Masukkan nama lengkap"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className={fieldClassName}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="mb-2 block text-sm font-bold text-[#242420]">
                    Nomor WhatsApp <span className="text-[#777770]">*</span>
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Contoh: 081234567890"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    className={fieldClassName}
                    required
                  />
                  <p className="mt-2 text-xs leading-5 text-[#777770]">
                    Pastikan nomor aktif agar kami dapat menghubungimu jika diperlukan.
                  </p>
                </div>

                <div>
                  <label htmlFor="address" className="mb-2 block text-sm font-bold text-[#242420]">
                    Alamat Pengiriman <span className="text-[#777770]">*</span>
                  </label>
                  <textarea
                    id="address"
                    rows={4}
                    autoComplete="street-address"
                    placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, dan patokan alamat"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className={`${fieldClassName} resize-y min-h-[112px]`}
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="note" className="text-sm font-bold text-[#242420]">
                      Catatan Pesanan
                    </label>
                    <span className="text-[11px] font-medium text-[#85857E]">Opsional</span>
                  </div>
                  <textarea
                    id="note"
                    rows={3}
                    placeholder="Contoh: Kurangi gula, kirim sore hari, dll."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className={`${fieldClassName} resize-y min-h-[88px]`}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-[#F5F5F2] px-4 py-3.5 text-xs leading-5 text-[#666660]">
                  <span className="mt-0.5 text-base" aria-hidden="true">✓</span>
                  <p>Periksa kembali nama, nomor WhatsApp, dan alamat sebelum menekan tombol pembayaran.</p>
                </div>
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside className="lg:sticky lg:top-6">
              <section className="overflow-hidden rounded-[26px] border border-[#E3E3DE] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.025)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEA] px-5 py-5 sm:px-6 sm:py-7">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#777770]">
                      Order Summary
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      Pesanan Kamu
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#DADAD5] px-3 py-1.5 text-xs font-bold text-[#33332F]">
                    {totalQuantity} item
                  </span>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  {cart.map((item) => {
                    const originalPrice = item.originalPrice ?? item.price;
                    const finalPrice = item.finalPrice ?? item.price;
                    const discountAmount = Math.max(originalPrice - finalPrice, 0);
                    const totalItemDiscount = discountAmount * item.quantity;
                    const hasDiscount = originalPrice > finalPrice && (item.discountPercent ?? 0) > 0;
                    const productImage = item.image;
                    const packagingLabel = item.packaging === "BOTTLE" ? "Bottle" : "Cup";

                    return (
                      <article
                        key={`${item.id}-${item.packaging}`}
                        className="border-b border-[#EEEEEA] pb-5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F0F0EC]">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl" aria-hidden="true">
                                {item.packaging === "BOTTLE" ? "🧴" : "🥤"}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-sm font-bold leading-5 text-[#171717]">
                              {item.name}
                            </h3>
                            <span className="mt-1.5 inline-flex items-center rounded-full bg-[#F1F1ED] px-2.5 py-1 text-[10px] font-bold text-[#4F4F49]">
                              {packagingLabel === "Bottle" ? "🧴" : "🥤"} <span className="ml-1">{packagingLabel}</span>
                            </span>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {hasDiscount && (
                                <span className="text-xs text-[#85857E] line-through">
                                  Rp {money(originalPrice)}
                                </span>
                              )}
                              {hasDiscount && (
                                <span className="rounded-full bg-[#171717] px-2 py-0.5 text-[10px] font-bold text-white">
                                  -{item.discountPercent}%
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-bold text-[#171717]">
                              Rp {money(finalPrice)}
                            </p>
                            {hasDiscount && (
                              <p className="mt-1 text-[11px] font-medium text-[#666660]">
                                Hemat Rp {money(totalItemDiscount)}
                              </p>
                            )}
                          </div>

                          <p className="shrink-0 whitespace-nowrap text-sm font-bold text-[#171717]">
                            Rp {money(finalPrice * item.quantity)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs text-[#777770]">Jumlah</span>
                          <div className="flex items-center gap-3 rounded-full border border-[#DADAD5] bg-white p-1">
                            <button
                              type="button"
                              aria-label={`Kurangi ${item.name} kemasan ${packagingLabel}`}
                              onClick={() => decreaseQuantity(item.id, item.packaging)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F0EC] text-lg font-semibold text-[#171717] transition hover:bg-[#DCDCD6] active:scale-95"
                            >
                              −
                            </button>
                            <span className="min-w-4 text-center text-sm font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Tambah ${item.name} kemasan ${packagingLabel}`}
                              onClick={() => increaseQuantity(item.id, item.packaging)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-lg font-semibold text-white transition hover:bg-[#383833] active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* TOTALS */}
                <div className="border-t border-[#E5E5E1] bg-[#FAFAF8] px-5 py-5 sm:px-6">
                  <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#696963]">Subtotal</span>
                    <span className="font-medium tabular-nums">Rp {money(subtotalBeforeDiscount)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                      <span className="text-[#55554F]">Diskon</span>
                      <span className="font-bold tabular-nums">−Rp {money(totalDiscount)}</span>
                    </div>
                  )}

                  <div className="mb-4 flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#696963]">Ongkir</span>
                    <span className="font-medium tabular-nums">Rp 0</span>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-[#E2E2DD] pt-4">
                    <span className="text-base font-bold sm:text-lg">Total</span>
                    <span className="text-2xl font-black tracking-tight tabular-nums sm:text-[28px]">
                      Rp {money(totalPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCheckout}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#333333] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Memproses pesanan..." : "Bayar Sekarang"}
                    {!loading && <span aria-hidden="true">→</span>}
                  </button>

                  <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-[#777770]">
                    <span aria-hidden="true">✓</span>
                    Pembayaran diproses dengan aman melalui Midtrans.
                  </p>
                </div>
              </section>

              <p className="mt-4 text-center text-[11px] leading-5 text-[#777770]">
                Perlu memeriksa status pesanan? <Link href="/tracking" className="font-bold text-[#171717] underline underline-offset-2">Lacak pesanan</Link>
              </p>
            </aside>
          </div>

          <footer className="mt-10 border-t border-[#DEDED9] pt-5 text-center text-[11px] text-[#85857E]">
            © 2026 GetHere Coffee · Good Coffee. Good Moment.
          </footer>
        </div>
      </main>
    </>
  );
}
