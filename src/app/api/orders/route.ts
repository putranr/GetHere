import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

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
// GET SEMUA ORDER
// HANYA UNTUK ADMIN
// ==========================================
export async function GET(request: NextRequest) {
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
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // ==========================================
    // AMBIL SEMUA PRODUCT ID
    // ==========================================
    const productIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.items.map((item) => item.productId)
        )
      ),
    ];

    // ==========================================
    // AMBIL GAMBAR PRODUK
    // ==========================================
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: {
              id: {
                in: productIds,
              },
            },
            select: {
              id: true,
              image: true,
            },
          })
        : [];

    // ==========================================
    // MAP PRODUCT ID -> IMAGE
    // ==========================================
    const productImageMap = new Map(
      products.map((product) => [
        product.id,
        product.image,
      ])
    );

    // ==========================================
    // GABUNGKAN IMAGE KE ORDER ITEM
    // ==========================================
    const ordersWithImages = orders.map((order) => ({
      ...order,

      items: order.items.map((item) => ({
        ...item,

        image:
          productImageMap.get(item.productId) ?? null,
      })),
    }));

    return NextResponse.json({
      success: true,
      orders: ordersWithImages,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data order.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST MEMBUAT ORDER BARU
// PUBLIC / CUSTOMER
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      whatsapp,
      address,
      note,
      items,
    } = body;

    // ==========================================
    // VALIDASI DATA UTAMA
    // ==========================================
    if (
      !customerName ||
      typeof customerName !== "string" ||
      !whatsapp ||
      typeof whatsapp !== "string" ||
      !address ||
      typeof address !== "string" ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Data order tidak lengkap.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDASI ITEM
    // ==========================================
    const validatedItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      // ==========================================
      // VALIDASI PRODUCT ID
      // ==========================================
      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Product ID tidak valid.",
          },
          { status: 400 }
        );
      }

      // ==========================================
      // VALIDASI QUANTITY
      // ==========================================
      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Jumlah produk tidak valid.",
          },
          { status: 400 }
        );
      }

      // ==========================================
      // VALIDASI PACKAGING
      // ==========================================
      const packaging =
        typeof item.packaging === "string"
          ? item.packaging.toUpperCase()
          : "";

      if (
        packaging !== "CUP" &&
        packaging !== "BOTTLE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kemasan harus berupa CUP atau BOTTLE.",
          },
          { status: 400 }
        );
      }

      // ==========================================
      // CARI PRODUK
      // ==========================================
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "Produk tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      // ==========================================
      // CEK KETERSEDIAAN
      // ==========================================
      if (!product.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            message: `Produk ${product.name} sedang tidak tersedia.`,
          },
          { status: 400 }
        );
      }

      // ==========================================
      // TENTUKAN HARGA BERDASARKAN KEMASAN
      // ==========================================
      let originalPrice: number;

      if (packaging === "CUP") {
        originalPrice =
          product.cupPrice ?? product.price;
      } else {
        if (product.bottlePrice === null) {
          return NextResponse.json(
            {
              success: false,
              message: `Produk ${product.name} belum memiliki harga Bottle.`,
            },
            { status: 400 }
          );
        }

        originalPrice = product.bottlePrice;
      }

      // ==========================================
      // HITUNG DISKON
      // ==========================================
      const discountPercent =
        product.discountPercent ?? 0;

      const finalPrice = Math.round(
        (originalPrice *
          (100 - discountPercent)) /
          100
      );

      // ==========================================
      // SIMPAN ITEM YANG SUDAH DIVALIDASI
      // ==========================================
      validatedItems.push({
        productId: product.id,

        name: product.name,

        packaging,

        // Harga normal sesuai kemasan
        originalPrice,

        // Diskon dari database
        discountPercent,

        // Harga setelah diskon
        price: finalPrice,

        quantity,
      });
    }

    // ==========================================
    // HITUNG TOTAL ORDER
    // ==========================================
    const totalPrice = validatedItems.reduce(
      (total, item) => {
        return (
          total +
          item.price * item.quantity
        );
      },
      0
    );

    // ==========================================
    // BUAT ORDER
    // ==========================================
    const order = await prisma.order.create({
      data: {
        customerName: customerName.trim(),

        whatsapp: whatsapp.trim(),

        address: address.trim(),

        note:
          typeof note === "string"
            ? note.trim() || null
            : null,

        totalPrice,

        status: "PENDING",

        paymentStatus: "UNPAID",

        items: {
          create: validatedItems,
        },
      },

      include: {
        items: true,
      },
    });

    // ==========================================
    // TELEGRAM NOTIFICATION
    // ==========================================
    const itemsText = order.items
      .map((item) => {
        const packagingLabel =
          item.packaging === "BOTTLE"
            ? "Bottle"
            : "Cup";

        const normalPrice =
          item.originalPrice.toLocaleString(
            "id-ID"
          );

        const finalPrice =
          item.price.toLocaleString("id-ID");

        const subtotal =
          (
            item.price * item.quantity
          ).toLocaleString("id-ID");

        const discountText =
          item.discountPercent > 0
            ? `\n  🏷️ Diskon: ${item.discountPercent}%`
            : "";

        return `• ${item.name}
  📦 Kemasan: ${packagingLabel}
  🔢 Jumlah: ${item.quantity}
  💵 Harga normal: Rp${normalPrice}
  💰 Harga setelah diskon: Rp${finalPrice}${discountText}
  🧾 Subtotal: Rp${subtotal}`;
      })
      .join("\n\n");

    const telegramMessage = `
🔔 <b>PESANAN BARU — GET-HERE</b>

🧾 <b>Order #${order.id}</b>

👤 <b>Customer:</b> ${order.customerName}
📱 <b>WhatsApp:</b> ${order.whatsapp}

📦 <b>PESANAN:</b>

${itemsText}

💰 <b>TOTAL:</b> Rp${order.totalPrice.toLocaleString(
      "id-ID"
    )}

📍 <b>ALAMAT:</b>
${order.address}

${
  order.note
    ? `📝 <b>CATATAN:</b>\n${order.note}`
    : ""
}

💳 <b>PEMBAYARAN:</b> ${
      order.paymentStatus
    }

📌 <b>STATUS:</b> ${order.status}

⏰ ${new Date(
      order.createdAt
    ).toLocaleString("id-ID")}
`;

    try {
      await sendTelegramMessage(
        telegramMessage
      );
    } catch (telegramError) {
      // Telegram gagal bukan berarti order gagal
      console.error(
        "TELEGRAM ERROR:",
        telegramError
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    return NextResponse.json(
      {
        success: true,
        message: "Order berhasil dibuat.",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat order.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH MENGUBAH STATUS ORDER
// HANYA UNTUK ADMIN
// ==========================================
export async function PATCH(
  request: NextRequest
) {
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

    const { id, status } = body;

    // ==========================================
    // VALIDASI ID & STATUS
    // ==========================================
    const orderId = Number(id);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !status
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID order dan status wajib diisi.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // STATUS YANG DIPERBOLEHKAN
    // ==========================================
    const allowedStatus = [
      "PENDING",
      "PROCESSING",
      "SHIPPING",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatus.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status order tidak valid.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CEK ORDER
    // ==========================================
    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Order tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================
    const order =
      await prisma.order.update({
        where: {
          id: orderId,
        },

        data: {
          status,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Status order berhasil diperbarui.",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui status order.",
      },
      { status: 500 }
    );
  }
}