"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import {
  useCart,
  type Packaging,
} from "./context/CartContext";

// =========================================================
// PRODUCT TYPE
// =========================================================

type Product = {
  id: number;
  name: string;
  description?: string | null;

  // Harga dasar
  price: number;

  // Harga kemasan
  cupPrice?: number | null;
  bottlePrice?: number | null;

  // Gambar
  image?: string | null;

  // Diskon
  discountPercent: number;

  isAvailable: boolean;

  category: "COFFEE" | "NON_COFFEE";
};

// =========================================================
// PAGE
// =========================================================

export default function Home() {
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalItems,
    totalPrice,
  } = useCart();

  // =======================================================
  // PRODUCTS
  // =======================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // =======================================================
  // UI
  // =======================================================

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // =======================================================
  // LOAD PRODUCTS
  // =======================================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true);

        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Gagal mengambil produk.");
          return;
        }

        const data = await response.json();

        if (
          data.success &&
          Array.isArray(data.products)
        ) {
          setProducts(
            data.products.filter(
              (product: Product) => product.isAvailable
            )
          );
        }
      } catch (error) {
        console.error(
          "Gagal mengambil produk:",
          error
        );
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  // =======================================================
  // CATEGORY
  // =======================================================

  const isNonCoffee = (product: Product) =>
    product.category === "NON_COFFEE";

  const coffeeProducts = products.filter(
    (product) => !isNonCoffee(product)
  );

  const nonCoffeeProducts = products.filter(
    (product) => isNonCoffee(product)
  );

  // =======================================================
  // PRICE
  // =======================================================

  const getPackagingPrice = (
    product: Product,
    packaging: Packaging
  ): number | null => {
    if (packaging === "CUP") {
      return product.cupPrice ?? product.price;
    }

    return product.bottlePrice ?? null;
  };

  const getFinalPrice = (
    product: Product,
    packaging: Packaging
  ): number | null => {
    const originalPrice = getPackagingPrice(
      product,
      packaging
    );

    if (originalPrice === null) {
      return null;
    }

    const discount =
      product.discountPercent ?? 0;

    return Math.max(
      Math.round(
        (originalPrice * (100 - discount)) / 100
      ),
      0
    );
  };

  // =======================================================
  // ANIMATION TO CART
  // =======================================================

  const animateToCart = (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    const cartButton = cartButtonRef.current;

    if (!cartButton) {
      return;
    }

    const productCard =
      event.currentTarget.closest(
        ".product-card"
      );

    const productImage =
      productCard?.querySelector(
        "[data-product-image]"
      ) as HTMLElement | null;

    if (!productImage) {
      return;
    }

    const startRect =
      productImage.getBoundingClientRect();

    const endRect =
      cartButton.getBoundingClientRect();

    const startX =
      startRect.left +
      startRect.width / 2;

    const startY =
      startRect.top +
      startRect.height / 2;

    const endX =
      endRect.left +
      endRect.width / 2;

    const endY =
      endRect.top +
      endRect.height / 2;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const flyingCoffee =
      document.createElement("div");

    flyingCoffee.innerText = "☕";

    Object.assign(
      flyingCoffee.style,
      {
        position: "fixed",
        left: `${startX}px`,
        top: `${startY}px`,
        transform:
          "translate(-50%, -50%) scale(1)",
        fontSize:
          window.innerWidth < 640
            ? "42px"
            : "62px",
        zIndex: "9999",
        pointerEvents: "none",
        filter:
          "drop-shadow(0 12px 10px rgba(0,0,0,0.25))",
      }
    );

    document.body.appendChild(
      flyingCoffee
    );

    flyingCoffee.animate(
      [
        {
          transform:
            "translate(-50%, -50%) scale(1)",
          opacity: 1,
        },
        {
          transform:
            "translate(-50%, calc(-50% - 70px)) scale(1.1)",
          opacity: 1,
        },
      ],
      {
        duration: 550,
        easing:
          "cubic-bezier(0.2,0.8,0.2,1)",
        fill: "forwards",
      }
    );

    setTimeout(() => {
      flyingCoffee.animate(
        [
          {
            transform:
              "translate(-50%, calc(-50% - 70px)) scale(1.1)",
            opacity: 1,
          },
          {
            transform: `translate(
              calc(-50% + ${deltaX * 0.4}px),
              calc(-50% + ${deltaY * 0.4 - 100}px)
            ) scale(.8)`,
            opacity: 1,
          },
          {
            transform: `translate(
              calc(-50% + ${deltaX}px),
              calc(-50% + ${deltaY}px)
            ) scale(.1) rotate(360deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1300,
          easing:
            "cubic-bezier(0.22,1,0.36,1)",
          fill: "forwards",
        }
      );

      setTimeout(() => {
        cartButton.animate(
          [
            {
              transform: "scale(1)",
            },
            {
              transform:
                "scale(1.15) rotate(-4deg)",
            },
            {
              transform:
                "scale(.95) rotate(3deg)",
            },
            {
              transform: "scale(1.06)",
            },
            {
              transform: "scale(1)",
            },
          ],
          {
            duration: 550,
            easing: "ease-out",
          }
        );
      }, 900);
    }, 600);

    setTimeout(() => {
      flyingCoffee.remove();
    }, 2300);
  };

  // =======================================================
  // PRODUCT CARD
  // =======================================================

  const ProductCard = ({
    product,
    compact = false,
  }: {
    product: Product;
    compact?: boolean;
  }) => {
    const [packaging, setPackaging] =
      useState<Packaging>(
        product.cupPrice != null
          ? "CUP"
          : "BOTTLE"
      );

    const selectedOriginalPrice =
      getPackagingPrice(
        product,
        packaging
      );

    const finalPrice =
      getFinalPrice(
        product,
        packaging
      );

    const handlePackagingChange = (
      selectedPackaging: Packaging
    ) => {
      const selectedPrice =
        getPackagingPrice(
          product,
          selectedPackaging
        );

      if (
        selectedPackaging === "BOTTLE" &&
        selectedPrice === null
      ) {
        return;
      }

      setPackaging(
        selectedPackaging
      );
    };

    const handleAddToCart = (
      event: MouseEvent<HTMLButtonElement>
    ) => {
      if (
        selectedOriginalPrice === null ||
        finalPrice === null
      ) {
        return;
      }

      animateToCart(event);

      /*
       * CartContext yang sekarang menghitung
       * originalPrice + finalPrice sendiri
       * berdasarkan packaging.
       *
       * Gambar cart nanti diambil dari
       * products yang sudah dimuat di page ini.
       */
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        cupPrice: product.cupPrice,
        bottlePrice: product.bottlePrice,
        discountPercent: product.discountPercent,
        category: product.category,
        packaging,
      });
    };

    return (
      <div
        className={`product-card group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#E7DED4] bg-white shadow-[0_8px_30px_rgba(45,30,20,0.06)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_18px_45px_rgba(45,30,20,0.13)] ${
          compact ? "w-full" : ""
        }`}
      >
        {/* IMAGE */}

        <div
          data-product-image
          className="relative flex h-[220px] shrink-0 items-center justify-center overflow-hidden bg-[#E4D5C4] sm:h-[245px]"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";

                const fallback =
                  event.currentTarget.parentElement?.querySelector(
                    "[data-image-fallback]"
                  ) as HTMLElement | null;

                if (fallback) {
                  fallback.style.display =
                    "flex";
                }
              }}
            />
          ) : null}

          <div
            data-image-fallback
            className={`absolute inset-0 items-center justify-center text-7xl ${
              product.image
                ? "hidden"
                : "flex"
            }`}
          >
            ☕
          </div>

          {product.discountPercent > 0 && (
            <div className="absolute left-4 top-4 rounded-full bg-[#6D321B] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              -{product.discountPercent}%
            </div>
          )}

          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition hover:scale-110"
          >
            ♡
          </button>

        </div>

        {/* INFO */}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6348]">
              {isNonCoffee(product)
                ? "Non Coffee"
                : "Coffee"}
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#261C17]">
            {product.name}
          </h3>

          <p className="mt-2 min-h-[44px] text-sm leading-6 text-[#756B63]">
            {product.description ||
              "Minuman pilihan Get-Here untuk menemani setiap momen."}
          </p>

          {/* PACKAGING */}

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-[#4D4037]">
              Pilih Kemasan
            </p>

            <div className="grid grid-cols-2 gap-2">
              {/* CUP */}

              <button
                type="button"
                onClick={() =>
                  handlePackagingChange(
                    "CUP"
                  )
                }
                disabled={
                  product.cupPrice == null
                }
                className={`relative rounded-2xl border p-3 text-left transition ${
                  packaging === "CUP"
                    ? "border-[#40551F] bg-[#F2F5EA] shadow-sm"
                    : "border-[#E2D8CD] bg-white hover:border-[#B7A999]"
                } ${
                  product.cupPrice == null
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
              >
                {packaging === "CUP" &&
                  product.cupPrice != null && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#40551F] text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}

                <div className="text-lg">
                  🥤
                </div>

                <p className="mt-1 text-xs font-bold text-[#261C17]">
                  Cup
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#6D321B]">
                  {product.cupPrice != null
                    ? `Rp${Math.round(
                        product.cupPrice -
                          (product.cupPrice *
                            product.discountPercent) /
                            100
                      ).toLocaleString(
                        "id-ID"
                      )}`
                    : "Tidak tersedia"}
                </p>
              </button>

              {/* BOTTLE */}

              <button
                type="button"
                onClick={() =>
                  handlePackagingChange(
                    "BOTTLE"
                  )
                }
                disabled={
                  product.bottlePrice == null
                }
                className={`relative rounded-2xl border p-3 text-left transition ${
                  packaging === "BOTTLE"
                    ? "border-[#40551F] bg-[#F2F5EA] shadow-sm"
                    : "border-[#E2D8CD] bg-white hover:border-[#B7A999]"
                } ${
                  product.bottlePrice == null
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
              >
                {packaging === "BOTTLE" &&
                  product.bottlePrice != null && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#40551F] text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}

                <div className="text-lg">
                  🧴
                </div>

                <p className="mt-1 text-xs font-bold text-[#261C17]">
                  Bottle
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#6D321B]">
                  {product.bottlePrice != null
                    ? `Rp${Math.round(
                        product.bottlePrice -
                          (product.bottlePrice *
                            product.discountPercent) /
                            100
                      ).toLocaleString(
                        "id-ID"
                      )}`
                    : "Tidak tersedia"}
                </p>
              </button>
            </div>
          </div>

          {/* PRICE */}

          <div className="mt-auto pt-5">
            {product.discountPercent > 0 &&
              selectedOriginalPrice !==
                null && (
                <span className="block text-xs text-[#9A8B7D] line-through">
                  Rp
                  {selectedOriginalPrice.toLocaleString(
                    "id-ID"
                  )}
                </span>
              )}

            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-lg font-extrabold text-[#261C17]">
                {finalPrice !== null
                  ? `Rp${finalPrice.toLocaleString(
                      "id-ID"
                    )}`
                  : "N/A"}
              </span>

              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  finalPrice === null
                }
                className="shrink-0 rounded-full bg-[#40551F] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-105 hover:bg-[#334517] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                + Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =======================================================
  // MENU FILTER
  // =======================================================

  type MenuFilter =
    | "ALL"
    | "COFFEE"
    | "NON_COFFEE";

  const [menuFilter, setMenuFilter] =
    useState<MenuFilter>("ALL");

  const filteredProducts =
    menuFilter === "ALL"
      ? products
      : menuFilter === "COFFEE"
      ? coffeeProducts
      : nonCoffeeProducts;

  // =======================================================
  // HERO
  // =======================================================

  const heroProducts =
    coffeeProducts.slice(0, 2);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8F3EC] text-[#261C17]">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#E7DED4] bg-[#F8F3EC]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="shrink-0"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            <div className="text-[24px] font-black tracking-[-0.06em] text-[#233319]">
              GetHere
            </div>

            <div className="-mt-1 text-[7px] font-semibold tracking-wide text-[#6C6259]">
              Together, We Got You.
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
            <a
              href="#"
              className="transition hover:text-[#6D321B]"
            >
              Home
            </a>

            <a
              href="#produk"
              className="transition hover:text-[#6D321B]"
            >
              Menu
            </a>

            <a
              href="#tentang"
              className="transition hover:text-[#6D321B]"
            >
              About
            </a>

            <a
              href="#kontak"
              className="transition hover:text-[#6D321B]"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/tracking"
              className="hidden rounded-full border border-[#D8C9BA] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#40551F] hover:text-[#40551F] sm:block"
            >
              Lacak Pesanan
            </Link>

            <button
              ref={cartButtonRef}
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#40551F] text-xl text-white shadow-lg transition hover:scale-105"
            >
              🛒

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D321B] px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8C9BA] bg-white lg:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E7DED4] bg-[#F8F3EC] px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold">
              <a
                href="#"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Home
              </a>

              <a
                href="#produk"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Menu
              </a>

              <a
                href="#tentang"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                About
              </a>

              <Link
                href="/tracking"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Lacak Pesanan
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8A6348]">
              GetHere Coffee
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-7xl">
              Good Coffee.
              <br />
              Good{" "}
              <span className="italic text-[#6D321B]">
                Moment.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#756B63] sm:text-base">
              Temukan minuman favoritmu,
              pilih kemasan yang kamu suka,
              lalu pesan dengan mudah
              bersama GetHere.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#produk"
                className="rounded-full bg-[#40551F] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Lihat Menu
              </a>

              <Link
                href="/tracking"
                className="rounded-full border border-[#D8C9BA] bg-white px-7 py-3.5 text-sm font-bold"
              >
                Lacak Pesanan
              </Link>
            </div>
          </div>

          {/* BEST SELLER */}

              <div>
                {/* BEST SELLER HEADER */}

                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8A6348]">
                      GetHere Picks
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight text-[#261C17] sm:text-3xl">
                      Best Seller
                    </h2>
                  </div>

                  <a
                    href="#produk"
                    className="text-xs font-bold text-[#40551F] transition hover:text-[#6D321B]"
                  >
                    Lihat Semua →
                  </a>
                </div>

                {/* BEST SELLER PRODUCTS */}

                <div className="grid grid-cols-2 gap-4">
                  {heroProducts.length > 0 ? (
                    heroProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        compact
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex min-h-[300px] items-center justify-center rounded-[30px] bg-[#E4D5C4] text-7xl">
                      ☕
                    </div>
                  )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="px-5 pb-8 sm:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-3">
          <div className="rounded-[25px] bg-white p-6 shadow-sm">
            <div className="text-2xl">
              ☕
            </div>
            <h3 className="mt-3 font-bold">
              Coffee Pilihan
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#756B63]">
              Pilihan coffee favorit
              untuk menemani aktivitasmu.
            </p>
          </div>

          <div className="rounded-[25px] bg-white p-6 shadow-sm">
            <div className="text-2xl">
              🧴
            </div>
            <h3 className="mt-3 font-bold">
              Cup & Bottle
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#756B63]">
              Bebas memilih kemasan
              sesuai kebutuhanmu.
            </p>
          </div>

          <div className="rounded-[25px] bg-white p-6 shadow-sm">
            <div className="text-2xl">
              ♡
            </div>
            <h3 className="mt-3 font-bold">
              Banyak Varian
            </h3>
            <p className="mt-2 text-xs leading-6 text-[#756B63]">
              Coffee dan non coffee
              favoritmu.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MENU
      ===================================================== */}

      <section
        id="produk"
        className="px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8A6348]">
              Our Menu
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                  Menu Favorit
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#756B63] sm:text-base">
                  Temukan minuman favoritmu
                  dari berbagai pilihan
                  coffee dan non coffee
                  GetHere.
                </p>
              </div>

              <div className="hidden rounded-full bg-[#E9DDCE] px-5 py-2.5 text-xs font-bold text-[#6D321B] sm:block">
                {filteredProducts.length}{" "}
                menu tersedia
              </div>
            </div>
          </div>

          {/* FILTER */}

          <div className="mb-10 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMenuFilter("ALL")
              }
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter === "ALL"
                  ? "bg-[#40551F] text-white shadow-lg"
                  : "border border-[#D8C9BA] bg-white text-[#5F5147]"
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuFilter("COFFEE")
              }
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter === "COFFEE"
                  ? "bg-[#40551F] text-white shadow-lg"
                  : "border border-[#D8C9BA] bg-white text-[#5F5147]"
              }`}
            >
              ☕ Coffee
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuFilter("NON_COFFEE")
              }
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter ===
                "NON_COFFEE"
                  ? "bg-[#40551F] text-white shadow-lg"
                  : "border border-[#D8C9BA] bg-white text-[#5F5147]"
              }`}
            >
              🥤 Non Coffee
            </button>
          </div>

          {/* LOADING */}

          {productsLoading ? (
            <div className="rounded-[30px] bg-white py-20 text-center shadow-sm">
              <div className="mb-4 animate-pulse text-5xl">
                ☕
              </div>

              <p className="text-sm text-[#756B63]">
                Memuat menu GetHere...
              </p>
            </div>
          ) : products.length ===
            0 ? (
            <div className="rounded-[30px] bg-white py-20 text-center shadow-sm">
              <div className="mb-4 text-5xl">
                🥤
              </div>

              <h3 className="font-bold">
                Belum ada produk tersedia
              </h3>

              <p className="mt-2 text-sm text-[#756B63]">
                Produk yang ditambahkan
                dari dashboard admin
                akan muncul di sini.
              </p>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="rounded-[30px] bg-white py-20 text-center shadow-sm">
              <div className="mb-4 text-5xl">
                🔍
              </div>

              <h3 className="font-bold">
                Tidak ada produk
              </h3>

              <p className="mt-2 text-sm text-[#756B63]">
                Belum ada produk dalam
                kategori ini.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="tentang"
        className="bg-[#2D211B] px-5 py-20 text-white sm:px-8"
      >
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#CDB9A3]">
              About GetHere
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Good Coffee.
              <br />

              <span className="font-normal italic text-[#DDBD99]">
                Good Moment.
              </span>
            </h2>
          </div>

          <div>
            <p className="text-sm leading-7 text-[#C8BDB4] sm:text-base">
              GetHere hadir untuk
              menghadirkan minuman yang
              sederhana, berkualitas,
              dan cocok untuk menemani
              cerita sehari-hari.
            </p>

            <p className="mt-5 text-sm leading-7 text-[#C8BDB4] sm:text-base">
              Mulai dari coffee favorit
              sampai berbagai pilihan
              non coffee, semuanya
              dibuat untuk memberikan
              pengalaman minum yang
              nyaman dan menyenangkan.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        id="kontak"
        className="bg-[#211914] px-5 py-10 text-white sm:px-8"
      >
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-2xl font-black">
              GetHere
            </div>

            <p className="mt-1 text-xs text-[#9D9188]">
              Together, We Got You.
            </p>
          </div>

          <div className="text-xs text-[#756B63]">
            © 2026 Get-Here Coffee.
            All rights reserved.
          </div>
        </div>
      </footer>

      {/* =====================================================
          CART OVERLAY
      ===================================================== */}

      {cartOpen && (
        <div
          onClick={() =>
            setCartOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* =====================================================
          CART SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#F8F3EC] shadow-2xl transition-transform duration-300 ${
          cartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#DED2C6] p-5">
          <div>
            <h2 className="text-2xl font-black">
              Keranjang Kamu
            </h2>

            <p className="mt-1 text-xs text-[#756B63]">
              {totalItems} item dalam
              keranjang
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCartOpen(false)
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl transition hover:bg-[#2D211B] hover:text-white"
          >
            ×
          </button>
        </div>

        {/* CART ITEMS */}

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 text-6xl">
                🛒
              </div>

              <h3 className="text-xl font-bold">
                Keranjang masih kosong
              </h3>

              <p className="mt-2 text-sm text-[#756B63]">
                Yuk pilih minuman
                favorit kamu.
              </p>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="mt-6 rounded-full bg-[#40551F] px-7 py-3 text-sm font-bold text-white"
              >
                Pilih Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                /*
                 * CartContext belum menyimpan gambar.
                 * Jadi gambar dicari berdasarkan product ID.
                 */

                const cartProduct =
                  products.find(
                    (product) =>
                      product.id ===
                      item.id
                  );

                const cartImage = cartProduct?.image;

                return (
                  <div
                    key={`${item.id}-${item.packaging}`}
                    className="rounded-2xl border border-[#E6DCD1] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold">
                          {item.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#EFE5D9] px-2.5 py-1 text-[10px] font-bold uppercase text-[#6D321B]">
                            {item.packaging ===
                            "BOTTLE"
                              ? "🧴 Bottle"
                              : "🥤 Cup"}
                          </span>

                          {item.discountPercent >
                            0 && (
                            <span className="rounded-full bg-[#E8F0D9] px-2.5 py-1 text-[10px] font-bold text-[#40551F]">
                              -{" "}
                              {
                                item.discountPercent
                              }
                              %
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CART IMAGE */}

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#E4D5C4]">
                        {cartImage ? (
                          <img
                            src={cartImage}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";

                              const fallback =
                                event
                                  .currentTarget
                                  .parentElement?.querySelector(
                                    "[data-cart-image-fallback]"
                                  ) as HTMLElement | null;

                              if (fallback) {
                                fallback.style.display =
                                  "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          data-cart-image-fallback
                          className={`h-full w-full items-center justify-center text-3xl ${
                            cartImage
                              ? "hidden"
                              : "flex"
                          }`}
                        >
                          {item.packaging ===
                          "BOTTLE"
                            ? "🧴"
                            : "🥤"}
                        </div>
                      </div>
                    </div>

                    {/* PRICE */}

                    <div className="mt-3">
                      {item.discountPercent >
                        0 && (
                        <p className="text-xs text-[#9A8B7D] line-through">
                          Rp
                          {item.originalPrice.toLocaleString(
                            "id-ID"
                          )}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-bold text-[#8A6348]">
                        Rp
                        {item.finalPrice.toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>

                    {/* QUANTITY */}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-[#E0D5CA] bg-[#FAF7F3] p-1">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.id,
                              item.packaging
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center text-sm font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              item.id,
                              item.packaging
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#40551F] font-bold text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            item.id,
                            item.packaging
                          )
                        }
                        className="text-xs font-semibold text-red-500 transition hover:text-red-700"
                      >
                        Hapus item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CART FOOTER */}

        {cart.length > 0 && (
          <div className="border-t border-[#DED2C6] bg-[#F8F3EC] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#756B63]">
                Total
              </span>

              <span className="text-xl font-black">
                Rp
                {totalPrice.toLocaleString(
                  "id-ID"
                )}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={() =>
                setCartOpen(false)
              }
              className="block w-full rounded-full bg-[#40551F] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#334517]"
            >
              Lanjut Checkout
            </Link>
          </div>
        )}
      </aside>
    </main>
  );
}