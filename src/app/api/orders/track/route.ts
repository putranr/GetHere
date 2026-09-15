import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const orderId = searchParams.get("orderId");
    const whatsapp = searchParams.get("whatsapp");

    if (!orderId || !whatsapp) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor order dan WhatsApp wajib diisi.",
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
          message: "Pesanan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (order.whatsapp !== whatsapp) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor order atau WhatsApp tidak sesuai.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("TRACK ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mencari pesanan.",
      },
      { status: 500 }
    );
  }
}