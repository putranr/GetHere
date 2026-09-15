"use client";

import { useRef, useState, type MouseEvent } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // =========================================================
  // ANIMATION: PRODUK TERBANG KE KERANJANG
  // =========================================================
  const animateToCart = (event: MouseEvent<HTMLButtonElement>) => {
    const cartButton = cartButtonRef.current;

    if (!cartButton) return;

    const productCard = event.currentTarget.closest(".product-card");

    const productImage = productCard?.querySelector(
      "[data-product-image]"
    ) as HTMLElement | null;

    if (!productImage) return;

    const startRect = productImage.getBoundingClientRect();
    const endRect = cartButton.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const flyingCoffee = document.createElement("div");

    flyingCoffee.innerText = "☕";

    flyingCoffee.style.position = "fixed";
    flyingCoffee.style.left = `${startX}px`;
    flyingCoffee.style.top = `${startY}px`;
    flyingCoffee.style.transform = "translate(-50%, -50%) scale(1)";
    flyingCoffee.style.fontSize =
      window.innerWidth < 640 ? "48px" : "70px";
    flyingCoffee.style.zIndex = "9999";
    flyingCoffee.style.pointerEvents = "none";
    flyingCoffee.style.filter =
      "drop-shadow(0 12px 10px rgba(0,0,0,0.25))";

    document.body.appendChild(flyingCoffee);

    // PHASE 1 — kopi naik
    flyingCoffee.animate(
      [
        {
          transform: "translate(-50%, -50%) scale(1)",
          opacity: 1,
        },
        {
          transform:
            "translate(-50%, calc(-50% - 80px)) scale(1.08)",
          opacity: 1,
        },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      }
    );

    // PHASE 2 + 3 — tunggu 1 detik lalu terbang
    setTimeout(() => {
      flyingCoffee.animate(
        [
          {
            transform:
              "translate(-50%, calc(-50% - 80px)) scale(1.08)",
            opacity: 1,
          },
          {
            transform: `translate(
              calc(-50% + ${deltaX * 0.35}px),
              calc(-50% + ${deltaY * 0.35 - 130}px)
            )
            scale(0.85)
            rotate(-10deg)`,
            opacity: 1,
          },
          {
            transform: `translate(
              calc(-50% + ${deltaX * 0.75}px),
              calc(-50% + ${deltaY * 0.75}px)
            )
            scale(0.5)
            rotate(180deg)`,
            opacity: 0.8,
          },
          {
            transform: `translate(
              calc(-50% + ${deltaX}px),
              calc(-50% + ${deltaY}px)
            )
            scale(0.15)
            rotate(360deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1800,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      // Bounce keranjang
      setTimeout(() => {
        cartButton.animate(
          [
            { transform: "scale(1)" },
            {
              transform: "scale(1.18) rotate(-4deg)",
            },
            {
              transform: "scale(0.94) rotate(3deg)",
            },
            {
              transform: "scale(1.08) rotate(-2deg)",
            },
            { transform: "scale(1)" },
          ],
          {
            duration: 600,
            easing: "ease-out",
          }
        );
      }, 1600);
    }, 1700);

    // Hapus elemen animasi
    setTimeout(() => {
      flyingCoffee.remove();
    }, 3600);
  };

  // =========================================================
  // DATA PRODUK
  // =========================================================
  const products = [
    {
      id: 1,
      name: "Butterscotch",
      category: "Signature",
      description:
        "Perpaduan kopi creamy dengan rasa manis yang lembut.",
      price: 22000,
      bg: "#DED0C1",
    },
    {
      id: 2,
      name: "Kopi Gula Aren",
      category: "Best Seller",
      description:
        "Kopi dengan perpaduan espresso dan manisnya gula aren.",
      price: 22000,
      bg: "#CBB8A5",
    },
    {
      id: 3,
      name: "Americano",
      category: "Kopi Hitam Murni",
      description:
        "Racikan khas Get-Here dengan karakter rasa yang seimbang.",
      price: 18000,
      bg: "#B8A18B",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#211A16]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <nav className="border-b border-[#E5DED5] bg-[#F6F2EC]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">

          {/* LOGO */}
          <a
            href="#"
            className="shrink-0 text-lg font-bold tracking-tight sm:text-2xl"
            onClick={() => setMobileMenuOpen(false)}
          >
            GET-HERE
            <span className="ml-1 font-light">COFFEE</span>
          </a>

          {/* DESKTOP MENU */}
          <div className="hidden items-center gap-8 text-sm lg:gap-10 md:flex">
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

            <Link
              href="/tracking"
              className="transition hover:opacity-70"
            >
              Lacak Pesanan
            </Link>
          </div>

          {/* RIGHT NAV */}
          <div className="flex items-center gap-2">

            {/* CART */}
            <button
              ref={cartButtonRef}
              onClick={() => setCartOpen(true)}
              className="shrink-0 rounded-full bg-[#211A16] px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-[#3A2D25] sm:px-5 sm:py-2.5 sm:text-sm"
            >
              🛒
              <span className="ml-1 hidden sm:inline">
                Keranjang
              </span>{" "}
              ({totalItems})
            </button>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CEC3] text-lg md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "×" : "☰"}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-t border-[#E5DED5] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">

              <a
                href="#"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white"
              >
                Home
              </a>

              <a
                href="#produk"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white"
              >
                Produk
              </a>

              <a
                href="#tentang"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white"
              >
                Tentang
              </a>

              <a
                href="#kontak"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white"
              >
                Kontak
              </a>

              <Link
                href="/tracking"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white"
              >
                Lacak Pesanan
              </Link>

            </div>
          </div>
        )}
      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-16 md:py-28">

        {/* HERO TEXT */}
        <div>

          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
            Specialty Coffee
          </p>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
            Coffee made for
            <span className="block font-normal italic text-[#8A6348]">
              your moment.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-[#756B63] sm:mt-7 sm:text-lg sm:leading-8">
            Temukan kopi pilihan Get-Here yang dibuat dari bahan
            berkualitas untuk menemani setiap momen dalam harimu.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">

            <a
              href="#produk"
              className="rounded-full bg-[#211A16] px-8 py-3.5 text-center font-medium text-white transition hover:bg-[#3A2D25]"
            >
              Jelajahi Kopi
            </a>

            <a
              href="#tentang"
              className="rounded-full border border-[#211A16] px-8 py-3.5 text-center font-medium transition hover:bg-[#211A16] hover:text-white"
            >
              Cerita Kami
            </a>

          </div>
        </div>


        {/* HERO IMAGE */}
        <div className="flex justify-center">

          <div className="relative flex h-[300px] w-full max-w-[480px] items-center justify-center overflow-hidden rounded-[32px] bg-[#D9C7B5] sm:h-[360px] sm:rounded-[40px] md:h-[420px]">

            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#B89B82] opacity-40" />

            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#8A6348] opacity-30" />

            <div className="relative text-[90px] drop-shadow-2xl sm:text-[110px] md:text-[130px]">
              ☕
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE
      ===================================================== */}
      <section className="border-y border-[#E5DED5] bg-[#EEE7DE]">

        <div className="mx-auto grid max-w-7xl md:grid-cols-3">

          {/* FEATURE 1 */}
          <div className="border-b border-[#DDD3C8] px-6 py-7 text-center sm:px-8 sm:py-8 md:border-b-0 md:border-r">

            <p className="text-2xl">☕</p>

            <h3 className="mt-3 font-semibold">
              Kopi Berkualitas
            </h3>

            <p className="mt-2 text-sm text-[#756B63]">
              Biji kopi pilihan untuk rasa terbaik.
            </p>

          </div>


          {/* FEATURE 2 */}
          <div className="border-b border-[#DDD3C8] px-6 py-7 text-center sm:px-8 sm:py-8 md:border-b-0 md:border-r">

            <p className="text-2xl">✦</p>

            <h3 className="mt-3 font-semibold">
              Fresh & Freshly Made
            </h3>

            <p className="mt-2 text-sm text-[#756B63]">
              Dibuat dengan perhatian pada setiap detail.
            </p>

          </div>


          {/* FEATURE 3 */}
          <div className="px-6 py-7 text-center sm:px-8 sm:py-8">

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


      {/* =====================================================
          PRODUK
      ===================================================== */}
      <section
        id="produk"
        className="px-4 py-16 sm:px-6 sm:py-20 md:py-24"
      >

        <div className="mx-auto max-w-7xl">

          {/* SECTION TITLE */}
          <div className="mb-10 flex items-end justify-between sm:mb-12">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
                Our Coffee
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
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


          {/* PRODUCT GRID */}
          <div className="grid gap-7 md:grid-cols-3">

            {products.map((product) => (
              <div
                key={product.id}
                className="product-card group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >

                {/* PRODUCT IMAGE */}
                <div
                  data-product-image
                  style={{
                    backgroundColor: product.bg,
                  }}
                  className="flex h-56 items-center justify-center text-7xl transition duration-300 group-hover:scale-[1.02] sm:h-64 sm:text-8xl"
                >
                  ☕
                </div>


                {/* PRODUCT INFO */}
                <div className="p-6 sm:p-7">

                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9A8B7D]">
                    {product.category}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                    {product.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#756B63]">
                    {product.description}
                  </p>


                  {/* PRICE + BUTTON */}
                  <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <span className="text-lg font-semibold">
                      Rp{product.price.toLocaleString("id-ID")}
                    </span>

                    <button
                      onClick={(event) => {
                        animateToCart(event);

                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                        });
                      }}
                      className="w-full rounded-full bg-[#211A16] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A2D25] sm:w-auto"
                    >
                      + Keranjang
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ===================================================== */}
      <section
        id="tentang"
        className="bg-[#211A16] px-4 py-20 text-white sm:px-6 sm:py-24"
      >

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#BDA994]">
            About Get-Here
          </p>

          <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Bukan sekadar kopi.
            <br />

            <span className="font-normal italic text-[#CDB9A3]">
              Ini tentang momen.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#B8ADA4] sm:text-base sm:leading-8">
            Get-Here Coffee hadir untuk menghadirkan kopi yang
            sederhana, berkualitas, dan cocok untuk menemani cerita
            sehari-hari.
          </p>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer
        id="kontak"
        className="bg-[#211A16] px-4 pb-8 text-center text-white sm:px-6 sm:pb-10"
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


      {/* =====================================================
          CART OVERLAY
      ===================================================== */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}


      {/* =====================================================
          CART SIDEBAR
      ===================================================== */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-[#F6F2EC] shadow-2xl transition-transform duration-300 ${
          cartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >

        {/* CART HEADER */}
        <div className="flex items-center justify-between border-b border-[#D8CEC3] p-4 sm:p-6">

          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Keranjang
            </h2>

            <p className="text-xs text-[#6F6259] sm:text-sm">
              {totalItems} item dalam keranjang
            </p>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl transition hover:bg-[#211A16] hover:text-white"
            aria-label="Tutup keranjang"
          >
            ×
          </button>

        </div>


        {/* CART LIST */}
        <div className="h-[calc(100%-190px)] overflow-y-auto p-4 sm:p-6">

          {cart.length === 0 ? (

            /* EMPTY CART */
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

            /* PRODUCT LIST */
            <div className="space-y-4">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >

                  {/* ITEM INFO */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="font-semibold">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#8A6348]">
                        Rp{item.price.toLocaleString("id-ID")}
                      </p>

                    </div>

                    <span className="shrink-0 text-2xl">
                      ☕
                    </span>

                  </div>


                  {/* QUANTITY */}
                  <div className="mt-4 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <button
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F2EC] font-bold transition hover:bg-[#211A16] hover:text-white"
                      >
                        −
                      </button>

                      <span className="w-5 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F2EC] font-bold transition hover:bg-[#211A16] hover:text-white"
                      >
                        +
                      </button>

                    </div>

                    <p className="text-sm font-semibold sm:text-base">
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


        {/* CART BOTTOM */}
        {cart.length > 0 && (

          <div className="absolute bottom-0 left-0 right-0 border-t border-[#D8CEC3] bg-[#F6F2EC] p-4 sm:p-6">

            <div className="mb-4 flex items-center justify-between gap-4">

              <span className="text-sm text-[#6F6259]">
                Total
              </span>

              <span className="text-lg font-bold sm:text-xl">
                Rp{totalPrice.toLocaleString("id-ID")}
              </span>

            </div>

            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="block w-full rounded-full bg-[#211A16] py-3.5 text-center font-semibold text-white transition hover:bg-[#8A6348] sm:py-4"
            >
              Checkout →
            </Link>

          </div>

        )}

      </div>

    </main>
  );
}