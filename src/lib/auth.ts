import { cookies } from "next/headers";

export interface UserSession {
  id: string;
  email: string;
  username: string;
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  department: string;
  position: string;
  role: "TEACHER" | "ADMIN";
  avatar?: string;
}

// Keycloak & NPC OIDC Settings
export const KEYCLOAK_CONFIG = {
  baseUrl: process.env.KEYCLOAK_BASE_URL || "https://service.npc.ac.th",
  realm: process.env.KEYCLOAK_REALM || "NPC-SSO",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "npc-go",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "UBPFJr7kkfFSZKrXIhbhdb0zfpEHAqdc",
  npcjobApiUrl: process.env.NPCJOB_API_URL || "https://service.npc.ac.th/npcjob/api_profile.php",
  npcjobApiToken: process.env.NPCJOB_API_TOKEN || "npc_sf_2026_api_key_x9k2m",
};

export const SESSION_COOKIE_NAME = "npc_classpass_session";

/**
 * สร้าง URL สำหรับ Redirect ไปยัง Keycloak เพื่อล็อกอินผ่าน Google Workspace (@npc.ac.th)
 */
export function getKeycloakAuthUrl(redirectUri: string): string {
  const authEndpoint = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    kc_idp_hint: "google", // บังคับ Redirect ไปยัง Google Workspace Login ทันที
  });

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * แลกเปลี่ยน Authorization Code เป็น Access Token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const tokenEndpoint = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CONFIG.clientId,
    client_secret: KEYCLOAK_CONFIG.clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to exchange code: ${res.status} ${errText}`);
  }

  return res.json();
}

/**
 * ดึง User Profile จาก Keycloak UserInfo Endpoint
 */
export async function getKeycloakUserInfo(accessToken: string) {
  const userInfoEndpoint = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`;

  const res = await fetch(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch userinfo: ${res.status} ${errText}`);
  }

  return res.json();
}

/**
 * ดึงข้อมูลตำแหน่งและแผนกวิชาจากระบบ npcjob API ของวิทยาลัย
 */
export async function fetchNpcjobProfile(username: string): Promise<{
  displayName?: string;
  departmentName?: string;
  position?: string;
}> {
  try {
    const url = new URL(KEYCLOAK_CONFIG.npcjobApiUrl);
    url.searchParams.set("username", username);
    url.searchParams.set("token", KEYCLOAK_CONFIG.npcjobApiToken);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache 5 minutes
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return {
          displayName: data.user.display_name,
          departmentName: data.user.department_name,
          position: data.user.position,
        };
      }
    }
  } catch (err) {
    console.warn("[NPCJOB API] Could not fetch profile for:", username, err);
  }

  return {};
}

/**
 * จัดการ Session Cookie ใน Next.js
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf8");
    return JSON.parse(decoded) as UserSession;
  } catch {
    return null;
  }
}

export async function setSession(session: UserSession) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
