"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  packaging?: string | null;
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

const ORDER_STEPS = [
  {
    status: "PENDING",
    title: "Pesanan diterima",
    description: "Pesanan sudah masuk ke sistem GetHere.",
  },
  {
    status: "PROCESSING",
    title: "Sedang diproses",
    description: "Tim GetHere sedang menyiapkan pesananmu.",
  },
  {
    status: "SHIPPING",
    title: "Sedang diantar",
    description: "Pesanan sedang dalam perjalanan menuju kamu.",
  },
  {
    status: "COMPLETED",
    title: "Pesanan selesai",
    description: "Pesanan telah selesai. Terima kasih sudah order!",
  },
];

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get("orderId");
    if (orderIdFromUrl) setOrderId(orderIdFromUrl);
  }, []);

  async function handleTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    const normalizedOrderId = orderId.trim();
    const normalizedWhatsapp = whatsapp.trim();

    if (!normalizedOrderId || !normalizedWhatsapp) {
      setError("Nomor order dan WhatsApp wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/orders/track?orderId=${encodeURIComponent(normalizedOrderId)}&whatsapp=${encodeURIComponent(normalizedWhatsapp)}`,
        { method: "GET", cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Pesanan tidak ditemukan.");
        return;
      }

      if (!data.order) {
        setError("Data pesanan tidak tersedia.");
        return;
      }

      setOrder(data.order as Order);
    } catch (requestError) {
      console.error("Gagal melacak pesanan:", requestError);
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOrderNumber() {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(`#${orderId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Nomor pesanan tidak bisa disalin otomatis. Silakan salin nomor secara manual.");
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "PENDING": return "Pesanan diterima";
      case "PROCESSING": return "Sedang diproses";
      case "SHIPPING": return "Sedang diantar";
      case "COMPLETED": return "Pesanan selesai";
      case "CANCELLED": return "Pesanan dibatalkan";
      default: return status;
    }
  }

  function getPaymentText(status: string) {
    switch (status) {
      case "PAID": return "Lunas";
      case "UNPAID": return "Belum dibayar";
      case "PENDING": return "Menunggu pembayaran";
      case "FAILED": return "Pembayaran gagal";
      case "EXPIRED": return "Pembayaran kedaluwarsa";
      default: return status || "Belum diketahui";
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const currentStepIndex = order
    ? ORDER_STEPS.findIndex((step) => step.status === order.status)
    : -1;
  const isCancelled = order?.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-[#F4F4F2] text-[#111111]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link
            href="/"
            aria-label="GetHere — Together, We Get Here."
            className="flex shrink-0 items-center"
          >
            <img
              src="/GetHere_Logo.png"
              alt="GetHere — Together, We Get Here."
              className="h-auto w-[145px] object-contain sm:w-[165px]"
              draggable={false}
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <Link href="/" className="transition hover:text-black/55">Beranda</Link>
            <Link href="/#produk" className="transition hover:text-black/55">Menu</Link>
            <Link href="/#tentang" className="transition hover:text-black/55">Tentang</Link>
            <Link href="/tracking" aria-current="page" className="border-b-2 border-black pb-1">Lacak Pesanan</Link>
          </nav>

          <Link
            href="/#produk"
            className="rounded-full border border-black px-4 py-2.5 text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
          >
            Lanjut Belanja
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-black/60 transition hover:text-black">
          <span aria-hidden="true">←</span> Kembali ke beranda
        </Link>

        {/* SUCCESS / PAGE INTRO */}
        <section className="mx-auto mb-8 mt-7 max-w-3xl text-center sm:mb-10 sm:mt-9">
          {orderId ? (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white sm:h-[76px] sm:w-[76px]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" aria-hidden="true">
                  <path d="m5 12.5 4.2 4.2L19.5 6.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/50 sm:text-xs">GetHere Coffee · Order Confirmation</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Pesanan berhasil dibuat.</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
                Terima kasih sudah memesan di GetHere. Simpan nomor pesananmu untuk melihat perkembangan pesanan.
              </p>

              <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-left sm:px-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/50">Nomor pesanan</p>
                  <p className="mt-1 text-2xl font-black tracking-tight">#{orderId}</p>
                </div>
                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-black/15 px-3 py-2 text-xs font-semibold transition hover:bg-black hover:text-white"
                  aria-label="Salin nomor pesanan"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M16 8V5.8A1.8 1.8 0 0 0 14.2 4H6.8A1.8 1.8 0 0 0 5 5.8v8.4A1.8 1.8 0 0 0 6.8 16H8" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/50 sm:text-xs">GetHere Coffee · Order Tracking</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Lacak pesananmu.</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
                Masukkan nomor order dan nomor WhatsApp yang kamu gunakan saat checkout untuk melihat status terbaru.
              </p>
            </>
          )}
        </section>

        {/* TRACK FORM */}
        <section className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.035)] sm:p-8">
          <div className="mb-6 flex items-start gap-3 border-b border-black/10 pb-5 sm:mb-7">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Cek status pesanan</h2>
              <p className="mt-1 text-sm text-black/55">Data ini digunakan untuk mencocokkan pesananmu.</p>
            </div>
          </div>

          <form onSubmit={handleTrack} className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <div>
              <label htmlFor="orderId" className="mb-2 block text-sm font-semibold">Nomor Order</label>
              <input
                id="orderId"
                type="text"
                inputMode="numeric"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Contoh: 35"
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/10"
                required
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="mb-2 block text-sm font-semibold">Nomor WhatsApp</label>
              <input
                id="whatsapp"
                type="tel"
                autoComplete="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/10"
                required
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-black/15 bg-[#F4F4F2] px-4 py-3 text-sm text-black sm:col-span-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Mencari pesanan...
                </>
              ) : (
                <>Lacak Pesanan <span aria-hidden="true">→</span></>
              )}
            </button>
          </form>
        </section>

        {/* TRACKING RESULT */}
        {order && (
          <section className="mx-auto mt-6 max-w-3xl space-y-5 sm:mt-8 sm:space-y-6">
            {/* ORDER STATUS */}
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Order summary</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Pesanan #{order.id}</h2>
                  <p className="mt-2 text-sm text-black/55">Dibuat {formatDate(order.createdAt)}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 bg-[#F4F4F2] px-3.5 py-2 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-black" />
                  {getStatusText(order.status)}
                </span>
              </div>
              {isCancelled && (
                <div className="mt-5 border-t border-black/10 pt-4 text-sm text-black/65">
                  Pesanan ini dibatalkan. Silakan hubungi GetHere bila membutuhkan bantuan.
                </div>
              )}
            </div>

            {/* TIMELINE */}
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Order progress</p>
              <h3 className="mb-6 mt-2 text-xl font-bold">Perjalanan pesanan</h3>
              {isCancelled ? (
                <div className="flex gap-4 rounded-2xl border border-black/10 bg-[#F4F4F2] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white" aria-hidden="true">×</span>
                  <div>
                    <p className="font-semibold">Pesanan dibatalkan</p>
                    <p className="mt-1 text-sm leading-6 text-black/55">Status pesanan tidak akan berlanjut ke tahap berikutnya.</p>
                  </div>
                </div>
              ) : (
                <ol className="space-y-0">
                  {ORDER_STEPS.map((step, index) => {
                    const reached = index <= currentStepIndex;
                    const active = index === currentStepIndex;
                    return (
                      <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
                        {index < ORDER_STEPS.length - 1 && (
                          <span className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-px ${index < currentStepIndex ? "bg-black" : "bg-black/10"}`} aria-hidden="true" />
                        )}
                        <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${reached ? "border-black bg-black text-white" : "border-black/20 bg-white text-black/35"}`} aria-hidden="true">
                          {reached ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                              <path d="m5 12.5 4.2 4.2L19.5 6.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <span className="text-xs font-semibold">{index + 1}</span>
                          )}
                        </span>
                        <div className="pt-1">
                          <p className={`font-semibold ${active ? "text-black" : reached ? "text-black/80" : "text-black/40"}`}>{step.title}</p>
                          <p className={`mt-1 text-sm leading-6 ${reached ? "text-black/55" : "text-black/35"}`}>{step.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* CUSTOMER DETAIL */}
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Customer details</p>
              <h3 className="mb-5 mt-2 text-xl font-bold">Detail pesanan</h3>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-black/50">Nama</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">{order.customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/50">WhatsApp</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">{order.whatsapp}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-black/50">Alamat pengiriman</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{order.address}</dd>
                </div>
                {order.note && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-black/50">Catatan</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{order.note}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* ITEMS + PAYMENT */}
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.025)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Order details</p>
              <h3 className="mb-5 mt-2 text-xl font-bold">Produk yang dipesan</h3>
              <div className="divide-y divide-black/10">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{item.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-black/55">
                        {item.packaging && (
                          <span className="rounded-full border border-black/15 px-2 py-1">{item.packaging === "BOTTLE" ? "Bottle" : item.packaging === "CUP" ? "Cup" : item.packaging}</span>
                        )}
                        <span>{item.quantity} × {formatPrice(item.price)}</span>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/55">Total pesanan</span>
                  <span className="text-xl font-black tracking-tight">{formatPrice(order.totalPrice)}</span>
                </div>
                <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-black/10 bg-[#F4F4F2] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Status pembayaran</p>
                    <p className="mt-1 text-xs text-black/55">Status mengikuti konfirmasi transaksi dari Midtrans.</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">{getPaymentText(order.paymentStatus)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/80">
                Kembali ke Beranda
              </Link>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black hover:text-white">
                Lacak Pesanan Lain
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-black/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} GetHere Coffee.</p>
          <p>Good Coffee. Good Moment.</p>
        </div>
      </footer>
    </main>
  );
}
