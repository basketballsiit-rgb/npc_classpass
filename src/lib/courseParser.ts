/**
 * SQL Course Parser สำหรับตาราง tb_course จากระบบ ศธ.02 (สอศ.)
 */

export interface ParsedTbCourse {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  credits: number;
  theory: number;
  practice: number;
  totalHours: number;
  curriculumYear?: string;
  subjectType?: string;
  competency?: string;
  purpose?: string;
}

/**
 * วิเคราะห์คำสั่ง SQL (CREATE TABLE / INSERT INTO `tb_course`)
 * และดึงรายชื่อวิชาทั้งหมดออกมาอย่างแม่นยำ
 */
export function parseTbCourseSql(sqlText: string): ParsedTbCourse[] {
  if (!sqlText || typeof sqlText !== "string") return [];

  const courses: ParsedTbCourse[] = [];
  const seenCodes = new Set<string>();

  // ค้นหาคำสั่ง INSERT INTO `tb_course` (...) VALUES (...)
  // รองรับทั้งแบบระบุชื่อตาราง tb_course หรือมี backtick `tb_course`
  const insertRegex = /INSERT\s+INTO\s+[`'"]?tb_course[`'"]?\s*\(([^)]+)\)\s*VALUES/gi;
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(sqlText)) !== null) {
    const columnsPart = insertMatch[1];
    const columns = columnsPart
      .split(",")
      .map((c) => c.trim().replace(/^[`'"]|[`'"]$/g, ""));

    // หา index ของคอลัมน์สำคัญ
    const colIdx = {
      id: columns.findIndex((c) => c.toLowerCase() === "id"),
      subjectCode: columns.findIndex(
        (c) => c.toLowerCase() === "subjectcode" || c.toLowerCase() === "code"
      ),
      subjectNameTh: columns.findIndex(
        (c) =>
          c.toLowerCase() === "subjectnameth" ||
          c.toLowerCase() === "name" ||
          c.toLowerCase() === "subjectname"
      ),
      subjectNameEn: columns.findIndex(
        (c) => c.toLowerCase() === "subjectnameen"
      ),
      credit: columns.findIndex((c) => c.toLowerCase() === "credit"),
      creditTheory: columns.findIndex(
        (c) => c.toLowerCase() === "credittheory" || c.toLowerCase() === "theory"
      ),
      creditPractice: columns.findIndex(
        (c) =>
          c.toLowerCase() === "creditpractice" ||
          c.toLowerCase() === "practice"
      ),
      curriculumYear: columns.findIndex(
        (c) =>
          c.toLowerCase() === "curriculumyear" ||
          c.toLowerCase() === "createyear"
      ),
      subjectType: columns.findIndex(
        (c) => c.toLowerCase() === "subjecttype"
      ),
      competency: columns.findIndex((c) => c.toLowerCase() === "competency"),
      purpose: columns.findIndex((c) => c.toLowerCase() === "purpose"),
    };

    // หากไม่พบคอลัมน์ subjectCode และ subjectNameTh ให้ข้าม
    if (colIdx.subjectCode === -1 && colIdx.subjectNameTh === -1) {
      continue;
    }

    // ตัดส่วนหลังจากคำว่า VALUES เป็นต้นไปจนจบคำสั่งเซมิโคลอน (;)
    const afterValuesIdx = insertMatch.index + insertMatch[0].length;
    let semicolonIdx = sqlText.indexOf(";", afterValuesIdx);
    if (semicolonIdx === -1) semicolonIdx = sqlText.length;

    const valuesBlock = sqlText.slice(afterValuesIdx, semicolonIdx);

    // ทำการ Parse แต่ละ Tuple: (...), (...)
    const rows = parseSqlValuesBlock(valuesBlock);

    for (const row of rows) {
      const code = (row[colIdx.subjectCode] || "").trim();
      const name = (row[colIdx.subjectNameTh] || "").trim();

      // ต้องมีรหัสวิชา หรือชื่อวิชา
      if (!code && !name) continue;

      // ป้องกันการนำเข้าซ้ำรหัสเดิม
      const uniqueKey = `${code}-${name}`;
      if (seenCodes.has(uniqueKey)) continue;
      seenCodes.add(uniqueKey);

      const credits = parseFloat(row[colIdx.credit] || "0") || 0;
      const theory = parseFloat(row[colIdx.creditTheory] || "0") || 0;
      const practice = parseFloat(row[colIdx.creditPractice] || "0") || 0;
      const totalHours = (theory + practice) * 18 || credits * 18 || 36;

      courses.push({
        id: (row[colIdx.id] || `crs-${Date.now()}-${courses.length + 1}`).trim(),
        code: code || "ไม่มีรหัส",
        name: name || "ไม่ระบุชื่อวิชา",
        nameEn: colIdx.subjectNameEn !== -1 ? (row[colIdx.subjectNameEn] || "").trim() : undefined,
        credits,
        theory,
        practice,
        totalHours,
        curriculumYear:
          colIdx.curriculumYear !== -1
            ? (row[colIdx.curriculumYear] || "").trim()
            : undefined,
        subjectType:
          colIdx.subjectType !== -1
            ? (row[colIdx.subjectType] || "").trim()
            : undefined,
        competency:
          colIdx.competency !== -1
            ? (row[colIdx.competency] || "").trim()
            : undefined,
        purpose:
          colIdx.purpose !== -1
            ? (row[colIdx.purpose] || "").trim()
            : undefined,
      });
    }
  }

  // Fallback: หากไม่พบรูปแบบ INSERT INTO `tb_course` (columns) VALUES
  // ลองหาแบบ generic `( '...' , '...' )`
  if (courses.length === 0) {
    const genericMatches = sqlText.matchAll(
      /\(\s*(\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'[\s\S]*?'([0-9]{5}-[0-9]{4})'[\s\S]*?'([^']+)'/gi
    );
    for (const gm of genericMatches) {
      const code = gm[4];
      const name = gm[5];
      if (code && name && !seenCodes.has(code)) {
        seenCodes.add(code);
        courses.push({
          id: gm[1] || `crs-${Date.now()}-${courses.length + 1}`,
          code,
          name,
          credits: 3,
          theory: 1,
          practice: 4,
          totalHours: 72,
        });
      }
    }
  }

  return courses;
}

/**
 * Helper: แปลง block ของ values ใน SQL เช่น `(1, 'val', 'val'), (2, ...)`
 * โดยคำนึงถึง single quote ที่ซ้อนกัน หรือ escaped quotes (\' หรือ '')
 */
function parseSqlValuesBlock(block: string): string[][] {
  const rows: string[][] = [];
  let inRow = false;
  let inString = false;
  let escapeNext = false;
  let currentField = "";
  let currentRow: string[] = [];

  for (let i = 0; i < block.length; i++) {
    const char = block[i];

    if (inString) {
      if (escapeNext) {
        currentField += char;
        escapeNext = false;
      } else if (char === "\\") {
        escapeNext = true;
      } else if (char === "'") {
        // เช็คว่ามี '' ติดกันหรือไม่ (SQL single quote escape)
        if (block[i + 1] === "'") {
          currentField += "'";
          i++; // ข้ามตัวถัดไป
        } else {
          inString = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === "(" && !inRow) {
        inRow = true;
        currentRow = [];
        currentField = "";
      } else if (char === ")" && inRow) {
        currentRow.push(cleanSqlValue(currentField));
        rows.push(currentRow);
        inRow = false;
        currentRow = [];
        currentField = "";
      } else if (char === "," && inRow) {
        currentRow.push(cleanSqlValue(currentField));
        currentField = "";
      } else if (char === "'" && inRow) {
        inString = true;
      } else if (inRow && !/\s/.test(char)) {
        currentField += char;
      } else if (inRow && currentField.length > 0) {
        currentField += char;
      }
    }
  }

  return rows;
}

function cleanSqlValue(val: string): string {
  const trimmed = val.trim();
  if (trimmed.toUpperCase() === "NULL") return "";
  // ถอด quotes ด้านนอกออก
  return trimmed.replace(/^['"]|['"]$/g, "");
}
