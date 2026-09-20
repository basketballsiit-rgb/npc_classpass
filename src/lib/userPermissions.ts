import fs from "fs";
import path from "path";

export interface UserPermissionItem {
  id: string;
  email: string;
  name: string;
  department: string;
  role: "TEACHER" | "ADMIN";
  position?: string;
  updatedAt: string;
  lastLoginAt?: string;
}

const PERMISSIONS_FILE = path.join(process.cwd(), "src", "data", "user_permissions.json");

// บุคลากรเริ่มต้นสำหรับระบบ (กรณีสร้างไฟล์ใหม่)
const INITIAL_PERMISSIONS: UserPermissionItem[] = [
  {
    id: "usr-admin-1",
    email: "admin.eval@npc.ac.th",
    name: "เจ้าหน้าที่งานวัดผลและประเมินผล",
    department: "งานวัดผลและประเมินผล",
    role: "ADMIN",
    position: "เจ้าหน้าที่งานวัดผลฯ",
    updatedAt: new Date().toISOString(),
  },
];

/**
 * ดึงรายการสิทธิ์ผู้ใช้งานทั้งหมด
 */
export function getUserPermissions(): UserPermissionItem[] {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const content = fs.readFileSync(PERMISSIONS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read user_permissions.json:", err);
  }

  // หากยังไม่มีไฟล์ ให้บันทึกข้อมูลเริ่มต้น
  saveUserPermissions(INITIAL_PERMISSIONS);
  return INITIAL_PERMISSIONS;
}

/**
 * บันทึกข้อมูลสิทธิ์ผู้ใช้งานทั้งหมดลงไฟล์
 */
export function saveUserPermissions(permissions: UserPermissionItem[]): boolean {
  try {
    const dir = path.dirname(PERMISSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to save user_permissions.json:", err);
    return false;
  }
}

/**
 * ค้นหาสิทธิ์ผู้ใช้งานด้วยอีเมล
 */
export function getUserPermissionByEmail(email: string): UserPermissionItem | null {
  if (!email) return null;
  const list = getUserPermissions();
  const normalized = email.trim().toLowerCase();
  return list.find((u) => u.email.trim().toLowerCase() === normalized) || null;
}

/**
 * ปรับเปลี่ยนบทบาท (Role) ของผู้ใช้
 */
export function setUserRole(email: string, role: "TEACHER" | "ADMIN"): UserPermissionItem | null {
  const list = getUserPermissions();
  const normalized = email.trim().toLowerCase();
  const index = list.findIndex((u) => u.email.trim().toLowerCase() === normalized);

  if (index !== -1) {
    list[index].role = role;
    list[index].updatedAt = new Date().toISOString();
    saveUserPermissions(list);
    return list[index];
  }

  // หากไม่มี ให้สร้างใหม่
  const newItem: UserPermissionItem = {
    id: `usr-${Date.now()}`,
    email: normalized,
    name: email.split("@")[0],
    department: "",
    role,
    updatedAt: new Date().toISOString(),
  };
  list.unshift(newItem);
  saveUserPermissions(list);
  return newItem;
}

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ใช้ (Upsert)
 */
export function upsertUserPermission(data: {
  email: string;
  name?: string;
  department?: string;
  role?: "TEACHER" | "ADMIN";
  position?: string;
}): UserPermissionItem {
  const list = getUserPermissions();
  const normalized = data.email.trim().toLowerCase();
  const index = list.findIndex((u) => u.email.trim().toLowerCase() === normalized);

  if (index !== -1) {
    const existing = list[index];
    existing.name = data.name || existing.name;
    if (data.department !== undefined) existing.department = data.department;
    if (data.role) existing.role = data.role;
    if (data.position !== undefined) existing.position = data.position;
    existing.updatedAt = new Date().toISOString();
    saveUserPermissions(list);
    return existing;
  }

  const newItem: UserPermissionItem = {
    id: `usr-${Date.now()}`,
    email: normalized,
    name: data.name || data.email.split("@")[0],
    department: data.department || "",
    role: data.role || "TEACHER",
    position: data.position || "ครูผู้สอน",
    updatedAt: new Date().toISOString(),
  };
  list.unshift(newItem);
  saveUserPermissions(list);
  return newItem;
}

/**
 * บันทึกการเข้าใช้งานเมื่อผู้ใช้ล็อกอินผ่าน SSO สำเร็จ
 */
export function recordUserLogin(info: {
  email: string;
  name?: string;
  department?: string;
  position?: string;
  defaultRole?: "TEACHER" | "ADMIN";
}): UserPermissionItem {
  const list = getUserPermissions();
  const normalized = info.email.trim().toLowerCase();
  const index = list.findIndex((u) => u.email.trim().toLowerCase() === normalized);

  if (index !== -1) {
    const existing = list[index];
    if (info.name && (!existing.name || existing.name === existing.email.split("@")[0])) {
      existing.name = info.name;
    }
    if (info.department && !existing.department) {
      existing.department = info.department;
    }
    if (info.position && !existing.position) {
      existing.position = info.position;
    }
    existing.lastLoginAt = new Date().toISOString();
    saveUserPermissions(list);
    return existing;
  }

  // หากยังไม่เคยมีในระบบ ให้เพิ่มอัตโนมัติ
  const newItem: UserPermissionItem = {
    id: `usr-${Date.now()}`,
    email: normalized,
    name: info.name || info.email.split("@")[0],
    department: info.department || "",
    role: info.defaultRole || "TEACHER",
    position: info.position || "ครูผู้สอน",
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  list.unshift(newItem);
  saveUserPermissions(list);
  return newItem;
}

/**
 * ลบผู้ใช้ออกจากรายการกำหนดสิทธิ์
 */
export function deleteUserPermission(idOrEmail: string): boolean {
  const list = getUserPermissions();
  const filtered = list.filter((u) => u.id !== idOrEmail && u.email.toLowerCase() !== idOrEmail.toLowerCase());
  if (filtered.length !== list.length) {
    saveUserPermissions(filtered);
    return true;
  }
  return false;
}
