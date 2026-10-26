"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Link from "next/link";
import {
  useCart,
  type Packaging,
} from "./context/CartContext";
import {
  BottlePackagingIcon,
  CoffeeMugIcon,
  CupPackagingIcon,
} from "@/components/PackagingIcons";

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
  const [selectedPackagingByProduct, setSelectedPackagingByProduct] =
    useState<Record<number, Packaging>>({});

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

  // Visual hero and featured products use images already saved for products.
  const heroVisualProduct = coffeeProducts[0] ?? products[0];
  const bestSellerProducts = (
    coffeeProducts.length > 0 ? coffeeProducts : products
  ).slice(0, 4);

  // =======================================================
  // UI
  // =======================================================

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartButtonRef =
    useRef<HTMLButtonElement>(null);

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
    event: PointerEvent<HTMLButtonElement>
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
    const packaging: Packaging =
      selectedPackagingByProduct[product.id] ??
      (product.cupPrice != null ? "CUP" : "BOTTLE");

    const selectedOriginalPrice = getPackagingPrice(
      product,
      packaging
    );
    const finalPrice = getFinalPrice(product, packaging);

    const handlePackagingChange = (selected: Packaging) => {
      if (getPackagingPrice(product, selected) === null) return;
      setSelectedPackagingByProduct((current) => ({
        ...current,
        [product.id]: selected,
      }));
    };

    const handleAddToCart = (event: PointerEvent<HTMLButtonElement>) => {
      if (selectedOriginalPrice === null || finalPrice === null) return;

      animateToCart(event);
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

    const packagingPriceLabel = (price: number | null | undefined) => {
      if (price == null) return "Tidak tersedia";
      const discounted = Math.round(
        price * (100 - (product.discountPercent ?? 0)) / 100
      );
      return `Rp${discounted.toLocaleString("id-ID")}`;
    };

    return (
      <div
        className="product-card group flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-[#E4E4E1] bg-white shadow-[0_6px_24px_rgba(25,20,16,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(25,20,16,0.12)]"
      >
        {/* FOTO PRODUK: tetap menggunakan image yang tersimpan di database */}
        <div
          data-product-image
          className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[#E7E7E3] ${
            compact ? "h-[145px] sm:h-[165px]" : "h-[180px] sm:h-[205px]"
          }`}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.parentElement?.querySelector(
                  "[data-image-fallback]"
                ) as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            data-image-fallback
            className={`absolute inset-0 items-center justify-center ${
              product.image ? "hidden" : "flex"
            }`}
          >
            <CoffeeMugIcon className="h-14 w-14 text-[#777772]" />
          </div>

          {product.discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-[#171717] px-3 py-1 text-[11px] font-bold text-white">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        <div className={`flex flex-1 flex-col ${compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666660]">
            {isNonCoffee(product) ? "Non Coffee" : "Coffee"}
          </p>
          <h3 className={`mt-1.5 font-bold tracking-tight text-[#111111] ${compact ? "text-base" : "text-lg"}`}>
            {product.name}
          </h3>
          <p className={`mt-1.5 text-xs leading-5 text-[#666660] ${compact ? "line-clamp-2 min-h-[40px]" : "min-h-[40px]"}`}>
            {product.description || "Minuman pilihan GetHere untuk menemani setiap momen."}
          </p>

          <div className={compact ? "mt-3" : "mt-4"}>
            <p className="mb-2 text-[11px] font-bold text-[#4D4D48]">Pilih Kemasan</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePackagingChange("CUP")}
                disabled={product.cupPrice == null}
                aria-pressed={packaging === "CUP"}
                className={`relative min-w-0 rounded-xl border p-2.5 text-left transition ${
                  packaging === "CUP"
                    ? "border-[#171717] bg-[#F2F2EF]"
                    : "border-[#DCDCD8] bg-white hover:border-[#666660]"
                } ${product.cupPrice == null ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {packaging === "CUP" && product.cupPrice != null && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] text-[9px] font-bold text-white">✓</span>
                )}
                <span className="mb-1 block text-[#171717]">
                  <CupPackagingIcon className="h-5 w-5" />
                </span>
                <span className="mt-1 block text-xs font-bold text-[#111111]">Cup</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[#52524D]">
                  {packagingPriceLabel(product.cupPrice ?? product.price)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePackagingChange("BOTTLE")}
                disabled={product.bottlePrice == null}
                aria-pressed={packaging === "BOTTLE"}
                className={`relative min-w-0 rounded-xl border p-2.5 text-left transition ${
                  packaging === "BOTTLE"
                    ? "border-[#171717] bg-[#F2F2EF]"
                    : "border-[#DCDCD8] bg-white hover:border-[#666660]"
                } ${product.bottlePrice == null ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {packaging === "BOTTLE" && product.bottlePrice != null && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] text-[9px] font-bold text-white">✓</span>
                )}
                <span className="mb-1 block text-[#171717]">
                  <BottlePackagingIcon className="h-5 w-5" />
                </span>
                <span className="mt-1 block text-xs font-bold text-[#111111]">Bottle</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[#52524D]">
                  {packagingPriceLabel(product.bottlePrice)}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4">
            {product.discountPercent > 0 && selectedOriginalPrice !== null && (
              <span className="block text-xs text-[#9A8B7D] line-through">
                Rp{selectedOriginalPrice.toLocaleString("id-ID")}
              </span>
            )}
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className={`font-extrabold text-[#111111] ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
                {finalPrice !== null ? `Rp${finalPrice.toLocaleString("id-ID")}` : "N/A"}
              </span>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={finalPrice === null}
                className={`shrink-0 rounded-full bg-[#171717] font-semibold text-white transition hover:scale-[1.03] hover:bg-[#3A2D25] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                  compact ? "px-3 py-2 text-[11px]" : "px-4 py-2.5 text-xs sm:text-sm"
                }`}
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
  // RENDER
  // =======================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F7F5] text-[#111111]">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#E4E4E1] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="shrink-0"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            <div className="text-[24px] font-black tracking-[-0.06em] text-[#111111]">
              GetHere
            </div>

            <div className="-mt-1 text-[7px] font-semibold tracking-wide text-[#6C6259]">
              Together, We Got You.
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
            <a
              href="#"
              className="transition hover:text-[#52524D]"
            >
              Beranda
            </a>

            <a
              href="#produk"
              className="transition hover:text-[#52524D]"
            >
              Menu
            </a>

            <a
              href="#tentang"
              className="transition hover:text-[#52524D]"
            >
              Tentang
            </a>

            <a
              href="#kontak"
              className="transition hover:text-[#52524D]"
            >
              Kontak
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/tracking"
              className="hidden rounded-full border border-[#D8C9BA] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#171717] hover:text-[#171717] sm:block"
            >
              Lacak Pesanan
            </Link>

            <button
              ref={cartButtonRef}
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#171717] text-xl text-white shadow-lg transition hover:scale-105"
            >
              🛒

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#52524D] px-1 text-[10px] font-bold text-white">
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
          <div className="border-t border-[#E4E4E1] bg-white px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold">
              <a
                href="#"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Beranda
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
                Tentang
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
      <section className="px-5 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="mx-auto grid max-w-[1400px] items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="flex flex-col justify-center py-4 sm:py-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#52524D]">GetHere Coffee</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-[#111111] sm:text-6xl xl:text-7xl">
              Good Coffee.
              <br />
              Good <span className="font-semibold italic text-[#52524D]">Moment.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#575752] sm:text-base">
              Temukan minuman favoritmu, pilih kemasan yang kamu suka, lalu pesan dengan mudah bersama GetHere.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#produk" className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#3A2D25]">
                Lihat Menu <span aria-hidden="true">→</span>
              </a>
              <Link href="/tracking" className="inline-flex items-center rounded-full border border-[#C7C7C2] bg-white/80 px-7 py-3.5 text-sm font-bold text-[#111111] transition hover:border-[#171717] hover:bg-[#F0E9E0]">
                Lacak Pesanan
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium tracking-wide text-[#666660]">Satu kopi, dua cara menikmati — Cup atau Bottle.</p>
          </div>

          <div className="group relative min-h-[300px] overflow-hidden border border-[#DEDEDA] bg-[#E7E7E3] sm:min-h-[390px] lg:min-h-[440px]">
            {heroVisualProduct?.image ? (
              <img
                src={heroVisualProduct.image}
                alt={heroVisualProduct.name}
                className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <img
                src="/images/gethere-bottle-reference.jpeg"
                alt="Bottle Butterscotch Coffee GetHere"
                className="absolute inset-y-0 right-0 h-full w-auto max-w-[100%] object-contain object-right"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/65 via-white/10 to-black/10" />
            <div className="absolute bottom-5 left-5 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]">
              GetHere · Good Coffee, Good Moment
            </div>
            <div className="absolute right-5 top-5 max-w-[130px] border border-white/50 bg-black/80 px-4 py-3 text-right text-sm font-semibold italic leading-5 text-white sm:right-7 sm:top-7 sm:text-base">
              Same Coffee,<br />Different Mood.
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
    FEATURE STRIP
===================================================== */}
<section className="border-y border-[#E3E3E0] bg-white px-5 sm:px-8">
  <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-[#DCDCD8] md:grid-cols-4 md:divide-y-0">

    {/* COFFEE PILIHAN */}
    <div className="flex items-center gap-3 px-3 py-5 sm:gap-4 sm:px-6 sm:py-6">
      <CoffeeMugIcon className="h-7 w-7 shrink-0 text-[#171717] sm:h-8 sm:w-8" />

      <div>
        <h3 className="text-xs font-bold text-[#111111] sm:text-sm">
          Coffee Pilihan
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-[#666660] sm:text-xs">
          Dari biji pilihan berkualitas
        </p>
      </div>
    </div>

    {/* CUP & BOTTLE */}
    <div className="flex items-center gap-3 px-3 py-5 sm:gap-4 sm:px-6 sm:py-6">
      <BottlePackagingIcon className="h-7 w-7 shrink-0 text-[#171717] sm:h-8 sm:w-8" />

      <div>
        <h3 className="text-xs font-bold text-[#111111] sm:text-sm">
          Cup & Bottle
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-[#666660] sm:text-xs">
          Pilih kemasan sesukamu
        </p>
      </div>
    </div>

    {/* BANYAK VARIAN */}
    <div className="flex items-center gap-3 px-3 py-5 sm:gap-4 sm:px-6 sm:py-6">
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 shrink-0 text-[#171717] sm:h-8 sm:w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>

      <div>
        <h3 className="text-xs font-bold text-[#111111] sm:text-sm">
          Banyak Varian
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-[#666660] sm:text-xs">
          Coffee dan non coffee favorit
        </p>
      </div>
    </div>

    {/* PESAN MUDAH */}
    <div className="flex items-center gap-3 px-3 py-5 sm:gap-4 sm:px-6 sm:py-6">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0 text-[#171717] sm:h-8 sm:w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 7h16v16H3z" />
        <path d="M19 13h5l5 5v5H19z" />
        <circle cx="9" cy="25" r="3" />
        <circle cx="24" cy="25" r="3" />
      </svg>

      <div>
        <h3 className="text-xs font-bold text-[#111111] sm:text-sm">
          Pesan Mudah
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-[#666660] sm:text-xs">
          Pesan langsung dari rumah
        </p>
      </div>
    </div>

  </div>
</section>

      {/* =====================================================
          BEST SELLER / FEATURED PRODUCTS
      ===================================================== */}
      <section className="px-5 pb-5 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#52524D]">GetHere Picks</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111111] sm:text-5xl">Best Seller</h2>
              <p className="mt-2 text-sm text-[#666660] sm:text-base">Menu favorit untuk menemani setiap momen.</p>
            </div>
            <a href="#produk" className="hidden shrink-0 text-xs font-bold text-[#111111] underline underline-offset-4 sm:block">Lihat Semua →</a>
          </div>

          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-[330px] animate-pulse rounded-[22px] bg-[#E4E4E1]" />)}
            </div>
          ) : bestSellerProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellerProducts.map((product) => <ProductCard key={product.id} product={product} compact />)}
            </div>
          ) : (
            <div className="rounded-[22px] border border-[#E4E4E1] bg-white p-8 text-sm text-[#666660]">Produk yang tersedia dari dashboard admin akan muncul di sini.</div>
          )}
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
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#666660]">
              Menu GetHere
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                  Semua Menu
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#666660] sm:text-base">
                  Temukan minuman favoritmu
                  dari berbagai pilihan
                  coffee dan non coffee
                  GetHere.
                </p>
              </div>

              <div className="hidden rounded-full bg-[#EBEBE8] px-5 py-2.5 text-xs font-bold text-[#52524D] sm:block">
                {filteredProducts.length}{" "}
                menu tersedia
              </div>
            </div>
          </div>

          {/* =====================================================
              MENU FILTER
          ===================================================== */}
          <div className="mb-10 flex flex-wrap items-center gap-2">
            {/* SEMUA */}
            <button
              type="button"
              onClick={() => setMenuFilter("ALL")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter === "ALL"
                  ? "bg-[#171717] text-white shadow-lg"
                  : "border border-[#DCDCD8] bg-white text-[#171717] hover:border-[#171717]"
              }`}
            >
              Semua
            </button>

            {/* COFFEE */}
            <button
              type="button"
              onClick={() => setMenuFilter("COFFEE")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter === "COFFEE"
                  ? "bg-[#171717] text-white shadow-lg"
                  : "border border-[#DCDCD8] bg-white text-[#171717] hover:border-[#171717]"
              }`}
            >
              <CoffeeMugIcon className="h-4 w-4 shrink-0" />
              Coffee
            </button>

            {/* NON COFFEE */}
            <button
              type="button"
              onClick={() => setMenuFilter("NON_COFFEE")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition ${
                menuFilter === "NON_COFFEE"
                  ? "bg-[#171717] text-white shadow-lg"
                  : "border border-[#DCDCD8] bg-white text-[#171717] hover:border-[#171717]"
              }`}
            >
              <CupPackagingIcon className="h-4 w-4 shrink-0" />
              Non Coffee
            </button>
          </div>

          {/* =====================================================
              PRODUCT LIST STATES
          ===================================================== */}

          {productsLoading ? (
            /* LOADING */
            <div className="rounded-[24px] border border-[#E4E4E1] bg-white py-20 text-center">
              <CoffeeMugIcon className="mx-auto mb-4 h-12 w-12 animate-pulse text-[#777772]" />

              <p className="text-sm text-[#666660]">
                Memuat menu GetHere...
              </p>
            </div>
          ) : products.length === 0 ? (
            /* NO PRODUCTS */
            <div className="rounded-[24px] border border-[#E4E4E1] bg-white px-6 py-20 text-center">
              <CupPackagingIcon className="mx-auto mb-4 h-12 w-12 text-[#777772]" />

              <h3 className="font-bold text-[#111111]">
                Belum ada produk tersedia
              </h3>

              <p className="mt-2 text-sm text-[#666660]">
                Produk yang ditambahkan dari dashboard admin
                akan muncul di sini.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* EMPTY CATEGORY */
            <div className="rounded-[24px] border border-[#E4E4E1] bg-white px-6 py-20 text-center">
              <CoffeeMugIcon className="mx-auto mb-4 h-12 w-12 text-[#777772]" />

              <h3 className="font-bold text-[#111111]">
                Tidak ada produk
              </h3>

              <p className="mt-2 text-sm text-[#666660]">
                Belum ada produk dalam kategori ini.
              </p>
            </div>
          ) : (
            /* PRODUCT GRID */
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}
      <section id="tentang" className="mt-8 border-y border-[#E3E3E0] bg-[#F1F1EF] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#52524D]">Tentang GetHere</p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#111111] sm:text-5xl">
              Lebih dari<br />Sekadar <span className="font-semibold italic text-[#52524D]">Kopi.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#575752] sm:text-base">
              GetHere hadir untuk menemani langkahmu dengan pilihan rasa yang bisa dinikmati sesuai caramu.
            </p>
            <div className="mt-5 space-y-3 text-sm text-[#40403C]">
              <p className="flex items-start gap-3"><span className="mt-0.5 font-bold">01</span><span><strong>Cup</strong> — pilihan dengan es untuk sensasi yang lebih segar.</span></p>
              <p className="flex items-start gap-3"><span className="mt-0.5 font-bold">02</span><span><strong>Bottle</strong> — disajikan tanpa es batu, praktis untuk dinikmati.</span></p>
            </div>
            <a href="#produk" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3A2D25]">Pilih Menu <span aria-hidden="true">→</span></a>
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-[24px] bg-[#E1E1DD] sm:min-h-[390px]">
            {heroVisualProduct?.image ? (
              <img src={heroVisualProduct.image} alt={heroVisualProduct.name} className="absolute inset-0 h-full w-full object-cover object-center" />
            ) : (
              <img
                src="/images/gethere-bottle-reference.jpeg"
                alt="Bottle Butterscotch Coffee GetHere"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 pt-20 sm:p-7 sm:pt-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">GetHere Coffee</p>
              <p className="mt-1 text-2xl font-black text-white sm:text-3xl">Same Coffee. Different Mood.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        id="kontak"
        className="bg-[#111111] px-5 py-10 text-white sm:px-8"
      >
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-2xl font-black">
              GetHere
            </div>

            <p className="mt-1 text-xs text-[#858580]">
              Together, We Got You.
            </p>
          </div>

          <div className="text-xs text-[#666660]">
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#F7F7F5] shadow-2xl transition-transform duration-300 ${
          cartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#DCDCD8] p-5">
          <div>
            <h2 className="text-2xl font-black">
              Keranjang Kamu
            </h2>

            <p className="mt-1 text-xs text-[#666660]">
              {totalItems} item dalam
              keranjang
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCartOpen(false)
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl transition hover:bg-[#1D1D1B] hover:text-white"
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

              <p className="mt-2 text-sm text-[#666660]">
                Yuk pilih minuman
                favorit kamu.
              </p>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="mt-6 rounded-full bg-[#171717] px-7 py-3 text-sm font-bold text-white"
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
                          <span className="rounded-full bg-[#EFE5D9] px-2.5 py-1 text-[10px] font-bold uppercase text-[#52524D]">
                            {item.packaging ===
                            "BOTTLE"
                              ? "🧴 Bottle"
                              : "🥤 Cup"}
                          </span>

                          {item.discountPercent >
                            0 && (
                            <span className="rounded-full bg-[#E8F0D9] px-2.5 py-1 text-[10px] font-bold text-[#171717]">
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

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#E0E0DC]">
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

                      <p className="mt-1 text-sm font-bold text-[#666660]">
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
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] font-bold text-white"
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
          <div className="border-t border-[#DCDCD8] bg-[#F7F7F5] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#666660]">
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
              className="block w-full rounded-full bg-[#171717] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#334517]"
            >
              Lanjut Checkout
            </Link>
          </div>
        )}
      </aside>
    </main>
  );
}