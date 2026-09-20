import { NextRequest, NextResponse } from "next/server";
import { searchCoursesCatalog, getStoredCourses } from "@/lib/courseCatalog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  const courses = searchCoursesCatalog(q, limit);

  return NextResponse.json({
    success: true,
    count: courses.length,
    totalCatalog: getStoredCourses().length,
    courses,
  });
}
