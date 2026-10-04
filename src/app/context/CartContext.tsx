"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// =========================================================
// PACKAGING
// =========================================================

export type Packaging = "CUP" | "BOTTLE";

// =========================================================
// CATEGORY
// =========================================================

export type ProductCategory =
  | "COFFEE"
  | "NON_COFFEE";

// =========================================================
// PRODUCT
// =========================================================

export type Product = {
  id: number;

  name: string;

  description?: string | null;

  // =======================================================
  // HARGA
  // =======================================================

  price: number;

  cupPrice?: number | null;

  bottlePrice?: number | null;

  // =======================================================
  // FOTO
  // =======================================================

  // Foto utama produk
  image?: string | null;

  // =======================================================
  // DISKON
  // =======================================================

  discountPercent: number;

  // =======================================================
  // STATUS
  // =======================================================

  isAvailable: boolean;

  // =======================================================
  // CATEGORY
  // =======================================================

  category: ProductCategory;
};

// =========================================================
// CART PRODUCT
// =========================================================

export type CartProduct = {
  id: number;

  name: string;

  // =======================================================
  // HARGA DASAR
  // =======================================================

  price: number;

  // =======================================================
  // HARGA PACKAGING
  // =======================================================

  cupPrice?: number | null;

  bottlePrice?: number | null;

  // =======================================================
  // FOTO
  // =======================================================

  image?: string | null;

  // =======================================================
  // HARGA CART
  // =======================================================

  originalPrice: number;

  discountPercent: number;

  finalPrice: number;

  // =======================================================
  // QUANTITY
  // =======================================================

  quantity: number;

  // =======================================================
  // PACKAGING
  // =======================================================

  packaging: Packaging;
};

// =========================================================
// ADD TO CART PRODUCT
// =========================================================

export type AddToCartProduct = {
  id: number;

  name: string;

  // =======================================================
  // HARGA
  // =======================================================

  price: number;

  cupPrice?: number | null;

  bottlePrice?: number | null;

  // =======================================================
  // FOTO
  // =======================================================

  image?: string | null;

  // =======================================================
  // DISKON
  // =======================================================

  discountPercent?: number;

  // =======================================================
  // CATEGORY
  // =======================================================

  category: ProductCategory;

  // =======================================================
  // PACKAGING
  // =======================================================

  packaging: Packaging;
};

// =========================================================
// CART CONTEXT TYPE
// =========================================================

type CartContextType = {
  cart: CartProduct[];

  addToCart: (
    product: AddToCartProduct
  ) => void;

  increaseQuantity: (
    id: number,
    packaging?: Packaging
  ) => void;

  decreaseQuantity: (
    id: number,
    packaging?: Packaging
  ) => void;

  removeFromCart: (
    id: number,
    packaging?: Packaging
  ) => void;

  clearCart: () => void;

  totalItems: number;

  totalPrice: number;
};

// =========================================================
// CONTEXT
// =========================================================

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

// =========================================================
// HITUNG HARGA FINAL
// =========================================================

function calculateFinalPrice(
  originalPrice: number,
  discountPercent: number
): number {
  return Math.max(
    Math.round(
      (originalPrice *
        (100 - discountPercent)) /
        100
    ),
    0
  );
}

// =========================================================
// AMBIL HARGA BERDASARKAN PACKAGING
// =========================================================

function getPackagingPrice(
  product: {
    price: number;
    cupPrice?: number | null;
    bottlePrice?: number | null;
  },
  packaging: Packaging
): number | null {
  // =======================================================
  // CUP
  // =======================================================

  if (packaging === "CUP") {
    return (
      product.cupPrice ??
      product.price
    );
  }

  // =======================================================
  // BOTTLE
  // =======================================================

  return (
    product.bottlePrice ??
    null
  );
}

