import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: !!session,
    user: session,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { department, name } = body;

    // อัปเดตแผนกวิชา
    if (department) {
      session.department = department.trim();
    }
    if (name) {
      session.name = name.trim();
    }

    await setSession(session);

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
