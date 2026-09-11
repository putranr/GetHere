import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  await sendTelegramMessage(
    "🔔 <b>GET-HERE TEST</b>\n\nTelegram notification berhasil terhubung! 🚀"
  );

  return NextResponse.json({
    success: true,
    message: "Test Telegram berhasil dikirim.",
  });
}