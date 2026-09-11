import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    console.log("MIDTRANS NOTIFICATION:", body);

    // =========================
    // VALIDASI SIGNATURE MIDTRANS
    // =========================

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(
        `${order_id}${status_code}${gross_amount}${serverKey}`
      )
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("INVALID MIDTRANS SIGNATURE");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid signature.",
        },
        { status: 403 }
      );
    }

    // =========================
    // AMBIL ID ORDER
    // =========================

    const orderId = Number(
      String(order_id).replace("GETHERE-", "")
    );

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
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

    // Simpan status sebelumnya
    const previousPaymentStatus = order.paymentStatus;

    // =========================
    // TENTUKAN PAYMENT STATUS
    // =========================

    let paymentStatus = order.paymentStatus;

    if (
      transaction_status === "settlement" ||
      (
        transaction_status === "capture" &&
        fraud_status === "accept"
      )
    ) {
      paymentStatus = "PAID";
    } else if (transaction_status === "pending") {
      paymentStatus = "UNPAID";
    } else if (transaction_status === "expire") {
      paymentStatus = "EXPIRED";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny"
    ) {
      paymentStatus = "FAILED";
    }

    // =========================
    // UPDATE DATABASE
    // =========================

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus,
      },
    });

    console.log(
      `ORDER #${orderId} PAYMENT STATUS: ${paymentStatus}`
    );

    // =========================
    // TELEGRAM - PEMBAYARAN BERHASIL
    // =========================

    // Hanya kirim notif kalau status BARU berubah menjadi PAID
    if (
      paymentStatus === "PAID" &&
      previousPaymentStatus !== "PAID"
    ) {
      const itemsText = order.items
        .map(
          (item) =>
            `• ${item.name} x${item.quantity} = Rp${(
              item.price * item.quantity
            ).toLocaleString("id-ID")}`
        )
        .join("\n");

      const telegramMessage = `
💰 <b>PEMBAYARAN BERHASIL — GET-HERE</b>

🧾 <b>Order #${order.id}</b>

👤 <b>Customer:</b> ${order.customerName}
📱 <b>WhatsApp:</b> ${order.whatsapp}

📦 <b>Pesanan:</b>
${itemsText}

💰 <b>Total:</b> Rp${order.totalPrice.toLocaleString("id-ID")}

💳 <b>Pembayaran:</b> PAID
✅ <b>Status:</b> Pembayaran berhasil diterima!

⏰ ${new Date().toLocaleString("id-ID")}
`;

      await sendTelegramMessage(telegramMessage);

      console.log(
        `TELEGRAM PAYMENT NOTIFICATION SENT FOR ORDER #${orderId}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification berhasil diproses.",
    });
  } catch (error) {
    console.error("MIDTRANS NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memproses notification.",
      },
      { status: 500 }
    );
  }
}