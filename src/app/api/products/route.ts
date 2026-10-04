import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// CEK SESSION ADMIN
// ==========================================
function isAdmin(request: NextRequest) {
  const session = request.cookies.get("admin_session");
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!session || !adminSessionSecret) {
    return false;
  }

  return session.value === adminSessionSecret;
}

// ==========================================
// VALIDASI HARGA
// ==========================================
function parsePrice(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const price = Number(value);

  if (!Number.isInteger(price) || price < 0) {
    return null;
  }

  return price;
}

// ==========================================
// VALIDASI DISKON
// ==========================================
function parseDiscount(value: unknown) {
  const discount = Number(value ?? 0);

  if (
    !Number.isInteger(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    return null;
  }

  return discount;
}

// ==========================================
// VALIDASI CATEGORY
// ==========================================
function parseCategory(value: unknown) {
  if (value === "NON_COFFEE") {
    return "NON_COFFEE" as const;
  }

  return "COFFEE" as const;
}

// ==========================================
// GET SEMUA PRODUK
// PUBLIC
// ==========================================
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data produk.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// POST TAMBAH PRODUK
// HANYA ADMIN
// ==========================================
export async function POST(request: NextRequest) {
  // ========================================
  // CEK ADMIN
  // ========================================
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    // ======================================
    // AMBIL BODY
    // ======================================
    const body = await request.json();

    const {
      name,
      description,
      image,

      // CATEGORY
      category,

      // HARGA
      price,
      cupPrice,
      bottlePrice,

      // DISKON
      discountPercent,

      // STATUS
      isAvailable,
    } = body;

    // ======================================
    // VALIDASI NAMA
    // ======================================
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama produk wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================
    // VALIDASI HARGA
    // ======================================
    const parsedCupPrice = parsePrice(cupPrice);
    const parsedBottlePrice = parsePrice(bottlePrice);
    const parsedOldPrice = parsePrice(price);

    // Jika cupPrice tidak ada,
    // gunakan price lama
    const finalCupPrice =
      parsedCupPrice !== null
        ? parsedCupPrice
        : parsedOldPrice;

    // Jika bottlePrice tidak ada,
    // gunakan price lama
    const finalBottlePrice =
      parsedBottlePrice !== null
        ? parsedBottlePrice
        : parsedOldPrice;

    // ======================================
    // HARGA WAJIB VALID
    // ======================================
    if (
      finalCupPrice === null ||
      finalBottlePrice === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga Cup dan harga Bottle wajib diisi dengan angka yang valid.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================
    // VALIDASI DISKON
    // ======================================
    const discount = parseDiscount(discountPercent);

    if (discount === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Diskon harus berada di antara 0 sampai 100 persen.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================
    // CATEGORY
    // ======================================
    const finalCategory = parseCategory(category);

    // ======================================
    // CREATE PRODUCT
    // ======================================
    const product = await prisma.product.create({
      data: {
        // ====================================
        // INFORMASI PRODUK
        // ====================================
        name: name.trim(),

        description:
          typeof description === "string"
            ? description.trim() || null
            : null,

        // ====================================
        // GAMBAR UTAMA
        // ====================================
        image:
          typeof image === "string"
            ? image.trim() || null
            : null,

        // ====================================
        // GAMBAR CUP
        // ====================================
        cupImage:
          typeof cupImage === "string"
            ? cupImage.trim() || null
            : null,

        // ====================================
        // GAMBAR BOTTLE
        // ====================================
        bottleImage:
          typeof bottleImage === "string"
            ? bottleImage.trim() || null
            : null,

        // ====================================
        // CATEGORY
        // ====================================
        category: finalCategory,

        // ====================================
        // HARGA
        // ====================================

        // Field lama untuk kompatibilitas
        price: finalCupPrice,

        cupPrice: finalCupPrice,

        bottlePrice: finalBottlePrice,

        // ====================================
        // DISKON
        // ====================================
        discountPercent: discount,

        // ====================================
        // KETERSEDIAAN
        // ====================================
        isAvailable:
          typeof isAvailable === "boolean"
            ? isAvailable
            : true,
      },
    });

    // ======================================
    // RESPONSE
    // ======================================
    return NextResponse.json(
      {
        success: true,
        message: "Produk berhasil ditambahkan.",
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan produk.",
      },
      {
        status: 500,
      }
    );
  }
}