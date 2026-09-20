import { NextRequest, NextResponse } from "next/server";
import {
  getUserPermissions,
  setUserRole,
  upsertUserPermission,
  deleteUserPermission,
} from "@/lib/userPermissions";

export async function GET() {
  try {
    const permissions = getUserPermissions();
    return NextResponse.json({
      success: true,
      users: permissions,
      total: permissions.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, role, name, department, id } = body;

    if (action === "update_role") {
      if (!email || !role || !["TEACHER", "ADMIN"].includes(role)) {
        return NextResponse.json(
          { success: false, error: "Invalid email or role" },
          { status: 400 }
        );
      }
      const updated = setUserRole(email, role);
      return NextResponse.json({
        success: true,
        user: updated,
        message: `อัปเดตสิทธิ์ของ ${email} เป็น ${role === "ADMIN" ? "งานวัดผล (Admin)" : "ครูผู้สอน"} เรียบร้อยแล้ว`,
      });
    }

    if (action === "upsert") {
      if (!email || !email.includes("@")) {
        return NextResponse.json(
          { success: false, error: "กรุณาระบุอีเมลที่ถูกต้อง (@npc.ac.th)" },
          { status: 400 }
        );
      }
      const user = upsertUserPermission({
        email,
        name,
        department,
        role: role || "TEACHER",
      });
      return NextResponse.json({
        success: true,
        user,
        message: `บันทึกข้อมูลผู้ใช้งาน ${email} เรียบร้อยแล้ว`,
      });
    }

    if (action === "delete") {
      const targetId = id || email;
      if (!targetId) {
        return NextResponse.json(
          { success: false, error: "Missing user id or email" },
          { status: 400 }
        );
      }
      const success = deleteUserPermission(targetId);
      return NextResponse.json({
        success,
        message: success ? "ลบรายการเรียบร้อยแล้ว" : "ไม่พบผู้ใช้งานที่ระบุ",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
