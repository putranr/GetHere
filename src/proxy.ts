import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
   console.log("🔥 PROXY KEJALAN:", request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;

  console.log("=== PROXY RUN ===");
  console.log("PATH:", pathname);
  console.log(
    "SESSION:",
    request.cookies.get("admin_session")?.value
  );
  console.log(
    "SECRET EXISTS:",
    Boolean(process.env.ADMIN_SESSION_SECRET)
  );

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get("admin_session");
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (
    !session ||
    !adminSessionSecret ||
    session.value !== adminSessionSecret
  ) {
    console.log("=== PROXY: UNAUTHORIZED ===");

    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  console.log("=== PROXY: AUTHORIZED ===");

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};