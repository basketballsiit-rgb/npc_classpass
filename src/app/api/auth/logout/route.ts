import { NextRequest, NextResponse } from "next/server";
import { clearSession, KEYCLOAK_CONFIG } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await clearSession();

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/npc_classpass" : "");
  
  const postLogoutRedirectUri = `${proto}://${host}${basePath}/`;

  // สามารถ redirect ไปยัง Keycloak Logout ได้ถ้าต้องการ Single Sign-Out
  // หรือ redirect กลับมาที่หน้าแรกของระบบ
  return NextResponse.redirect(postLogoutRedirectUri);
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