// =========================================================
// CART PROVIDER
// =========================================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<
    CartProduct[]
  >([]);

  // =======================================================
  // SINKRONISASI CART DENGAN DATABASE
  // =======================================================

  useEffect(() => {
    const syncCartWithProducts =
      async () => {
        try {
          // -------------------------------------------------
          // CART KOSONG
          // -------------------------------------------------

          if (cart.length === 0) {
            return;
          }

          // -------------------------------------------------
          // AMBIL DATA TERBARU
          // -------------------------------------------------

          const response = await fetch(
            "/api/products",
            {
              method: "GET",
              cache: "no-store",
            }
          );

          if (!response.ok) {
            console.error(
              "Gagal mengambil produk terbaru."
            );

            return;
          }

          const data =
            await response.json();

          // -------------------------------------------------
          // VALIDASI RESPONSE
          // -------------------------------------------------

          if (
            !data.success ||
            !Array.isArray(
              data.products
            )
          ) {
            console.error(
              "Format response produk tidak valid."
            );

            return;
          }

          // -------------------------------------------------
          // UPDATE CART
          // -------------------------------------------------

          setCart((currentCart) => {
            const updatedCart: CartProduct[] =
              [];

            currentCart.forEach(
              (cartItem) => {
                // ==========================================
                // CARI PRODUK TERBARU
                // ==========================================

                const latestProduct =
                  data.products.find(
                    (product: {
                      id: number;
                      name: string;
                      price: number;

                      cupPrice?:
                        | number
                        | null;

                      bottlePrice?:
                        | number
                        | null;

                      image?:
                        | string
                        | null;

                      discountPercent?:
                        | number;

                      isAvailable: boolean;
                    }) =>
                      product.id ===
                      cartItem.id
                  );

                // ==========================================
                // PRODUK SUDAH DIHAPUS
                // ==========================================

                if (!latestProduct) {
                  return;
                }

                // ==========================================
                // PRODUK TIDAK TERSEDIA
                // ==========================================

                if (
                  !latestProduct.isAvailable
                ) {
                  return;
                }

                // ==========================================
                // AMBIL HARGA PACKAGING
                // ==========================================

                const originalPrice =
                  getPackagingPrice(
                    latestProduct,
                    cartItem.packaging
                  );

                // ==========================================
                // BOTTLE TIDAK PUNYA HARGA
                // ==========================================

                if (
                  originalPrice === null
                ) {
                  return;
                }

                // ==========================================
                // DISKON
                // ==========================================

                const discountPercent =
                  latestProduct.discountPercent ??
                  0;

                // ==========================================
                // HARGA FINAL
                // ==========================================

                const finalPrice =
                  calculateFinalPrice(
                    originalPrice,
                    discountPercent
                  );

                // ==========================================
                // MASUKKAN KE CART
                // ==========================================

                updatedCart.push({
                  ...cartItem,

                  name:
                    latestProduct.name,

                  price:
                    latestProduct.price,

                  cupPrice:
                    latestProduct.cupPrice,

                  bottlePrice:
                    latestProduct.bottlePrice,

                  // ========================================
                  // FOTO
                  // ========================================

                  image:
                    latestProduct.image,

                  // ========================================
                  // HARGA
                  // ========================================

                  originalPrice,

                  discountPercent,

                  finalPrice,
                });
              }
            );

            return updatedCart;
          });
        } catch (error) {
          console.error(
            "CART SYNC ERROR:",
            error
          );
        }
      };

    // =====================================================
    // JALANKAN
    // =====================================================

    syncCartWithProducts();

    // =====================================================
    // KETIKA TAB KEMBALI AKTIF
    // =====================================================

    const handleFocus = () => {
      syncCartWithProducts();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [cart.length]);

  // =======================================================
  // CLEAR CART
  // =======================================================

  const clearCart = () => {
    setCart([]);
  };

  // =======================================================
  // ADD TO CART
  // =======================================================

  const addToCart = (
    product: AddToCartProduct
  ) => {
    setCart((currentCart) => {
      // ===================================================
      // CARI PRODUK YANG SAMA
      // ===================================================

      const existingProduct =
        currentCart.find(
          (item) =>
            item.id === product.id &&
            item.packaging ===
              product.packaging
        );

      // ===================================================
      // KALAU SUDAH ADA
      // ===================================================

      if (existingProduct) {
        return currentCart.map(
          (item) => {
            if (
              item.id === product.id &&
              item.packaging ===
                product.packaging
            ) {
              return {
                ...item,

                quantity:
                  item.quantity + 1,
              };
            }

            return item;
          }
        );
      }

      // ===================================================
      // HARGA PACKAGING
      // ===================================================

      const originalPrice =
        getPackagingPrice(
          product,
          product.packaging
        );

      // ===================================================
      // BOTTLE TIDAK PUNYA HARGA
      // ===================================================

      if (originalPrice === null) {
        console.error(
          "Harga Bottle belum tersedia."
        );

        return currentCart;
      }

      // ===================================================
      // DISKON
      // ===================================================

      const discountPercent =
        product.discountPercent ?? 0;

      // ===================================================
      // HARGA FINAL
      // ===================================================

      const finalPrice =
        calculateFinalPrice(
          originalPrice,
          discountPercent
        );

      // ===================================================
      // ITEM BARU
      // ===================================================

      const newCartItem: CartProduct = {
        id: product.id,

        name: product.name,

        price: finalPrice,

        cupPrice:
          product.cupPrice,

        bottlePrice:
          product.bottlePrice,

        // =================================================
        // FOTO
        // =================================================

        image:
          product.image,

        // =================================================
        // HARGA
        // =================================================

        originalPrice,

        discountPercent,

        finalPrice,

        // =================================================
        // QUANTITY
        // =================================================

        quantity: 1,

        // =================================================
        // PACKAGING
        // =================================================

        packaging:
          product.packaging,
      };

      return [
        ...currentCart,
        newCartItem,
      ];
    });
  };

  // =======================================================
  // INCREASE QUANTITY
  // =======================================================

  const increaseQuantity = (
    id: number,
    packaging?: Packaging
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        const sameProduct =
          item.id === id;

        const samePackaging =
          !packaging ||
          item.packaging ===
            packaging;

        if (
          sameProduct &&
          samePackaging
        ) {
          return {
            ...item,

            quantity:
              item.quantity + 1,
          };
        }

        return item;
      })
    );
  };

  // =======================================================
  // DECREASE QUANTITY
  // =======================================================

  const decreaseQuantity = (
    id: number,
    packaging?: Packaging
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          const sameProduct =
            item.id === id;

          const samePackaging =
            !packaging ||
            item.packaging ===
              packaging;

          if (
            sameProduct &&
            samePackaging
          ) {
            return {
              ...item,

              quantity:
                item.quantity - 1,
            };
          }

          return item;
        })
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  // =======================================================
  // REMOVE FROM CART
  // =======================================================

  const removeFromCart = (
    id: number,
    packaging?: Packaging
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => {
          const sameProduct =
            item.id === id;

          const samePackaging =
            !packaging ||
            item.packaging ===
              packaging;

          return !(
            sameProduct &&
            samePackaging
          );
        }
      )
    );
  };

  // =======================================================
  // TOTAL ITEMS
  // =======================================================

  const totalItems =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  // =======================================================
  // TOTAL PRICE
  // =======================================================

  const totalPrice =
    cart.reduce(
      (total, item) =>
        total +
        item.finalPrice *
          item.quantity,
      0
    );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,

        increaseQuantity,

        decreaseQuantity,

        removeFromCart,

        clearCart,

        totalItems,

        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// =========================================================
// USE CART
// =========================================================

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart harus digunakan di dalam CartProvider"
    );
  }

  return context;
}