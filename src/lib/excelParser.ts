import * as XLSX from "xlsx";
import { Student } from "@/types";
import { cleanThaiText } from "./thaiUtils";

export interface ParsedStudentRow {
  index: number;
  studentId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  classGroup: string;
  department: string;
  level: string;
  remark: string;
  courseCode?: string;
  courseName?: string;
  teacherName?: string;
}

export interface ParsedCourseBlock {
  courseCode: string;
  courseName: string;
  teacherName: string;
  students: ParsedStudentRow[];
}

export interface ParsedKhorRorExcel {
  fileName: string;
  collegeName: string;
  term: number;
  academicYear: number;
  courses: ParsedCourseBlock[];
  totalStudents: number;
  allParsedStudents: Student[];
}

// Split Thai full name into prefix, firstName, lastName with Thai Unicode Normalization
export function splitThaiName(nameStr: string): { prefix: string; firstName: string; lastName: string } {
  let clean = cleanThaiText(nameStr);
  let prefix = "";

  const prefixes = ["นาย", "นางสาว", "น.ส.", "นาง", "ด.ช.", "ด.ญ."];
  for (const p of prefixes) {
    if (clean.startsWith(p)) {
      prefix = p === "น.ส." ? "นางสาว" : p;
      clean = clean.slice(p.length).trim();
      break;
    }
  }

  // Split remainder into firstName and lastName
  const parts = clean.split(/\s+/).filter(Boolean);
  const firstName = cleanThaiText(parts[0] || clean);
  const lastName = cleanThaiText(parts.slice(1).join(" ") || "-");

  return { prefix, firstName, lastName };
}

// Parse class group into level & department
export function parseClassGroup(classGroupStr: string): { level: string; department: string } {
  const clean = cleanThaiText(classGroupStr);
  // e.g. "ปวช.1/1 ช่างยนต์" -> level: "ปวช.1", department: "ช่างยนต์"
  const match = clean.match(/(ปวช\.\d+|ปวส\.\d+)\/?\S*\s*(.*)/);
  if (match) {
    return {
      level: cleanThaiText(match[1] || "ปวช.1"),
      department: cleanThaiText(match[2] || "ช่างยนต์"),
    };
  }

  return {
    level: clean.startsWith("ปวส") ? "ปวส.1" : "ปวช.1",
    department: cleanThaiText(clean),
  };
}

