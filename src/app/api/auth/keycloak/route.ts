import { NextRequest, NextResponse } from "next/server";
import { getKeycloakAuthUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // คำนวณ Redirect URI กลับมาที่ /api/auth/callback
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  
  // basePath support
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/npc_classpass" : "");
  const redirectUri = `${proto}://${host}${basePath}/api/auth/callback`;

  const authUrl = getKeycloakAuthUrl(redirectUri);

  return NextResponse.redirect(authUrl);
}
