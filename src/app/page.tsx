"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./context/CartContext";

export default function Home() {
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
  } = useCart();

  const [cartOpen, setCartOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#211A16]">

      {/* ================= NAVBAR ================= */}
      <nav className="border-b border-[#E5DED5] bg-[#F6F2EC]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <a href="#" className="text-2xl font-bold tracking-tight">
            GET-HERE
            <span className="ml-1 font-light">COFFEE</span>
          </a>

          {/* Menu */}
          <div className="hidden items-center gap-10 text-sm md:flex">
            <a
              href="#"
              className="transition hover:text-[#8A6348]"
            >
              Home
            </a>

            <a
              href="#produk"
              className="transition hover:text-[#8A6348]"
            >
              Produk
            </a>

            <a
              href="#tentang"
              className="transition hover:text-[#8A6348]"
            >
              Tentang
            </a>

            <a
              href="#kontak"
              className="transition hover:text-[#8A6348]"
            >
              Kontak
            </a>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="rounded-full bg-[#211A16] px-5 py-2 text-white transition hover:scale-105 hover:bg-[#3A2D25]"
          >
            🛒 Keranjang ({totalItems})
          </button>

        </div>
      </nav>


      {/* ================= HERO ================= */}
      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">

        <div>

          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
            Specialty Coffee
          </p>

          <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Coffee made for
            <span className="block font-normal italic text-[#8A6348]">
              your moment.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-8 text-[#756B63]">
            Temukan kopi pilihan Get-Here yang dibuat dari bahan berkualitas
            untuk menemani setiap momen dalam harimu.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">

            <a
              href="#produk"
              className="rounded-full bg-[#211A16] px-8 py-3.5 font-medium text-white transition hover:bg-[#3A2D25]"
            >
              Jelajahi Kopi
            </a>

            <a
              href="#tentang"
              className="rounded-full border border-[#211A16] px-8 py-3.5 font-medium transition hover:bg-[#211A16] hover:text-white"
            >
              Cerita Kami
            </a>

          </div>

        </div>


        {/* Hero Coffee */}
        <div className="flex justify-center">

          <div className="relative flex h-[420px] w-full max-w-[480px] items-center justify-center overflow-hidden rounded-[40px] bg-[#D9C7B5]">

            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#B89B82] opacity-40" />

            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#8A6348] opacity-30" />

            <div className="relative text-[130px] drop-shadow-2xl">
              ☕
            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURE ================= */}
      <section className="border-y border-[#E5DED5] bg-[#EEE7DE]">

        <div className="mx-auto grid max-w-7xl md:grid-cols-3">

          <div className="border-b border-[#DDD3C8] px-8 py-8 text-center md:border-b-0 md:border-r">
            <p className="text-2xl">☕</p>

            <h3 className="mt-3 font-semibold">
              Kopi Berkualitas
            </h3>

            <p className="mt-2 text-sm text-[#756B63]">
              Biji kopi pilihan untuk rasa terbaik.
            </p>
          </div>


          <div className="border-b border-[#DDD3C8] px-8 py-8 text-center md:border-b-0 md:border-r">
            <p className="text-2xl">✦</p>

            <h3 className="mt-3 font-semibold">
              Fresh & Freshly Made
            </h3>

            <p className="mt-2 text-sm text-[#756B63]">
              Dibuat dengan perhatian pada setiap detail.
            </p>
          </div>


          <div className="px-8 py-8 text-center">
            <p className="text-2xl">♡</p>

            <h3 className="mt-3 font-semibold">
              Dibuat dengan Hati
            </h3>

            <p className="mt-2 text-sm text-[#756B63]">
              Kopi untuk menemani momen spesialmu.
            </p>
          </div>

        </div>

      </section>


      {/* ================= PRODUK ================= */}
      <section id="produk" className="px-6 py-24">

        <div className="mx-auto max-w-7xl">

          <div className="mb-12 flex items-end justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
                Our Coffee
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Pilihan Favorit
              </h2>

            </div>

            <a
              href="#"
              className="hidden text-sm font-medium underline underline-offset-4 md:block"
            >
              Lihat semua →
            </a>

          </div>


          <div className="grid gap-7 md:grid-cols-3">

            {/* ================= PRODUCT 1 ================= */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">

              <div className="flex h-64 items-center justify-center bg-[#DED0C1] text-8xl transition duration-300 group-hover:scale-[1.02]">
                ☕
              </div>

              <div className="p-7">

                <p className="text-xs font-semibold uppercase tracking-widest text-[#9A8B7D]">
                  Signature
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Butterscotch
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#756B63]">
                  Perpaduan kopi creamy dengan rasa manis yang lembut.
                </p>

                <div className="mt-7 flex items-center justify-between">

                  <span className="text-lg font-semibold">
                    Rp22.000
                  </span>

                  <button
                    onClick={() =>
                      addToCart({
                        id: 1,
                        name: "Butterscotch",
                        price: 22000,
                      })
                    }
                    className="rounded-full bg-[#211A16] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A2D25]"
                  >
                    + Keranjang
                  </button>

                </div>

              </div>

            </div>


            {/* ================= PRODUCT 2 ================= */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">

              <div className="flex h-64 items-center justify-center bg-[#CBB8A5] text-8xl transition duration-300 group-hover:scale-[1.02]">
                ☕
              </div>

              <div className="p-7">

                <p className="text-xs font-semibold uppercase tracking-widest text-[#9A8B7D]">
                  Best Seller
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Kopi Gula Aren
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#756B63]">
                  Kopi dengan perpaduan espresso dan manisnya gula aren.
                </p>

                <div className="mt-7 flex items-center justify-between">

                  <span className="text-lg font-semibold">
                    Rp22.000
                  </span>

                  <button
                    onClick={() =>
                      addToCart({
                        id: 2,
                        name: "Kopi Gula Aren",
                        price: 22000,
                      })
                    }
                    className="rounded-full bg-[#211A16] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A2D25]"
                  >
                    + Keranjang
                  </button>

                </div>

              </div>

            </div>


            {/* ================= PRODUCT 3 ================= */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">

              <div className="flex h-64 items-center justify-center bg-[#B8A18B] text-8xl transition duration-300 group-hover:scale-[1.02]">
                ☕
              </div>

              <div className="p-7">

                <p className="text-xs font-semibold uppercase tracking-widest text-[#9A8B7D]">
                  Kopi Hitam Murni
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Americano
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#756B63]">
                  Racikan khas Get-Here dengan karakter rasa yang seimbang.
                </p>

                <div className="mt-7 flex items-center justify-between">

                  <span className="text-lg font-semibold">
                    Rp18.000
                  </span>

                  <button
                    onClick={() =>
                      addToCart({
                        id: 3,
                        name: "Americano",
                        price: 18000,
                      })
                    }
                    className="rounded-full bg-[#211A16] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A2D25]"
                  >
                    + Keranjang
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= ABOUT ================= */}
      <section
        id="tentang"
        className="bg-[#211A16] px-6 py-24 text-white"
      >

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#BDA994]">
            About Get-Here
          </p>

          <h2 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
            Bukan sekadar kopi.
            <br />

            <span className="font-normal italic text-[#CDB9A3]">
              Ini tentang momen.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl leading-8 text-[#B8ADA4]">
            Get-Here Coffee hadir untuk menghadirkan kopi yang sederhana,
            berkualitas, dan cocok untuk menemani cerita sehari-hari.
          </p>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer
        id="kontak"
        className="bg-[#211A16] px-6 pb-10 text-center text-white"
      >

        <div className="border-t border-[#443932] pt-10">

          <h3 className="text-xl font-semibold">
            GET-HERE COFFEE
          </h3>

          <p className="mt-2 text-sm text-[#9D9188]">
            Good Coffee. Good Moment.
          </p>

          <p className="mt-8 text-xs text-[#6F625A]">
            © 2026 Get-Here Coffee. All rights reserved.
          </p>

        </div>

      </footer>


      {/* ================= CART OVERLAY ================= */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}


      {/* ================= CART SIDEBAR ================= */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-[#F6F2EC] shadow-2xl transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >

        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-[#D8CEC3] p-6">

          <div>
            <h2 className="text-2xl font-bold">
              Keranjang
            </h2>

            <p className="text-sm text-[#6F6259]">
              {totalItems} item dalam keranjang
            </p>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl transition hover:bg-[#211A16] hover:text-white"
          >
            ×
          </button>

        </div>


        {/* Cart Product List */}
        <div className="h-[calc(100%-190px)] overflow-y-auto p-6">

          {cart.length === 0 ? (

            /* Empty Cart */
            <div className="flex h-full flex-col items-center justify-center text-center">

              <div className="mb-4 text-6xl">
                🛒
              </div>

              <h3 className="text-xl font-semibold">
                Keranjang masih kosong
              </h3>

              <p className="mt-2 text-sm text-[#6F6259]">
                Yuk pilih kopi favorit kamu.
              </p>

              <button
                onClick={() => setCartOpen(false)}
                className="mt-6 rounded-full bg-[#211A16] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#8A6348]"
              >
                Pilih Kopi
              </button>

            </div>

          ) : (

            /* Product List */
            <div className="space-y-4">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >

                  <div className="flex justify-between">

                    <div>
                      <h3 className="font-semibold">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#8A6348]">
                        Rp{item.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <span className="text-2xl">
                      ☕
                    </span>

                  </div>


                  {/* Quantity */}
                  <div className="mt-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F2EC] font-bold transition hover:bg-[#211A16] hover:text-white"
                      >
                        −
                      </button>

                      <span className="w-5 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F2EC] font-bold transition hover:bg-[#211A16] hover:text-white"
                      >
                        +
                      </button>

                    </div>

                    <p className="font-semibold">
                      Rp
                      {(item.price * item.quantity).toLocaleString(
                        "id-ID"
                      )}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* Cart Bottom */}
        {cart.length > 0 && (

          <div className="absolute bottom-0 left-0 right-0 border-t border-[#D8CEC3] bg-[#F6F2EC] p-6">

            <div className="mb-4 flex justify-between">

              <span className="text-[#6F6259]">
                Total
              </span>

              <span className="text-xl font-bold">
                Rp{totalPrice.toLocaleString("id-ID")}
              </span>

            </div>

          <Link
            href="/checkout"
            className="block w-full rounded-full bg-[#211A16] py-4 text-center font-semibold text-white transition hover:bg-[#8A6348]">
            Checkout →
          </Link>
          </div>

        )}

      </div>

    </main>
  );
}