export async function parseKhorRorExcelFile(file: File): Promise<ParsedKhorRorExcel> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  let collegeName = "วิทยาลัยสารพัดช่างน่าน";
  let term = 1;
  let academicYear = 2569;

  const courses: ParsedCourseBlock[] = [];
  let currentCourse: ParsedCourseBlock = {
    courseCode: "20101-2009",
    courseName: "งานวัดละเอียดช่างยนต์",
    teacherName: "นายพรชัย สีแดง",
    students: [],
  };

  const allParsedStudents: Student[] = [];

  // Iterate over each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to 2D array of rows
    const rows: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const fullRowText = row.map((c) => cleanThaiText(c)).join(" ");

      // Check for College Name (e.g. วิทยาลัยสารพัดช่างน่าน)
      if (fullRowText.includes("วิทยาลัย")) {
        const m = fullRowText.match(/วิทยาลัย[^\s]+/);
        if (m) collegeName = cleanThaiText(m[0]);
      }

      // Check for Term and Year (e.g. ภาคเรียนที่ 1 ปีการศึกษา 2569)
      const termMatch = fullRowText.match(/ภาคเรียนที่\s*(\d+)/);
      if (termMatch) {
        term = parseInt(termMatch[1], 10);
      }
      const yearMatch = fullRowText.match(/ปีการศึกษา\s*(\d+)/);
      if (yearMatch) {
        academicYear = parseInt(yearMatch[1], 10);
      }

      // Check for Course & Teacher Row:
      // e.g. "รหัสวิชา 20101-2009 วิชา งานวัดละเอียดช่างยนต์ ครูผู้สอน นายพรชัย สีแดง"
      if (fullRowText.includes("รหัสวิชา")) {
        const codeMatch = fullRowText.match(/รหัสวิชา\s*([0-9-]+)/);
        const nameMatch = fullRowText.match(/วิชา\s*(.*?)(?=\s*ครูผู้สอน|$)/);
        const teacherMatch = fullRowText.match(/ครูผู้สอน\s*(.*)/);

        if (codeMatch) {
          // If currentCourse already has students, push to courses array and start new one
          if (currentCourse.students.length > 0) {
            courses.push({ ...currentCourse });
          }

          currentCourse = {
            courseCode: cleanThaiText(codeMatch[1]),
            courseName: cleanThaiText(nameMatch ? nameMatch[1] : "รายวิชา"),
            teacherName: cleanThaiText(teacherMatch ? teacherMatch[1] : "ครูผู้สอน"),
            students: [],
          };
          continue;
        }
      }

      // Detect Student Row:
      // Look for a cell that contains a student ID (typically 10-11 digits, like 69201010009)
      let studentIdColIndex = -1;
      for (let c = 0; c < row.length; c++) {
        const cellVal = cleanThaiText(row[c]);
        if (/^\d{10,12}$/.test(cellVal)) {
          studentIdColIndex = c;
          break;
        }
      }

      if (studentIdColIndex !== -1) {
        const studentId = cleanThaiText(row[studentIdColIndex]);

        // Sequential index
        const indexVal = parseInt(cleanThaiText(row[studentIdColIndex - 1] || "0"), 10) || currentCourse.students.length + 1;

        // Name can be in the next 1 or 2 columns (e.g. Col C or Col C+D merged/separate)
        let nameCandidate = "";
        let classGroupCandidate = "";
        let remarkCandidate = "";

        const remainderCols = row
          .slice(studentIdColIndex + 1)
          .map((v) => cleanThaiText(v))
          .filter(Boolean);

        if (remainderCols.length >= 2) {
          // If remainderCols[0] is first name and remainderCols[1] is last name or class
          if (remainderCols[1].startsWith("ปวช") || remainderCols[1].startsWith("ปวส")) {
            nameCandidate = remainderCols[0];
            classGroupCandidate = remainderCols[1];
            remarkCandidate = remainderCols[2] || "";
          } else {
            // First and last name are in separate columns: remainderCols[0] + remainderCols[1]
            nameCandidate = `${remainderCols[0]} ${remainderCols[1]}`;
            classGroupCandidate = remainderCols[2] || "ปวช.1/1 ช่างยนต์";
            remarkCandidate = remainderCols[3] || "";
          }
        } else if (remainderCols.length === 1) {
          nameCandidate = remainderCols[0];
          classGroupCandidate = "ปวช.1/1 ช่างยนต์";
        }

        if (!nameCandidate) {
          nameCandidate = "นักศึกษา";
        }

        const { prefix, firstName, lastName } = splitThaiName(nameCandidate);
        const { level, department } = parseClassGroup(classGroupCandidate);

        const parsedStudent: ParsedStudentRow = {
          index: indexVal,
          studentId,
          prefix,
          firstName,
          lastName,
          fullName: cleanThaiText(`${prefix}${firstName} ${lastName}`),
          classGroup: cleanThaiText(classGroupCandidate || "ปวช.1/1 ช่างยนต์"),
          department: cleanThaiText(department),
          level: cleanThaiText(level),
          remark: cleanThaiText(remarkCandidate || "หมดสิทธิ์สอบ (ขร.)"),
          courseCode: currentCourse.courseCode,
          courseName: currentCourse.courseName,
          teacherName: currentCourse.teacherName,
        };

        currentCourse.students.push(parsedStudent);

        allParsedStudents.push({
          id: `excel-std-${studentId}`,
          studentId,
          prefix,
          firstName,
          lastName,
          level: cleanThaiText(level),
          department: cleanThaiText(department),
          classGroup: cleanThaiText(classGroupCandidate || "ปวช.1/1 ช่างยนต์"),
        });
      }
    }

    // Push the final course if it has students
    if (currentCourse.students.length > 0) {
      courses.push({ ...currentCourse });
    }
  }

  // Calculate total students
  const totalStudents = courses.reduce((sum, c) => sum + c.students.length, 0);

  return {
    fileName: file.name,
    collegeName,
    term,
    academicYear,
    courses,
    totalStudents,
    allParsedStudents,
  };
}
