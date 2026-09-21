import { NextRequest, NextResponse } from "next/server";
import {
  getSubmissionsData,
  saveSubmissionsData,
  deleteSubmission,
  deleteBatch,
  clearAllImports,
  deleteStudentFromSubmission,
  approveSubmission,
  importSubmissions,
  addSubmission,
  resetToMockData,
} from "@/lib/submissionStorage";

export async function GET() {
  const data = getSubmissionsData();
  return NextResponse.json({
    success: true,
    submissions: data.submissions,
    batches: data.batches,
    lastUpdated: data.lastUpdated,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case "delete_submission":
        if (!body.id) {
          return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
        }
        result = deleteSubmission(body.id);
        break;

      case "delete_batch":
        if (!body.batchId) {
          return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
        }
        result = deleteBatch(body.batchId);
        break;

      case "clear_all_imports":
        result = clearAllImports(
          typeof body.term === "number" ? body.term : undefined,
          typeof body.academicYear === "number" ? body.academicYear : undefined
        );
        break;

      case "delete_student":
        if (!body.studentId || !body.courseCode) {
          return NextResponse.json({ error: "Missing studentId or courseCode" }, { status: 400 });
        }
        result = deleteStudentFromSubmission(body.studentId, body.courseCode);
        break;

      case "approve":
        if (!body.id) {
          return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
        }
        result = approveSubmission(body.id);
        break;

      case "import":
        if (!Array.isArray(body.submissions) || !body.batch) {
          return NextResponse.json({ error: "Missing submissions or batch" }, { status: 400 });
        }
        result = importSubmissions(body.submissions, body.batch);
        break;

      case "add_submission":
        if (!body.submission) {
          return NextResponse.json({ error: "Missing submission" }, { status: 400 });
        }
        result = addSubmission(body.submission);
        break;

      case "reset_mock":
        result = resetToMockData();
        break;

      case "save_all":
        if (!Array.isArray(body.submissions)) {
          return NextResponse.json({ error: "Invalid submissions array" }, { status: 400 });
        }
        result = saveSubmissionsData(body.submissions, body.batches || []);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      submissions: result.submissions,
      batches: result.batches,
      lastUpdated: result.lastUpdated,
    });
  } catch (err: any) {
    console.error("Submissions API error:", err);
    return NextResponse.json(
      { error: "Failed to process submissions request", details: err?.message },
      { status: 500 }
    );
  }
}
