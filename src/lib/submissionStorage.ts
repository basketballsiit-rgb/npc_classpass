import fs from "fs";
import path from "path";
import { KhorRorSubmissionSummary } from "@/types";
import { mockSubmissions } from "@/data/mock-data";

export interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  coursesCount: number;
  studentsCount: number;
  submissionIds: string[];
}

export interface SubmissionsDataFile {
  submissions: KhorRorSubmissionSummary[];
  batches: ImportBatch[];
  lastUpdated: string;
}

const STORAGE_FILE = path.join(process.cwd(), "src", "data", "submissions.json");

/**
 * ดึงข้อมูลรายการยื่น ขร. ทั้งหมดจากไฟล์ JSON ถาวร
 */
export function getSubmissionsData(): SubmissionsDataFile {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.submissions)) {
        return {
          submissions: parsed.submissions,
          batches: Array.isArray(parsed.batches) ? parsed.batches : [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("Could not read submissions.json:", err);
  }

  // หากยังไม่มีไฟล์ ให้บันทึก submissions เริ่มต้นเป็นอาร์เรย์ว่าง
  const initialData: SubmissionsDataFile = {
    submissions: [],
    batches: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to initialize submissions.json:", err);
  }

  return initialData;
}

/**
 * บันทึกข้อมูลรายการยื่น ขร. ทั้งหมดลงไฟล์ JSON ถาวร
 */
export function saveSubmissionsData(
  submissions: KhorRorSubmissionSummary[],
  batches: ImportBatch[]
): SubmissionsDataFile {
  const data: SubmissionsDataFile = {
    submissions,
    batches,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write submissions.json:", err);
  }

  return data;
}

/**
 * ลบรายการยื่น/วิชา ออกจากระบบอย่างถาวร
 */
export function deleteSubmission(subId: string): SubmissionsDataFile {
  const current = getSubmissionsData();
  const nextSubmissions = current.submissions.filter((s) => s.id !== subId);
  const nextBatches = current.batches
    .map((b) => ({
      ...b,
      submissionIds: b.submissionIds.filter((id) => id !== subId),
    }))
    .filter((b) => b.submissionIds.length > 0);

  return saveSubmissionsData(nextSubmissions, nextBatches);
}

/**
 * ลบทั้งชุดไฟล์ที่นำเข้า (Rollback)
 */
export function deleteBatch(batchId: string): SubmissionsDataFile {
  const current = getSubmissionsData();
  const batch = current.batches.find((b) => b.id === batchId);
  if (!batch) return current;

  const nextSubmissions = current.submissions.filter(
    (s) => !batch.submissionIds.includes(s.id)
  );
  const nextBatches = current.batches.filter((b) => b.id !== batchId);

  return saveSubmissionsData(nextSubmissions, nextBatches);
}

/**
 * ลบข้อมูลที่นำเข้าทั้งหมด
 */
export function clearAllImports(): SubmissionsDataFile {
  const current = getSubmissionsData();
  const batchSubIds = current.batches.flatMap((b) => b.submissionIds);
  const nextSubmissions = current.submissions.filter(
    (s) => !batchSubIds.includes(s.id) && !s.id.startsWith("sub-excel-")
  );

  return saveSubmissionsData(nextSubmissions, []);
}

/**
 * ลบนักศึกษาหนึ่งคนออกจากรายชื่อ ขร. ของวิชา
 */
export function deleteStudentFromSubmission(
  studentId: string,
  courseCode: string
): SubmissionsDataFile {
  const current = getSubmissionsData();
  const nextSubmissions = current.submissions.map((sub) => {
    if (sub.courseCode === courseCode) {
      const updatedStudents = sub.students.filter(
        (s) => s.student.studentId !== studentId
      );
      return {
        ...sub,
        studentCount: updatedStudents.length,
        students: updatedStudents,
      };
    }
    return sub;
  });

  return saveSubmissionsData(nextSubmissions, current.batches);
}

/**
 * อนุมัติรายการ ขร.
 */
export function approveSubmission(subId: string): SubmissionsDataFile {
  const current = getSubmissionsData();
  const nextSubmissions = current.submissions.map((sub) =>
    sub.id === subId ? { ...sub, status: "APPROVED" as const } : sub
  );

  return saveSubmissionsData(nextSubmissions, current.batches);
}

/**
 * เพิ่มรายการที่นำเข้าจาก Excel
 */
export function importSubmissions(
  newSubmissions: KhorRorSubmissionSummary[],
  newBatch: ImportBatch
): SubmissionsDataFile {
  const current = getSubmissionsData();
  const incomingCodes = new Set(newSubmissions.map((s) => s.courseCode));
  const filteredExisting = current.submissions.filter(
    (s) => !incomingCodes.has(s.courseCode)
  );

  const nextSubmissions = [...newSubmissions, ...filteredExisting];
  const nextBatches = [newBatch, ...current.batches];

  return saveSubmissionsData(nextSubmissions, nextBatches);
}

/**
 * รีเซ็ตข้อมูล (ล้างข้อมูลทั้งหมด)
 */
export function resetToMockData(): SubmissionsDataFile {
  return saveSubmissionsData([], []);
}
