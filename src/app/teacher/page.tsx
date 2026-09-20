"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/dashboard/Header";
import { OfficialMemoModal } from "@/components/dashboard/OfficialMemoModal";
import { Std02SyncModal } from "@/components/dashboard/Std02SyncModal";
import { TermYearSettingModal } from "@/components/dashboard/TermYearSettingModal";
import { MissingDepartmentModal } from "@/components/dashboard/MissingDepartmentModal";
import { ParsedCourseBlock } from "@/lib/excelParser";
import {
  allCollegeStudents,
  mockTeacher,
} from "@/data/mock-data";
import { Student, Course, StudentAttendance, TeacherProfile } from "@/types";
import { cleanThaiText } from "@/lib/thaiUtils";
import { getAssetPath } from "@/lib/utils";
import {
  Search,
  Users,
  Plus,
  Trash2,
  Printer,
  Send,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileSpreadsheet,
  Sparkles,
  Info,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface KhorRorEntry {
  id: string;
  student: Student;
  remark: string;
  addedAt: string;
}

export default function TeacherDirectKhorRorPage() {
  const [teacher, setTeacher] = useState<TeacherProfile>({
    ...mockTeacher,
    id: "loading",
    name: "กำลังโหลดข้อมูล...",
    email: "",
    department: "",
  });
  const [isMissingDeptOpen, setIsMissingDeptOpen] = useState(false);
  const teacherName = teacher.name;

  // Load User Session from Keycloak / Google Workspace SSO
  useEffect(() => {
    async function loadUserSession() {
      try {
        const res = await fetch(getAssetPath("/api/auth/me"));
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const u = data.user;
            setTeacher((prev) => ({
              ...prev,
              id: u.id || prev.id,
              name: u.name || prev.name,
              email: u.email || prev.email,
              department: u.department || "",
              position: u.position,
              role: u.role || "TEACHER",
            }));

            // หากไม่มีข้อมูลแผนกวิชา ให้เด้งป๊อปอัปให้ระบุทันที
            if (!u.department || u.department.trim() === "" || u.department === "-" || u.department === "ยังไม่ได้ระบุ") {
              setIsMissingDeptOpen(true);
            }
            return;
          }
        }
        // Fallback สำหรับกรณีเปิดหน้านอกระบบล็อกอิน
        setTeacher(mockTeacher);
      } catch (err) {
        console.warn("Could not load user session:", err);
        setTeacher(mockTeacher);
      }
    }

    loadUserSession();
  }, []);

  // Active Term & Academic Year (Matches Excel 1/2569 by default or user setting)
  const [currentTerm, setCurrentTerm] = useState<number>(1);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<number>(2569);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Imported multi-course blocks from Excel
  const [importedCourses, setImportedCourses] = useState<ParsedCourseBlock[]>([]);

  // Course State
  const [courseCode, setCourseCode] = useState("20101-2009");
  const [courseName, setCourseName] = useState("งานวัดละเอียดช่างยนต์");

  // Course Autocomplete State (จากคลัง ศธ.02)
  interface CourseSearchItem {
    id: string;
    code: string;
    name: string;
    nameEn?: string;
    credits: number;
    theory?: number;
    practice?: number;
    curriculumYear?: string;
    subjectType?: string;
  }
  const [courseSuggestions, setCourseSuggestions] = useState<CourseSearchItem[]>([]);
  const [isSearchingCourse, setIsSearchingCourse] = useState(false);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<"code" | "name" | null>(null);
  const courseSearchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search courses from /api/courses/search
  useEffect(() => {
    if (!activeSearchField) return;
    const query = activeSearchField === "code" ? courseCode : courseName;
    if (!query || query.trim().length < 2) {
      setCourseSuggestions([]);
      setShowCourseSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCourse(true);
      try {
        const res = await fetch(
          getAssetPath(`/api/courses/search?q=${encodeURIComponent(query.trim())}&limit=12`)
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.courses)) {
            setCourseSuggestions(data.courses);
            setShowCourseSuggestions(data.courses.length > 0);
          }
        }
      } catch (err) {
        console.error("Failed to search course catalog:", err);
      } finally {
        setIsSearchingCourse(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [courseCode, courseName, activeSearchField]);

  // Click outside to close course suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        courseSearchContainerRef.current &&
        !courseSearchContainerRef.current.contains(e.target as Node)
      ) {
        setShowCourseSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectCourseSuggestion = (c: CourseSearchItem) => {
    setCourseCode(c.code);
    setCourseName(c.name);
    setShowCourseSuggestions(false);
    setActiveSearchField(null);
    setNotification({
      type: "info",
      message: `เลือกรายวิชา ${c.code} ${c.name} (${c.credits || 0} นก.) จากคลัง ศธ.02 เรียบร้อยแล้ว`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Search State for Student Registry
  const [searchQuery, setSearchQuery] = useState("");

  // Active Khor-Ror List for this Course (Initial sample matching the document!)
  const [khorRorList, setKhorRorList] = useState<KhorRorEntry[]>([
    {
      id: "entry-1",
      student: allCollegeStudents[0], // อรรถชัย หารกา (ปวช.1/1 ช่างยนต์)
      remark: "ขาดเรียนเกิน 20%",
      addedAt: "19 ก.ย. 2567",
    },
    {
      id: "entry-2",
      student: allCollegeStudents[1], // ธนกฤต มูลอ่อน (ปวช.1/1 ช่างยนต์)
      remark: "ขาดเรียนเกิน 20%",
      addedAt: "19 ก.ย. 2567",
    },
    {
      id: "entry-3",
      student: allCollegeStudents[2], // ธนวัตน์ แซ่ลี (ปวช.1/1 ช่างยนต์)
      remark: "ขาดเรียนติดต่อกัน 4 ครั้ง",
      addedAt: "19 ก.ย. 2567",
    },
    {
      id: "entry-4",
      student: allCollegeStudents[3], // ชยากร สุคำ (ปวช.1/1 ช่างยนต์)
      remark: "เวลาเรียนไม่ถึง 80%",
      addedAt: "19 ก.ย. 2567",
    },
    {
      id: "entry-5",
      student: allCollegeStudents[4], // ภาสุช ตระกลทรัพย์ดี (ปวช.1/1 บัญชี)
      remark: "ขาดเรียนเกิน 20%",
      addedAt: "19 ก.ย. 2567",
    },
  ]);

  // Modal States
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isStd02ModalOpen, setIsStd02ModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  // Search results from College Student Registry
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();

    return allCollegeStudents.filter((std) => {
      const matchId = std.studentId.toLowerCase().includes(q);
      const matchFirst = std.firstName.toLowerCase().includes(q);
      const matchLast = std.lastName.toLowerCase().includes(q);
      const matchFull = `${std.firstName} ${std.lastName}`
        .toLowerCase()
        .includes(q);
      const matchGroup = std.classGroup.toLowerCase().includes(q);
      const matchDept = std.department.toLowerCase().includes(q);

      return (
        matchId ||
        matchFirst ||
        matchLast ||
        matchFull ||
        matchGroup ||
        matchDept
      );
    });
  }, [searchQuery]);

  // Quick Preset Courses (Matching user's sample document!)
  const presetCourses = [
    {
      code: "20000-1201",
      name: "ภาษาอังกฤษเพื่อการสื่อสาร",
    },
    {
      code: "30000-1201",
      name: "ภาษาอังกฤษสำหรับงานอาชีพ",
    },
    {
      code: "20000-1103",
      name: "ภาษาไทยธุรกิจ",
    },
    {
      code: "30000-1101",
      name: "ภาษาไทยเพื่อการสื่อสารในงานอาชีพ",
    },
    {
      code: "20105-2001",
      name: "การติดตั้งไฟฟ้าในอาคาร",
    },
  ];

  const handleSelectPresetCourse = (c: {
    code: string;
    name: string;
  }) => {
    setCourseCode(c.code);
    setCourseName(c.name);
    setNotification({
      type: "info",
      message: `เปลี่ยนเป็นรายวิชา ${c.code} ${c.name} เรียบร้อยแล้ว`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add student to active Khor-Ror list
  const handleAddStudent = (std: Student) => {
    // Check if already in list
    const exists = khorRorList.some((e) => e.student.studentId === std.studentId);
    if (exists) {
      setNotification({
        type: "info",
        message: `นักเรียนรหัส ${std.studentId} (${std.firstName}) อยู่ในรายชื่อ ขร. ของวิชานี้แล้ว`,
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const newEntry: KhorRorEntry = {
      id: `entry-${Date.now()}-${std.studentId}`,
      student: std,
      remark: "ขาดเรียนเกิน 20%",
      addedAt: "19 ก.ย. 2567",
    };

    setKhorRorList((prev) => [newEntry, ...prev]);
    setNotification({
      type: "success",
      message: `เพิ่ม ${std.prefix}${std.firstName} ${std.lastName} (${std.studentId}) เข้ารายชื่อ ขร. เรียบร้อยแล้ว`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Remove student from Khor-Ror list
  const handleRemoveStudent = (id: string) => {
    setKhorRorList((prev) => prev.filter((e) => e.id !== id));
  };

  // Update remark
  const handleUpdateRemark = (id: string, newRemark: string) => {
    setKhorRorList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, remark: newRemark } : e))
    );
  };

  // Submit to Admin
  const handleSubmitToAdmin = () => {
    if (khorRorList.length === 0) return;
    setNotification({
      type: "success",
      message: `ส่งรายงานแจ้งเกรด ขร. วิชา ${courseCode} จำนวน ${khorRorList.length} คน ไปยังงานวัดผลและประเมินผลเรียบร้อยแล้ว`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Convert Khor-Ror entries to StudentAttendance format for OfficialMemoModal
  const currentCourseObject: Course = {
    id: `course-${courseCode}`,
    code: courseCode,
    name: courseName,
    credits: 2,
    totalHours: 36,
    term: currentTerm,
    academicYear: currentAcademicYear,
    teacherName: teacherName,
    teacherDepartment: "วิทยาลัยสารพัดช่างน่าน",
    room: "-",
    totalStudents: khorRorList.length + 20,
  };

  const modalStudents: StudentAttendance[] = useMemo(() => {
    return khorRorList.map((entry) => ({
      id: entry.id,
      courseId: currentCourseObject.id,
      student: entry.student,
      totalHours: 36,
      attendedHours: 24,
      absentHours: 10,
      leaveHours: 2,
      lateHours: 0,
      attendanceRate: 66.7, // < 80%
      status: "KHOR_ROR",
      submissionStatus: "SUBMITTED",
      remark: entry.remark,
    }));
  }, [khorRorList, currentCourseObject.id]);

  return (
    <div className="min-h-screen bg-[#F8F5FD]">
      {/* Top Navbar */}
      <Header
        teacher={{
          ...mockTeacher,
          name: teacherName,
          term: currentTerm,
          academicYear: currentAcademicYear,
        }}
        onOpenTermSetting={() => setIsTermModalOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${
              notification.type === "success"
                ? "bg-[#EDFBF5] text-[#1E7250] border-[#B7EED8]"
                : "bg-[#F3EEFA] text-[#4F3C9E] border-[#D8CCED]"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 text-[#8C78EA] shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{notification.message}</span>
          </div>
        )}

        {/* Header Title with Std02 Sync Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3F5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2B244D]">
              ระบบบันทึกและส่งรายงานผลการเรียน "ขร." (หมดสิทธิ์สอบ)
            </h1>
            <p className="text-xs sm:text-sm text-[#857E9E] font-medium mt-1">
              ครูผู้สอนระบุรายวิชา และค้นหาเพื่อเลือกรายชื่อผู้เรียนที่ได้รับเกรด ขร. จากฐานข้อมูลวิทยาลัยเพื่อแจ้งงานวัดผล
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Button to Open Excel Announcement Modal */}
            <button
              type="button"
              onClick={() => setIsStd02ModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50/80 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>📊 นำเข้าไฟล์ประกาศ Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsStd02ModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#D8CCED] bg-white px-4 py-2 text-xs font-bold text-[#7A63E5] shadow-sm hover:bg-[#F3EEFA] transition-all cursor-pointer"
            >
              <Globe className="h-4 w-4 text-[#8C78EA]" />
              <span>🔌 ซิงค์ ศธ.02 (API / SQL)</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: COURSE SPECIFICATION & QUICK PRESETS               */}
        {/* ============================================================== */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EBF7] pb-3">
            <div className="flex items-center gap-2.5 text-[#2B244D] font-black text-base">
              <div className="squircle-purple h-8 w-8 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <span>1. กำหนดข้อมูลรายวิชา (Course Information)</span>
            </div>
            <span className="text-xs text-[#857E9E] font-medium">
              คลิกเลือกวิชาที่สอน หรือแก้ไขรหัส/ชื่อวิชาได้โดยตรง
            </span>
          </div>

          {/* Multi-Course Tabs from Imported Excel (When Excel contains multiple courses) */}
          {importedCourses.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F4EFFC] border border-[#D5C7F2] space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black text-[#7A63E5] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>รายวิชาที่นำเข้าจากไฟล์ประกาศ Excel ({importedCourses.length} รายวิชา):</span>
                </span>
                <span className="text-[11px] text-[#857E9E]">
                  คลิกเพื่อสลับรายวิชาและแสดงรายชื่อ ขร. เฉพาะวิชานั้น
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {importedCourses.map((ic, idx) => {
                  const isCurrent = courseCode === ic.courseCode;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCourseCode(ic.courseCode);
                        setCourseName(ic.courseName);
                        // Switch Khor-Ror list to this course's students
                        const entries: KhorRorEntry[] = ic.students.map((s, sIdx) => ({
                          id: `excel-${ic.courseCode}-${s.studentId}-${sIdx}`,
                          student: {
                            id: `std-${s.studentId}`,
                            studentId: s.studentId,
                            prefix: s.prefix,
                            firstName: s.firstName,
                            lastName: s.lastName,
                            level: s.level,
                            department: s.department,
                            classGroup: s.classGroup,
                          },
                          remark: s.remark || "หมดสิทธิ์สอบ (ขร.)",
                          addedAt: "19 ก.ย. 2567",
                        }));
                        setKhorRorList(entries);
                        setNotification({
                          type: "info",
                          message: `สลับเป็นรายวิชา ${ic.courseCode} ${ic.courseName} (${ic.students.length} คน)`,
                        });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${
                        isCurrent
                          ? "btn-clay-purple text-white shadow-md scale-[1.02]"
                          : "bg-white text-[#2B244D] border-[#D8CCED] hover:bg-purple-50/50"
                      }`}
                    >
                      <span className="font-mono">{ic.courseCode}</span>
                      <span>{ic.courseName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCurrent
                            ? "bg-white/25 text-white"
                            : "bg-[#FFF0F3] text-[#FF4D71] border border-[#FFCCD5]"
                        }`}
                      >
                        {ic.students.length} คน
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Preset Buttons (From Sample Image!) */}
          <div>
            <span className="text-xs font-bold text-[#857E9E] mb-2 block">
              เลือกรายวิชาที่สอนด่วน (ตามเอกสารตัวอย่าง):
            </span>
            <div className="flex flex-wrap gap-2">
              {presetCourses.map((c) => {
                const isSelected =
                  courseCode === c.code && courseName === c.name;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectPresetCourse(c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#8C78EA] text-white border-[#8C78EA] shadow-[0_4px_12px_rgba(140,120,234,0.35)]"
                        : "bg-[#FAF7FE] text-[#2B244D] border-[#E8DEF8] hover:bg-[#F3EEFA]"
                    }`}
                  >
                    <span className="font-mono mr-1.5">{c.code}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course Inputs Grid with Autocomplete */}
          <div ref={courseSearchContainerRef} className="relative pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#2B244D] block">
                    รหัสวิชา (Course Code)
                  </label>
                  {isSearchingCourse && activeSearchField === "code" ? (
                    <span className="text-[10px] text-[#8C78EA] flex items-center gap-1 font-semibold animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> ค้นหา...
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#857E9E]">
                      ศธ.02 อัตโนมัติ
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(e.target.value);
                    setActiveSearchField("code");
                  }}
                  onFocus={() => {
                    setActiveSearchField("code");
                    if (courseCode.trim().length >= 2 && courseSuggestions.length > 0) {
                      setShowCourseSuggestions(true);
                    }
                  }}
                  placeholder="เช่น 20000-1201"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8DEF8] bg-[#FAF7FE] font-mono font-bold text-sm text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white focus:ring-2 focus:ring-[#8C78EA]/20 transition-all shadow-xs"
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#2B244D] block">
                    ชื่อรายวิชา (Course Name)
                  </label>
                  {isSearchingCourse && activeSearchField === "name" ? (
                    <span className="text-[10px] text-[#8C78EA] flex items-center gap-1 font-semibold animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> ค้นหา...
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#857E9E]">
                      พิมพ์เพื่อค้นหา
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value);
                    setActiveSearchField("name");
                  }}
                  onFocus={() => {
                    setActiveSearchField("name");
                    if (courseName.trim().length >= 2 && courseSuggestions.length > 0) {
                      setShowCourseSuggestions(true);
                    }
                  }}
                  placeholder="เช่น ภาษาอังกฤษเพื่อการสื่อสาร"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8DEF8] bg-[#FAF7FE] font-bold text-sm text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white focus:ring-2 focus:ring-[#8C78EA]/20 transition-all shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#2B244D] block">
                    ครูผู้สอน (Teacher Name)
                  </label>
                  <span className="text-[10px] text-[#8C78EA] font-semibold">
                    (ดึงอัตโนมัติจากการ Login)
                  </span>
                </div>
                <div className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-2xl border border-[#E8DEF8] bg-[#FAF7FE] text-[#2B244D] font-bold text-sm shadow-xs select-none">
                  <div className="squircle-purple h-6 w-6 text-[11px] shrink-0">
                    {teacher.name.replace(/^(นาย|นางสาว|นาง|อ\.|อาจารย์|ครู)\s*/, "").charAt(0) || "ค"}
                  </div>
                  <span className="truncate">{teacher.name}</span>
                  <span className="ml-auto text-[10px] font-black py-0.5 px-2 rounded-full bg-[#EFEAF6] text-[#7A63E5] shrink-0">
                    ผู้สอน
                  </span>
                </div>
              </div>
            </div>

            {/* Course Suggestions Dropdown */}
            {showCourseSuggestions && courseSuggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 sm:right-auto sm:w-[620px] mt-2 bg-white rounded-2xl border border-[#E8DEF8] shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 bg-[#FAF7FE] border-b border-[#E8DEF8] flex items-center justify-between text-xs text-[#857E9E]">
                  <span className="flex items-center gap-1.5 font-bold text-[#7A63E5]">
                    <Sparkles className="w-3.5 h-3.5" />
                    พบคลังรายวิชา ศธ.02 ({courseSuggestions.length} รายการ)
                  </span>
                  <span className="text-[11px]">คลิกเพื่อเลือกใช้วิชานี้</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#F3EEFA]">
                  {courseSuggestions.map((c) => (
                    <button
                      key={c.id || c.code}
                      type="button"
                      onClick={() => handleSelectCourseSuggestion(c)}
                      className="w-full text-left px-4 py-3 hover:bg-[#FAF7FE] transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-black text-sm text-[#7A63E5] bg-[#EFEAF6] px-2 py-0.5 rounded-lg group-hover:bg-[#8C78EA] group-hover:text-white transition-colors">
                            {c.code}
                          </span>
                          <span className="font-bold text-sm text-[#2B244D]">
                            {c.name}
                          </span>
                        </div>
                        {c.nameEn && (
                          <p className="text-xs text-[#857E9E] font-medium italic mb-1">
                            {c.nameEn}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-[#857E9E]">
                          {c.curriculumYear && (
                            <span className="bg-[#FAF7FE] border border-[#E8DEF8] px-1.5 py-0.5 rounded text-[10px]">
                              หลักสูตร {c.curriculumYear}
                            </span>
                          )}
                          {c.subjectType && (
                            <span className="bg-[#FAF7FE] border border-[#E8DEF8] px-1.5 py-0.5 rounded text-[10px]">
                              {c.subjectType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#7A63E5] bg-[#FAF7FE] border border-[#E8DEF8] px-2.5 py-1 rounded-full inline-block">
                          {c.credits || 0} นก. ({c.theory || 0}-{c.practice || 0}-{c.credits || 0})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: SEARCH & ADD STUDENTS FROM COLLEGE REGISTRY        */}
        {/* ============================================================== */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EBF7] pb-3">
            <div className="flex items-center gap-2.5 text-[#2B244D] font-black text-base">
              <div className="squircle-pink h-8 w-8 shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <span>2. ค้นหาและเลือกนักเรียนที่ติด "ขร." จากฐานข้อมูลทั้งหมด</span>
            </div>
            <span className="text-xs text-[#857E9E] font-medium">
              ค้นหาจากรหัสนักศึกษา 11 หลัก, ชื่อ-สกุล หรือกลุ่มเรียน
            </span>
          </div>

          {/* Search Input Bar (Matching Pill Search Bar in Reference Image) */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#A79FC2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา เช่น '69201', 'อรรถชัย', 'พิชญา', 'ช่างยนต์', 'บัญชี'..."
              className="w-full pl-11 pr-20 py-2.5 rounded-full border border-[#E2D6F5] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] placeholder:text-[#A79FC2] focus:outline-none focus:border-[#8C78EA] focus:bg-white focus:ring-2 focus:ring-[#8C78EA]/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3 text-xs text-[#A79FC2] hover:text-[#2B244D] font-bold"
              >
                ล้างคำค้น
              </button>
            )}
          </div>

          {/* Search Results Dropdown List */}
          {searchQuery && (
            <div className="rounded-2xl border border-[#E2D6F5] bg-[#FAF7FE] p-3 space-y-2 max-h-64 overflow-y-auto">
              <div className="text-xs font-bold text-[#857E9E] flex items-center justify-between px-1">
                <span>ผลการค้นหา ({searchResults.length} คน):</span>
                <span className="text-[11px] text-[#A79FC2]">
                  คลิกปุ่ม "➕ เพิ่ม" เพื่อใส่ลงในบัญชี ขร.
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#857E9E] bg-white rounded-xl border border-[#EAE3F5]">
                  ไม่พบข้อมูลนักเรียนที่ตรงกับ "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchResults.map((std) => {
                    const isAdded = khorRorList.some(
                      (e) => e.student.studentId === std.studentId
                    );
                    return (
                      <div
                        key={std.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EAE3F5] hover:border-[#8C78EA]/50 transition-all shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-[#7A63E5]">
                              {std.studentId}
                            </span>
                            <span className="font-bold text-xs text-[#2B244D]">
                              {cleanThaiText(std.prefix)}
                              {cleanThaiText(std.firstName)} {cleanThaiText(std.lastName)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#857E9E] mt-0.5">
                            {cleanThaiText(std.level)}/{std.classGroup.includes('/') ? cleanThaiText(std.classGroup.split('/')[1]) : '1'} {cleanThaiText(std.department)}
                          </div>
                        </div>

                        {isAdded ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            ✓ เพิ่มแล้ว
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddStudent(std)}
                            className="btn-clay-pink text-white text-xs px-3 py-1 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            เพิ่ม
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: ACTIVE KHOR-ROR LIST TABLE                         */}
        {/* ============================================================== */}
        <div className="space-y-4">
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-black text-[#2B244D] flex items-center gap-2">
                <span>บัญชีรายชื่อผู้เรียนที่ได้รับผลการเรียน "ขร."</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-black bg-[#FFF0F3] text-[#FF4D71] border border-[#FFCCD5]">
                  {khorRorList.length} คน
                </span>
              </h2>
              <p className="text-xs text-[#857E9E] font-medium mt-0.5">
                รหัสวิชา {courseCode} วิชา {courseName} | ครูผู้สอน {teacherName}
              </p>
            </div>

            {/* Batch Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={khorRorList.length === 0}
                onClick={() => setIsMemoModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D8CCED] bg-white px-4 py-2 text-xs font-bold text-[#7A63E5] hover:bg-[#F3EEFA] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>🖨️ พิมพ์ประกาศ ขร.</span>
              </button>

              <button
                type="button"
                disabled={khorRorList.length === 0}
                onClick={handleSubmitToAdmin}
                className="btn-clay-purple px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>ส่งรายชื่อ ขร. ไปยังงานวัดผล</span>
              </button>

              {khorRorList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setKhorRorList([])}
                  className="text-xs text-[#FF6885] hover:text-[#FF3860] font-bold underline px-2 py-1 cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* Khor Ror Students Table (Matching Photo Column Structure!) */}
          <div className="clay-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3EEFA] text-[#2B244D] font-black border-b border-[#EAE3F5]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">ที่</th>
                  <th className="py-3 px-4 w-36 text-center">รหัสประจำตัว</th>
                  <th className="py-3 px-4 min-w-[200px]">ชื่อ - สกุล</th>
                  <th className="py-3 px-4 w-48">แผนกวิชา/กลุ่ม</th>
                  <th className="py-3 px-4 min-w-[220px]">หมายเหตุ (แก้ไขได้)</th>
                  <th className="py-3 px-4 w-20 text-center">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EBF7]">
                {khorRorList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center text-[#A79FC2]">
                        <Users className="h-8 w-8 text-[#C8BFE0] mb-2" />
                        <p className="text-sm font-bold text-[#2B244D]">
                          ยังไม่มีรายชื่อผู้ได้รับเกรด "ขร." ในวิชานี้
                        </p>
                        <p className="text-xs text-[#857E9E] mt-1">
                          ใช้ช่องค้นหาด้านบนเพื่อเลือกนักเรียนที่ติด ขร. หรือคลิก "นำเข้าข้อมูล ศธ.02"
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  khorRorList.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-purple-50/40 transition-colors">
                      {/* Column 1: ที่ */}
                      <td className="py-3 px-4 text-center font-bold text-[#857E9E] text-xs">
                        {idx + 1}
                      </td>

                      {/* Column 2: รหัสประจำตัว */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#7A63E5] text-xs">
                        {entry.student.studentId}
                      </td>

                      {/* Column 3: ชื่อ - สกุล */}
                      <td className="py-3 px-4 font-bold text-[#2B244D] text-sm">
                        {cleanThaiText(entry.student.prefix)}
                        {cleanThaiText(entry.student.firstName)} {cleanThaiText(entry.student.lastName)}
                      </td>

                      {/* Column 4: แผนกวิชา/กลุ่ม (e.g. ปวช.1/1 ช่างยนต์, ปวส.1/1 บัญชี) */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-xs font-bold text-[#2B244D] bg-[#F3EEFA] px-2.5 py-1 rounded-full border border-[#EAE3F5]">
                          {cleanThaiText(entry.student.level)}/{entry.student.classGroup.includes('/') ? cleanThaiText(entry.student.classGroup.split('/')[1]) : '1'} {cleanThaiText(entry.student.department)}
                        </span>
                      </td>

                      {/* Column 5: หมายเหตุ (Inline editable) */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={entry.remark}
                          onChange={(e) =>
                            handleUpdateRemark(entry.id, e.target.value)
                          }
                          placeholder="ระบุหมายเหตุ เช่น ขาดเรียนเกิน 20%..."
                          className="w-full text-xs font-bold border border-[#E8DEF8] rounded-xl px-2.5 py-1.5 bg-[#FAF7FE] text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white"
                        />
                      </td>

                      {/* Column 6: ลบออกจากรายการ */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(entry.id)}
                          title="ลบออกจากรายการ ขร."
                          className="p-1.5 text-[#A79FC2] hover:text-[#FF6885] hover:bg-[#FFF0F3] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Official Thai Government Memorandum & Table Report Modal */}
      <OfficialMemoModal
        isOpen={isMemoModalOpen}
        onClose={() => setIsMemoModalOpen(false)}
        course={currentCourseObject}
        teacher={{
          ...mockTeacher,
          name: teacherName,
        }}
        students={modalStudents}
      />

      {/* ศธ.02 ออนไลน์ API / SQL / Excel Sync Modal */}
      <Std02SyncModal
        isOpen={isStd02ModalOpen}
        onClose={() => setIsStd02ModalOpen(false)}
        onSyncComplete={(count) => {
          setNotification({
            type: "success",
            message: `นำเข้าข้อมูลเรียบร้อยแล้ว (อัปเดตข้อมูล ${count} รายการ)`,
          });
          setTimeout(() => setNotification(null), 4000);
        }}
        onImportCourse={(c) => {
          setCourseCode(c.code);
          setCourseName(c.name);
        }}
        onImportStudents={(imported) => {
          if (imported && imported.length > 0) {
            const newEntries = imported.map((std, idx) => ({
              id: `imp-${Date.now()}-${std.studentId}-${idx}`,
              student: std,
              remark: "หมดสิทธิ์สอบ (ขร.)",
              addedAt: "19 ก.ย. 2567",
            }));
            setKhorRorList(newEntries);
          }
        }}
        onImportAllCourses={(data) => {
          setCurrentTerm(data.term);
          setCurrentAcademicYear(data.academicYear);
          setImportedCourses(data.courses);

          if (data.courses.length > 0) {
            // Set active to first course
            const firstCourse = data.courses[0];
            setCourseCode(firstCourse.courseCode);
            setCourseName(firstCourse.courseName);

            // Populate all students from first course (or all courses)
            const entries: KhorRorEntry[] = firstCourse.students.map((s, idx) => ({
              id: `excel-${firstCourse.courseCode}-${s.studentId}-${idx}`,
              student: {
                id: `std-${s.studentId}`,
                studentId: s.studentId,
                prefix: s.prefix,
                firstName: s.firstName,
                lastName: s.lastName,
                level: s.level,
                department: s.department,
                classGroup: s.classGroup,
              },
              remark: s.remark || "หมดสิทธิ์สอบ (ขร.)",
              addedAt: "19 ก.ย. 2567",
            }));
            setKhorRorList(entries);
          }

          setNotification({
            type: "success",
            message: `นำเข้าข้อมูลทั้งหมดครบถ้วน (${data.courses.length} รายวิชา / รวม ${data.allStudents.length} คน) ภาคเรียนที่ ${data.term}/${data.academicYear} เรียบร้อยแล้ว`,
          });
          setTimeout(() => setNotification(null), 5000);
        }}
      />

      {/* Term and Academic Year Setting Modal */}
      <TermYearSettingModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        currentTerm={currentTerm}
        currentAcademicYear={currentAcademicYear}
        onSave={(term, year) => {
          setCurrentTerm(term);
          setCurrentAcademicYear(year);
          setNotification({
            type: "success",
            message: `เปลี่ยนการตั้งค่าเป็น ภาคเรียนที่ ${term === 3 ? "ฤดูร้อน" : term} ปีการศึกษา ${year} เรียบร้อยแล้ว`,
          });
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* Missing Department Popup Modal (บังคับให้ระบุแผนกวิชาหากไม่มีในระบบ) */}
      <MissingDepartmentModal
        isOpen={isMissingDeptOpen}
        teacherName={teacher.name}
        teacherEmail={teacher.email}
        onSave={(newDept) => {
          setTeacher((prev) => ({
            ...prev,
            department: newDept,
          }));
          setIsMissingDeptOpen(false);
          setNotification({
            type: "success",
            message: `บันทึกข้อมูลสังกัด "${newDept}" เรียบร้อยแล้ว`,
          });
          setTimeout(() => setNotification(null), 4000);
        }}
      />
    </div>
  );
}
