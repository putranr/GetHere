"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "../AdminShell";

export default function AdminSettingsPage() {
  const { username } = useAdminUser();
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOrderNotifications(window.localStorage.getItem("gethere_admin_notifications_orders") !== "false");
    setPaymentNotifications(window.localStorage.getItem("gethere_admin_notifications_payments") !== "false");
  }, []);

  function savePreferences() {
    window.localStorage.setItem("gethere_admin_notifications_orders", String(orderNotifications));
    window.localStorage.setItem("gethere_admin_notifications_payments", String(paymentNotifications));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#777771]">Preferensi sistem</p><h1 className="mt-2 text-3xl font-black tracking-tight">Pengaturan</h1><p className="mt-1.5 text-sm text-[#73736D]">Kelola preferensi tampilan dan informasi akun admin.</p></div>

      <section className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
        <div className="border-b border-[#EEEEEB] px-5 py-5 sm:px-6"><h2 className="font-bold">Profil admin</h2><p className="mt-1 text-sm text-[#85857F]">Informasi sesi yang sedang digunakan.</p></div>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:px-6 sm:py-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#171715] text-xl font-bold uppercase text-white">{(username || "A").slice(0, 1)}</div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-semibold text-[#777771]">Username login</label><div className="rounded-xl border border-[#E4E4E0] bg-[#F8F8F6] px-4 py-3 text-sm font-semibold">{username || "Admin"}</div></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-[#777771]">Peran</label><div className="rounded-xl border border-[#E4E4E0] bg-[#F8F8F6] px-4 py-3 text-sm font-semibold">Administrator</div></div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E7E7E3] bg-white">
        <div className="border-b border-[#EEEEEB] px-5 py-5 sm:px-6"><h2 className="font-bold">Preferensi notifikasi</h2><p className="mt-1 text-sm text-[#85857F]">Pilihan di bawah ini disimpan pada browser ini. Pengiriman notifikasi otomatis tetap memerlukan integrasi server.</p></div>
        <div className="divide-y divide-[#EEEEEB] px-5 sm:px-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 py-5"><span><span className="block text-sm font-semibold">Informasi pesanan baru</span><span className="mt-1 block text-xs leading-5 text-[#85857F]">Aktifkan preferensi untuk pemberitahuan terkait pesanan.</span></span><input type="checkbox" checked={orderNotifications} onChange={(event) => setOrderNotifications(event.target.checked)} className="h-5 w-5 accent-black" /></label>
          <label className="flex cursor-pointer items-center justify-between gap-4 py-5"><span><span className="block text-sm font-semibold">Informasi pembayaran</span><span className="mt-1 block text-xs leading-5 text-[#85857F]">Aktifkan preferensi untuk pemberitahuan status pembayaran.</span></span><input type="checkbox" checked={paymentNotifications} onChange={(event) => setPaymentNotifications(event.target.checked)} className="h-5 w-5 accent-black" /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[#EEEEEB] bg-[#FAFAF8] px-5 py-4 sm:px-6"><button type="button" onClick={savePreferences} className="rounded-xl bg-[#171715] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3B3B36]">Simpan preferensi</button>{saved && <span role="status" className="text-sm font-medium text-emerald-700">Preferensi tersimpan di browser ini.</span>}</div>
      </section>

      <section className="rounded-2xl border border-[#E7E7E3] bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F0ED] text-lg">i</span><div><h2 className="font-bold">Keamanan akun</h2><p className="mt-1 text-sm leading-6 text-[#777771]">Login dan sesi admin tetap menggunakan endpoint autentikasi project yang ada. ZIP yang tersedia belum mencakup endpoint untuk mengganti password, mengubah username, atau menyimpan pengaturan toko ke server, sehingga fitur tersebut tidak dibuat seolah-olah sudah tersimpan.</p></div></div></section>
    </div>
  );
}
