import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// CEK SESSION ADMIN
// ==========================================
function isAdmin(request: NextRequest) {
  const session = request.cookies.get("admin_session");
  const adminSessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (!session || !adminSessionSecret) {
    return false;
  }

  return session.value === adminSessionSecret;
}

// ==========================================
// VALIDASI HARGA
// ==========================================
function parsePrice(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const price = Number(value);

  if (
    !Number.isInteger(price) ||
    price < 0
  ) {
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
// PATCH EDIT PRODUK
// HANYA ADMIN
// ==========================================
export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
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
    // AMBIL ID
    // ======================================
    const { id } = await context.params;

    const productId = Number(id);

    // ======================================
    // VALIDASI ID
    // ======================================
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID produk tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

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
    // CEK PRODUK
    // ======================================
    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    // ======================================
    // OBJECT UPDATE
    // ======================================
    const updateData: {
      name?: string;
      description?: string | null;

      image?: string | null;

      category?: "COFFEE" | "NON_COFFEE";

      price?: number;
      cupPrice?: number;
      bottlePrice?: number;

      discountPercent?: number;

      isAvailable?: boolean;
    } = {};

    // ======================================
    // NAMA
    // ======================================
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Nama produk tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.name = name.trim();
    }

    // ======================================
    // DESKRIPSI
    // ======================================
    if (description !== undefined) {
      updateData.description =
        typeof description === "string"
          ? description.trim() || null
          : null;
    }

    // ======================================
    // GAMBAR UTAMA
    // ======================================
    if (image !== undefined) {
      updateData.image =
        typeof image === "string"
          ? image.trim() || null
          : null;
    }

    // ======================================
    // GAMBAR CUP
    // ======================================
    if (cupImage !== undefined) {
      updateData.cupImage =
        typeof cupImage === "string"
          ? cupImage.trim() || null
          : null;
    }

    // ======================================
    // GAMBAR BOTTLE
    // ======================================
    if (bottleImage !== undefined) {
      updateData.bottleImage =
        typeof bottleImage === "string"
          ? bottleImage.trim() || null
          : null;
    }

    // ======================================
    // CATEGORY
    // ======================================
    if (category !== undefined) {
      if (
        category !== "COFFEE" &&
        category !== "NON_COFFEE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kategori produk tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.category =
        parseCategory(category);
    }

    // ======================================
    // HARGA CUP
    // ======================================
    if (cupPrice !== undefined) {
      const parsedCupPrice =
        parsePrice(cupPrice);

      if (parsedCupPrice === null) {
        return NextResponse.json(
          {
            success: false,
            message: "Harga Cup tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.cupPrice =
        parsedCupPrice;

      // Sinkronkan field price lama
      updateData.price =
        parsedCupPrice;
    }

    // ======================================
    // HARGA BOTTLE
    // ======================================
    if (bottlePrice !== undefined) {
      const parsedBottlePrice =
        parsePrice(bottlePrice);

      if (parsedBottlePrice === null) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Harga Bottle tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.bottlePrice =
        parsedBottlePrice;
    }

    // ======================================
    // PRICE LAMA
    // ======================================
    if (
      price !== undefined &&
      cupPrice === undefined
    ) {
      const parsedPrice =
        parsePrice(price);

      if (parsedPrice === null) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Harga produk tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.price =
        parsedPrice;

      updateData.cupPrice =
        parsedPrice;
    }

    // ======================================
    // DISKON
    // ======================================
    if (
      discountPercent !== undefined
    ) {
      const discount =
        parseDiscount(
          discountPercent
        );

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

      updateData.discountPercent =
        discount;
    }

    // ======================================
    // KETERSEDIAAN
    // ======================================
    if (isAvailable !== undefined) {
      if (
        typeof isAvailable !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Status ketersediaan tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.isAvailable =
        isAvailable;
    }

    // ======================================
    // CEK ADA DATA YANG DIUPDATE
    // ======================================
    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ada data yang diperbarui.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================
    // UPDATE DATABASE
    // ======================================
    const product =
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: updateData,
      });

    // ======================================
    // RESPONSE
    // ======================================
    return NextResponse.json({
      success: true,
      message:
        "Produk berhasil diperbarui.",
      product,
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui produk.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// DELETE PRODUK
// HANYA ADMIN
// ==========================================
export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
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
    // AMBIL ID
    // ======================================
    const { id } = await context.params;

    const productId = Number(id);

    // ======================================
    // VALIDASI ID
    // ======================================
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID produk tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================
    // CEK PRODUK
    // ======================================
    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    // ======================================
    // RESPONSE
    // ======================================
    return NextResponse.json({
      success: true,
      message:
        "Produk berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menghapus produk.",
      },
      {
        status: 500,
      }
    );
  }
}