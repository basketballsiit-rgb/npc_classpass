import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getKeycloakUserInfo,
  fetchNpcjobProfile,
  setSession,
  UserSession,
} from "@/lib/auth";
import { getUserPermissionByEmail, recordUserLogin } from "@/lib/userPermissions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/npc_classpass" : "");
  const redirectUri = `${proto}://${host}${basePath}/api/auth/callback`;

  if (error || !code) {
    console.error("[Keycloak Auth] Authorization error:", error);
    return NextResponse.redirect(`${proto}://${host}${basePath}/?error=auth_cancelled`);
  }

  try {
    // 1. แลก Authorization Code เป็น Access Token
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    const accessToken = tokenData.access_token;

    // 2. ขอข้อมูล UserInfo จาก Keycloak
    const userInfo = await getKeycloakUserInfo(accessToken);

    const email = (userInfo.email || userInfo.preferred_username || "").toLowerCase();
    const username = userInfo.preferred_username || email.split("@")[0] || "";

    // 3. ตรวจสอบเงื่อนไข: ต้องเป็นอีเมล Google Workspace ของสถานศึกษา (@npc.ac.th)
    // (อนุญาตให้ผู้ใช้ที่มีโดเมน @npc.ac.th เข้าใช้งาน)
    if (!email.endsWith("@npc.ac.th") && !email.endsWith("npc.ac.th")) {
      console.warn(`[Keycloak Auth] Rejected non-college email: ${email}`);
      return NextResponse.redirect(
        `${proto}://${host}${basePath}/?error=invalid_domain&email=${encodeURIComponent(email)}`
      );
    }

    // 4. ดึงข้อมูลโปรไฟล์เพิ่มเติม (แผนกวิชา, ตำแหน่ง) จาก npcjob API ของวิทยาลัย
    const npcjobProfile = await fetchNpcjobProfile(username, email);

    const firstName = userInfo.given_name || userInfo.firstName || "";
    const lastName = userInfo.family_name || userInfo.lastName || "";
    let fullName = npcjobProfile.displayName || userInfo.name || trimName(`${firstName} ${lastName}`);

    if (!fullName || fullName === " ") {
      fullName = email.split("@")[0];
    }

    // แผนกวิชาที่ได้จากระบบกลาง (เช่น ฝ่ายยุทธศาสตร์และแผนงาน, ฝ่ายวิชาการ)
    const department = npcjobProfile.departmentName || "";
    const position = npcjobProfile.position || "ครูผู้สอน";

    // ตรวจสอบสิทธิ์จากระบบกำหนดสิทธิ์ผู้ใช้งาน (User Permissions)
    const existingPerm = getUserPermissionByEmail(email);

    let role: "TEACHER" | "ADMIN";
    if (existingPerm && existingPerm.role) {
      role = existingPerm.role;
    } else {
      // หากยังไม่มีการกำหนดสิทธิ์ไว้ ให้ตรวจสอบเกณฑ์พื้นฐาน
      const isDefaultAdmin =
        npcjobProfile.role === "admin" ||
        username.toLowerCase().includes("admin") ||
        email.startsWith("admin@") ||
        Boolean(position && (position.includes("รองผู้อำนวยการ") || position.includes("ผู้อำนวยการ")));
      role = isDefaultAdmin ? "ADMIN" : "TEACHER";
    }

    // บันทึก/อัปเดตประวัติการเข้าใช้งานและข้อมูลผู้ใช้ลงในระบบกำหนดสิทธิ์อัตโนมัติ
    recordUserLogin({
      email,
      name: fullName,
      department,
      position,
      defaultRole: role,
    });

    // 5. บันทึกข้อมูล Session ลง Cookie
    const userSession: UserSession = {
      id: userInfo.sub || username,
      email,
      username,
      name: fullName,
      firstName,
      lastName,
      department, // ถ้าเป็นค่าว่าง หน้าบ้านจะเด้งป๊อปอัปให้เลือกทันที
      position,
      role,
      avatar: userInfo.picture,
    };

    await setSession(userSession);

    // 6. Redirect ไปยังหน้าที่เหมาะสม
    const destination = role === "ADMIN" ? `${basePath}/admin` : `${basePath}/teacher`;
    return NextResponse.redirect(`${proto}://${host}${destination}`);
  } catch (err: any) {
    console.error("[Keycloak Auth Callback Error]", err);
    return NextResponse.redirect(
      `${proto}://${host}${basePath}/?error=auth_failed&msg=${encodeURIComponent(err.message || "")}`
    );
  }
}

function trimName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}
