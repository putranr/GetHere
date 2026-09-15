import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { prisma } from "@/lib/prisma";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

console.log("MIDTRANS CONFIG:", {
  serverKeyExists: Boolean(serverKey),
  clientKeyExists: Boolean(clientKey),
});

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: serverKey!,
  clientKey: clientKey!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    // Validasi Order ID
    const parsedOrderId = Number(orderId);

    if (
      !Number.isInteger(parsedOrderId) ||
      parsedOrderId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID tidak valid.",
        },
        { status: 400 }
      );
    }

    // Ambil order langsung dari database
    const order = await prisma.order.findUnique({
      where: {
        id: parsedOrderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // Jangan buat transaksi baru untuk order yang sudah dibayar
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ini sudah dibayar.",
        },
        { status: 400 }
      );
    }

    // Pastikan order memiliki item
    if (order.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Order tidak memiliki produk.",
        },
        { status: 400 }
      );
    }

    // Semua data pembayaran berasal dari DATABASE
    const parameter = {
      transaction_details: {
        order_id: `GETHERE-${order.id}-${crypto.randomUUID()}`,
        gross_amount: order.totalPrice,
      },

      customer_details: {
        first_name: order.customerName,
        phone: order.whatsapp,
      },

      item_details: order.items.map((item) => ({
        id: String(item.productId),
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error("MIDTRANS PAYMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat transaksi pembayaran.",
      },
      { status: 500 }
    );
  }
}