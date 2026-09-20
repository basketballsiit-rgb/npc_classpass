import fs from "fs";
import path from "path";
import { ParsedTbCourse } from "./courseParser";
import { mockCourses } from "@/data/mock-data";

export interface CourseCatalogItem {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  credits: number;
  theory?: number;
  practice?: number;
  totalHours?: number;
  curriculumYear?: string;
  subjectType?: string;
  department?: string;
}

const CATALOG_FILE = path.join(process.cwd(), "src", "data", "courses-catalog.json");

/**
 * โหลดรายวิชาทั้งหมดจากคลัง JSON
 */
export function getStoredCourses(): CourseCatalogItem[] {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const data = fs.readFileSync(CATALOG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read courses-catalog.json:", err);
  }

  // Fallback: ใช้ข้อมูลเริ่มต้นจาก mockCourses
  return mockCourses.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    totalHours: c.totalHours,
    curriculumYear: "2562",
    subjectType: "หมวดวิชาชีพ",
    department: c.teacherDepartment,
  }));
}

/**
 * บันทึกรายวิชาลงในคลัง JSON (Merge ข้อมูลใหม่อัตโนมัติ โดยอ้างอิงรหัสวิชา code)
 */
export function saveCoursesToCatalog(newCourses: ParsedTbCourse[]): {
  total: number;
  added: number;
  updated: number;
} {
  const current = getStoredCourses();
  const map = new Map<string, CourseCatalogItem>();

  // ใส่ข้อมูลเดิมลง Map
  for (const c of current) {
    map.set(c.code.trim().toLowerCase(), c);
  }

  let added = 0;
  let updated = 0;

  // นำเข้าข้อมูลใหม่
  for (const nc of newCourses) {
    const key = nc.code.trim().toLowerCase();
    if (!key) continue;

    const item: CourseCatalogItem = {
      id: nc.id || `c-${Date.now()}-${map.size + 1}`,
      code: nc.code.trim(),
      name: nc.name.trim(),
      nameEn: nc.nameEn,
      credits: nc.credits,
      theory: nc.theory,
      practice: nc.practice,
      totalHours: nc.totalHours,
      curriculumYear: nc.curriculumYear,
      subjectType: nc.subjectType,
      department: guessDepartmentFromCode(nc.code),
    };

    if (map.has(key)) {
      updated++;
    } else {
      added++;
    }
    map.set(key, item);
  }

  const allCourses = Array.from(map.values());

  try {
    const dir = path.dirname(CATALOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(allCourses, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write courses-catalog.json:", err);
  }

  return {
    total: allCourses.length,
    added,
    updated,
  };
}

/**
 * ค้นหารายวิชาสำหรับ Dropdown Autocomplete
 */
export function searchCoursesCatalog(query: string, limit = 20): CourseCatalogItem[] {
  const all = getStoredCourses();
  const q = (query || "").trim().toLowerCase();

  if (!q) {
    return all.slice(0, limit);
  }

  return all
    .filter((c) => {
      const matchCode = c.code.toLowerCase().includes(q);
      const matchName = c.name.toLowerCase().includes(q);
      const matchNameEn = c.nameEn ? c.nameEn.toLowerCase().includes(q) : false;
      return matchCode || matchName || matchNameEn;
    })
    .slice(0, limit);
}

/**
 * อนุมานแผนกวิชาจากรหัสวิชาของ สอศ.
 */
function guessDepartmentFromCode(code: string): string {
  // รหัสวิชาอาชีวศึกษา เช่น 20101 = ช่างยนต์, 20105 = ช่างไฟฟ้า, 20201 = การบัญชี ฯลฯ
  if (code.startsWith("20101") || code.startsWith("30101")) return "แผนกวิชาช่างยนต์";
  if (code.startsWith("20105") || code.startsWith("30105")) return "แผนกวิชาช่างไฟฟ้ากำลัง";
  if (code.startsWith("20106") || code.startsWith("30106")) return "แผนกวิชาช่างก่อสร้าง";
  if (code.startsWith("20104") || code.startsWith("30104")) return "แผนกวิชาช่างเชื่อมโลหะ";
  if (code.startsWith("20107") || code.startsWith("30107")) return "แผนกวิชาช่างอิเล็กทรอนิกส์";
  if (code.startsWith("20201") || code.startsWith("30201")) return "แผนกวิชาการบัญชี";
  if (code.startsWith("20202") || code.startsWith("30202")) return "แผนกวิชาการตลาด";
  if (code.startsWith("20204") || code.startsWith("30204")) return "แผนกวิชาคอมพิวเตอร์ธุรกิจ";
  if (code.startsWith("20701") || code.startsWith("30701")) return "แผนกวิชาการโรงแรม";
  if (code.startsWith("20000") || code.startsWith("30000")) return "แผนกวิชาสามัญสัมพันธ์";
  return "รายวิชาส่วนกลาง";
}
