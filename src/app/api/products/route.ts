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
      { status: 500 }
    );
  }
}

// ==========================================
// POST TAMBAH PRODUK
// HANYA ADMIN
// ==========================================
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      name,
      description,
      image,
      price,
      discountPercent,
      isAvailable,
    } = body;

    // =========================
    // VALIDASI
    // =========================
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Nama produk wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (
      price === undefined ||
      !Number.isInteger(Number(price)) ||
      Number(price) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga produk tidak valid.",
        },
        { status: 400 }
      );
    }

    const discount = Number(discountPercent ?? 0);

    if (
      !Number.isInteger(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Diskon harus berada di antara 0 sampai 100 persen.",
        },
        { status: 400 }
      );
    }

    // =========================
    // BUAT PRODUK
    // =========================
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
        image:
          typeof image === "string"
            ? image.trim() || null
            : null,
        price: Number(price),
        discountPercent: discount,
        isAvailable:
          typeof isAvailable === "boolean"
            ? isAvailable
            : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Produk berhasil ditambahkan.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan produk.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH EDIT PRODUK
// HANYA ADMIN
// ==========================================
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      id,
      name,
      description,
      image,
      price,
      discountPercent,
      isAvailable,
    } = body;

    // =========================
    // VALIDASI ID
    // =========================
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ID produk tidak valid.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CEK PRODUK
    // =========================
    const existingProduct = await prisma.product.findUnique({
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
        { status: 404 }
      );
    }

    // =========================
    // DATA YANG AKAN DIUPDATE
    // =========================
    const updateData: {
      name?: string;
      description?: string | null;
      image?: string | null;
      price?: number;
      discountPercent?: number;
      isAvailable?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Nama produk tidak valid.",
          },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description =
        typeof description === "string"
          ? description.trim() || null
          : null;
    }

    if (image !== undefined) {
      updateData.image =
        typeof image === "string"
          ? image.trim() || null
          : null;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (
        !Number.isInteger(parsedPrice) ||
        parsedPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Harga produk tidak valid.",
          },
          { status: 400 }
        );
      }

      updateData.price = parsedPrice;
    }

    if (discountPercent !== undefined) {
      const discount = Number(discountPercent);

      if (
        !Number.isInteger(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Diskon harus berada di antara 0 sampai 100 persen.",
          },
          { status: 400 }
        );
      }

      updateData.discountPercent = discount;
    }

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "Status ketersediaan tidak valid.",
          },
          { status: 400 }
        );
      }

      updateData.isAvailable = isAvailable;
    }

    // =========================
    // UPDATE PRODUK
    // =========================
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui.",
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui produk.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE PRODUK
// HANYA ADMIN
// ==========================================
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ID produk tidak valid.",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
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
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus produk.",
      },
      { status: 500 }
    );
  }
}