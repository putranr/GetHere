import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { prisma } from "@/lib/prisma";

console.log("MIDTRANS CONFIG:", {
  serverKeyExists: Boolean(process.env.MIDTRANS_SERVER_KEY),
  serverKeyPrefix: process.env.MIDTRANS_SERVER_KEY?.slice(0, 12),
  serverKeyLength: process.env.MIDTRANS_SERVER_KEY?.length,

  clientKeyExists: Boolean(
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
  ),
  clientKeyPrefix:
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.slice(0, 12),
});

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID wajib diisi.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: Number(orderId),
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

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ini sudah dibayar.",
        },
        { status: 400 }
      );
    }

    const parameter = {
      transaction_details: {
        order_id: `GETHERE-${order.id}`,
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