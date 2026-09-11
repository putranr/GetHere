import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

// GET semua order
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
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

// POST membuat order baru
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

    if (
      !customerName ||
      !whatsapp ||
      !address ||
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

    // Hitung total dari item yang dikirim
    const totalPrice = items.reduce(
      (
        total: number,
        item: {
          price: number;
          quantity: number;
        }
      ) => {
        return total + item.price * item.quantity;
      },
      0
    );

    const order = await prisma.order.create({
      data: {
        customerName,
        whatsapp,
        address,
        note: note || null,
        totalPrice,
        paymentStatus: "UNPAID",

        items: {
          create: items.map(
            (item: {
              productId: number;
              name: string;
              price: number;
              quantity: number;
            }) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })
          ),
        },
      },

      include: {
        items: true,
      },
    });

     // Kirim notifikasi Telegram
    const itemsText = order.items
      .map(
        (item) =>
          `• ${item.name} x${item.quantity} = Rp${(
            item.price * item.quantity
          ).toLocaleString("id-ID")}`
      )
      .join("\n");

    const telegramMessage = `
🔔 <b>PESANAN BARU — GET-HERE</b>

🧾 <b>Order #${order.id}</b>

👤 <b>Customer:</b> ${order.customerName}
📱 <b>WhatsApp:</b> ${order.whatsapp}

📦 <b>Pesanan:</b>
${itemsText}

💰 <b>Total:</b> Rp${order.totalPrice.toLocaleString("id-ID")}

📍 <b>Alamat:</b>
${order.address}

${order.note ? `📝 <b>Catatan:</b> ${order.note}` : ""}

💳 <b>Pembayaran:</b> ${order.paymentStatus}

⏰ ${new Date(order.createdAt).toLocaleString("id-ID")}
`;

    await sendTelegramMessage(telegramMessage);

    return NextResponse.json(
      {
        success: true,
        message: "Order berhasil dibuat.",
        order,
      },
      { status: 201 }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Order berhasil dibuat.",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat order.",
      },
      { status: 500 }
    );
  }
}

// PATCH mengubah status order
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "ID order dan status wajib diisi.",
        },
        { status: 400 }
      );
    }

    const allowedStatus = [
      "PENDING",
      "PROCESSING",
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

    const order = await prisma.order.update({
      where: {
        id: Number(id),
      },

      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status order berhasil diperbarui.",
      order,
    });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui status order.",
      },
      { status: 500 }
    );
  }
}