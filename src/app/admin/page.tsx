"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Search,
  Printer,
  ChevronRight,
  Filter,
  AlertTriangle,
  Send,
  Eye,
  Check,
  X,
  Database,
  FileSpreadsheet,
  Heart,
  Sparkles,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/dialog";
import { OfficialMemoModal } from "@/components/dashboard/OfficialMemoModal";
import { Std02SyncModal } from "@/components/dashboard/Std02SyncModal";
import { TermYearSettingModal } from "@/components/dashboard/TermYearSettingModal";
import {
  mockAdmin,
  mockTeacher,
  mockSubmissions,
  mockCourses,
  mockStudentAttendances,
} from "@/data/mock-data";
import Link from "next/link";
import { KhorRorSubmissionSummary, StudentAttendance } from "@/types";
import { cleanThaiText, getAssetPath } from "@/lib/utils";

export interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  coursesCount: number;
  studentsCount: number;
  submissionIds: string[];
}

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState(mockAdmin);

  useEffect(() => {
    async function loadAdminSession() {
      try {
        const res = await fetch(getAssetPath("/api/auth/me"));
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAdmin((prev) => ({
              ...prev,
              name: data.user.name || "ผู้ดูแลระบบ",
              email: data.user.email || prev.email,
              department: data.user.department || prev.department,
            }));
          }
        }
      } catch (e) {
        console.warn("Could not load admin session:", e);
      }
    }
    loadAdminSession();
  }, []);
  const [currentTerm, setCurrentTerm] = useState<number>(1);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<number>(2569);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Import Batches Tracking (User can rollback / delete imported files from database)
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "batch" | "submission" | "student" | "all_imported";
    id?: string;
    batchId?: string;
    title: string;
    message: string;
  } | null>(null);

  const [submissions, setSubmissions] =
    useState<KhorRorSubmissionSummary[]>(mockSubmissions);
  const [activeTab, setActiveTab] = useState<"inbox" | "all_students">("inbox");
  const [selectedSubmission, setSelectedSubmission] =
    useState<KhorRorSubmissionSummary | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [classGroupFilter, setClassGroupFilter] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isStd02ModalOpen, setIsStd02ModalOpen] = useState(false);

  // Statistics
  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter(
    (s) => s.status === "APPROVED"
  ).length;
  const totalKhorRorStudents = submissions.reduce(
    (acc, curr) => acc + curr.studentCount,
    0
  );

  // Collect all Khor-Ror students across all submissions
  const allKhorRorStudents = useMemo(() => {
    const list: {
      attendance: StudentAttendance;
      courseCode: string;
      courseName: string;
      teacherName: string;
      submissionStatus: string;
    }[] = [];

    submissions.forEach((sub) => {
      sub.students.forEach((std) => {
        list.push({
          attendance: std,
          courseCode: sub.courseCode,
          courseName: sub.courseName,
          teacherName: sub.teacherName,
          submissionStatus: sub.status,
        });
      });
    });

    return list;
  }, [submissions]);

  // Dynamically extract all available departments from system & imported files
  const availableDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    allKhorRorStudents.forEach((item) => {
      const d = cleanThaiText(item.attendance.student.department);
      if (d && d !== "-") deptSet.add(d);
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, "th"));
  }, [allKhorRorStudents]);

  // Dynamically extract all available levels and class groups from system & imported files
  const availableClassGroups = useMemo(() => {
    const levels = new Set<string>();
    const groups = new Set<string>();

    allKhorRorStudents.forEach((item) => {
      const lvl = cleanThaiText(item.attendance.student.level);
      const grp = cleanThaiText(item.attendance.student.classGroup);
      if (lvl && lvl !== "-") levels.add(lvl);
      if (grp && grp !== "-") groups.add(grp);
    });

    return {
      levels: Array.from(levels).sort((a, b) => a.localeCompare(b, "th")),
      groups: Array.from(groups).sort((a, b) => a.localeCompare(b, "th")),
    };
  }, [allKhorRorStudents]);

  // Filtered all-students list
  const filteredStudents = useMemo(() => {
    return allKhorRorStudents.filter((item) => {
      const std = item.attendance.student;

      // Text search: matches studentId, name, course code/name, department, level, or class group
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = std.studentId.toLowerCase().includes(q);
        const matchName = `${cleanThaiText(std.prefix)}${cleanThaiText(std.firstName)} ${cleanThaiText(std.lastName)}`
          .toLowerCase()
          .includes(q);
        const matchCourse = `${item.courseCode} ${cleanThaiText(item.courseName)}`.toLowerCase().includes(q);
        const matchDept = cleanThaiText(std.department).toLowerCase().includes(q);
        const matchLevel = cleanThaiText(std.level).toLowerCase().includes(q);
        const matchGroup = cleanThaiText(std.classGroup).toLowerCase().includes(q);

        if (!matchId && !matchName && !matchCourse && !matchDept && !matchLevel && !matchGroup) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter) {
        if (cleanThaiText(std.department) !== departmentFilter) {
          return false;
        }
      }

      // Level / Class Group filter
      if (classGroupFilter) {
        const stdLevel = cleanThaiText(std.level);
        const stdGroup = cleanThaiText(std.classGroup);
        const matchLevel = stdLevel === classGroupFilter;
        const matchGroup = stdGroup === classGroupFilter || stdGroup.startsWith(classGroupFilter);
        if (!matchLevel && !matchGroup) {
          return false;
        }
      }

      return true;
    });
  }, [allKhorRorStudents, searchQuery, departmentFilter, classGroupFilter]);

  // Handle Approve Submission
  const handleApproveSubmission = (subId: string) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === subId ? { ...sub, status: "APPROVED" } : sub
      )
    );
    setIsReviewModalOpen(false);
    setNotification(
      "อนุมัติบันทึกข้อความขอประกาศ ขร. และบันทึกลงระบบทะเบียนเรียบร้อยแล้ว"
    );
    setTimeout(() => setNotification(null), 5000);
  };

  // Delete an entire imported batch from the system and database (User Requested Rollback)
  const handleDeleteBatch = (batchId: string) => {
    const batch = importBatches.find((b) => b.id === batchId);
    if (!batch) return;

    setSubmissions((prev) => prev.filter((s) => !batch.submissionIds.includes(s.id)));
    setImportBatches((prev) => prev.filter((b) => b.id !== batchId));
    setNotification(
      `🗑️ ลบไฟล์ข้อมูล "${batch.fileName}" ออกจากระบบและฐานข้อมูลเรียบร้อยแล้ว (ลบ ${batch.coursesCount} รายวิชา / รวม ${batch.studentsCount} คน)`
    );
    setTimeout(() => setNotification(null), 6000);
  };

  // Clear all imported data (purges all submissions created via import or starting with sub-excel-)
  const handleClearAllImports = () => {
    const batchSubIds = importBatches.flatMap((b) => b.submissionIds);
    setSubmissions((prev) =>
      prev.filter((s) => !batchSubIds.includes(s.id) && !s.id.startsWith("sub-excel-"))
    );
    setImportBatches([]);
    setNotification("🗑️ ลบข้อมูลที่นำเข้าทั้งหมดออกจากระบบและฐานข้อมูลเรียบร้อยแล้ว คืนค่าสถิติสู่ปกติ");
    setTimeout(() => setNotification(null), 6000);
  };

  // Delete a single submission/course
  const handleDeleteSubmission = (subId: string) => {
    const subToDelete = submissions.find((s) => s.id === subId);
    setSubmissions((prev) => prev.filter((s) => s.id !== subId));
    setImportBatches((prev) =>
      prev
        .map((b) => ({
          ...b,
          submissionIds: b.submissionIds.filter((id) => id !== subId),
        }))
        .filter((b) => b.submissionIds.length > 0)
    );
    setNotification(
      `🗑️ ลบรายการวิชา "${subToDelete?.courseCode || ""} ${subToDelete?.courseName || ""}" และรายชื่อ ขร. ทั้งหมดออกจากระบบเรียบร้อยแล้ว`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  // Delete a single student from a course submission
  const handleDeleteStudent = (studentId: string, courseCode: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.courseCode === courseCode) {
          const updated = sub.students.filter((s) => s.student.studentId !== studentId);
          return {
            ...sub,
            studentCount: updated.length,
            students: updated,
          };
        }
        return sub;
      })
    );
    setNotification(`🗑️ ลบนักศึกษารหัส ${studentId} ออกจากรายชื่อ ขร. วิชา ${courseCode} เรียบร้อยแล้ว`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F8F5FD]">
      {/* ================= Header (Soft Lavender Gradient) ================= */}
      <header className="sticky top-0 z-30 w-full border-b border-purple-200/40 bg-gradient-to-r from-[#9D8DF1] via-[#8B77EB] to-[#7A63E5] text-white shadow-[0_6px_24px_rgba(139,119,235,0.22)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-2 ring-white/50 flex items-center justify-center shrink-0">
              <img
                src={getAssetPath("/logo.png")}
                alt="วิทยาลัยสารพัดช่างน่าน"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wide text-white drop-shadow-xs">
                  NPC ClassPass
                </span>
                <span className="text-[10px] font-black py-0.5 px-2 rounded-full bg-white/20 text-white border border-white/20">
                  งานวัดผลและประเมินผล
                </span>
              </div>
              <p className="text-[11px] text-purple-100 font-medium hidden sm:block">
                ระบบจัดการและตรวจสอบการประกาศหมดสิทธิ์สอบ (ขร.) | วิทยาลัยสารพัดช่างน่าน
              </p>
            </div>
          </div>

          {/* Academic Year (Clickable to change settings) */}
          <button
            type="button"
            onClick={() => setIsTermModalOpen(true)}
            title="คลิกเพื่อตั้งค่าภาคเรียนและปีการศึกษา"
            className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/15 hover:bg-white/25 hover:border-white/40 px-3.5 py-1 text-xs text-white font-bold backdrop-blur-xs shadow-xs transition-all cursor-pointer group"
          >
            <Calendar className="h-3.5 w-3.5 text-yellow-300 group-hover:scale-110 transition-transform" />
            <span>ภาคเรียนที่ {currentTerm === 3 ? "ฤดูร้อน" : currentTerm}</span>
            <span className="text-white/40">|</span>
            <span>ปีการศึกษา {currentAcademicYear}</span>
            <span className="text-[10px] bg-white/20 text-purple-100 group-hover:text-white px-1.5 py-0.2 rounded-md transition-colors ml-0.5">
              เปลี่ยน
            </span>
          </button>

          {/* Admin Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-black text-white">
                  {admin.name}
                </span>
                <span className="rounded-full bg-white/20 text-white text-[10px] font-black px-2 py-0.5 border border-white/20">
                  ADMIN
                </span>
              </div>
              <span className="text-xs text-purple-100">{admin.department}</span>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#7A63E5] font-black text-sm shadow-[0_4px_10px_rgba(0,0,0,0.12)] ring-2 ring-white/60">
              วผ
            </div>

            {/* Switch to Teacher Mode */}
            <Link
              href="/teacher"
              className="text-xs text-white hover:bg-white/20 font-bold hidden lg:inline-block border border-white/25 rounded-full px-3 py-1 transition-colors"
            >
              ดูมุมมองครูผู้สอน &rarr;
            </Link>

            {/* Logout */}
            <a
              href={getAssetPath("/api/auth/logout")}
              title="ออกจากระบบ"
              className="p-2 text-purple-100 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ================= Main Content ================= */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* High-Visibility Notification Alert Toast */}
        {notification && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-3xl border bg-gradient-to-r from-[#EDFBF5] via-[#E4F8EE] to-[#EDFBF5] text-[#1E7250] border-[#A8E7CC] shadow-[0_8px_24px_rgba(30,114,80,0.12)] animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 border border-[#B7EED8]">
                {notification.includes("🗑️") ? (
                  <Trash2 className="h-5 w-5 text-[#FF4D71]" />
                ) : notification.includes("🔄") ? (
                  <RotateCcw className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#1E7250] leading-snug">
                {notification}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#1E7250] transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3F5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2B244D]">
              แดชบอร์ดงานวัดผลและประเมินผล (Admin Evaluation)
            </h1>
            <p className="text-xs sm:text-sm text-[#857E9E] font-medium mt-1">
              ตรวจสอบกลั่นกรองบันทึกข้อความ ขร. ที่ครูผู้สอนส่งเข้ามา และลงนามอนุมัติเพื่อประกาศผลในระบบทะเบียน
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              <Database className="h-4 w-4 text-[#8C78EA]" />
              <span>นำเข้าข้อมูล ศธ.02 (API / SQL)</span>
            </button>
            <span className="rounded-full bg-[#EFEAF6] text-[#7A63E5] border border-[#D8CCED] text-xs font-black px-3 py-1.5">
              ADMIN
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4 OVERVIEW STAT CARDS (Exact match to Reference Image!)        */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Songs Played -> ครูส่งเข้ามา (Purple Squircle) */}
          <div className="clay-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#857E9E]">
                รายการที่ครูส่งเข้ามา
              </span>
              <div className="squircle-purple h-10 w-10 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#2B244D]">
                {submissions.length}
              </span>
              <span className="text-xs text-[#857E9E] font-bold">ฉบับ</span>
            </div>
            <p className="mt-1 text-[11px] text-[#8C78EA] font-bold">
              ✓ ครอบคลุมทุกแผนกวิชา
            </p>
          </div>

          {/* Card 2: Favorites -> รอตรวจสอบ/อนุมัติ (Warm Amber Squircle) */}
          <div className="clay-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#857E9E]">
                รอตรวจสอบ / อนุมัติ
              </span>
              <div className="squircle-amber h-10 w-10 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#FFAB47]">
                {pendingCount}
              </span>
              <span className="text-xs text-[#857E9E] font-bold">ฉบับ</span>
            </div>
            <p className="mt-1 text-[11px] text-[#FFAB47] font-bold">
              ● ต้องตรวจและลงนาม
            </p>
          </div>

          {/* Card 3: Hours Listened -> อนุมัติประกาศแล้ว (Sky Blue Squircle) */}
          <div className="clay-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#857E9E]">
                อนุมัติประกาศ ขร. แล้ว
              </span>
              <div className="squircle-blue h-10 w-10 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#5CB9F8]">
                {approvedCount}
              </span>
              <span className="text-xs text-[#857E9E] font-bold">ฉบับ</span>
            </div>
            <p className="mt-1 text-[11px] text-[#5CB9F8] font-bold">
              ✓ ส่งผลให้ทะเบียนกลางแล้ว
            </p>
          </div>

          {/* Card 4: Current Streak -> นักเรียนติด ขร. ทั้งหมด (Coral Pink Squircle) */}
          <div className="clay-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#857E9E]">
                นักศึกษาติด ขร. ทั้งหมด
              </span>
              <div className="squircle-pink h-10 w-10 shrink-0">
                <Heart className="h-5 w-5 fill-white" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#FF708C]">
                {totalKhorRorStudents}
              </span>
              <span className="text-xs text-[#857E9E] font-bold">คน</span>
            </div>
            <p className="mt-1 text-[11px] text-[#FF708C] font-bold">
              ● เวลาเรียนต่ำกว่า 80%
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* IMPORTED FILES MANAGEMENT & ROLLBACK (User Requested Feature)  */}
        {/* ============================================================== */}
        {(importBatches.length > 0 || submissions.some((s) => s.id.startsWith("sub-excel-"))) && (
          <div className="clay-card p-5 border border-purple-200 bg-gradient-to-r from-[#FAF8FE] via-white to-[#F5EFFF] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE8F8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="squircle-purple h-9 w-9 text-white shrink-0 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#2B244D]">
                    จัดการชุดข้อมูลที่นำเข้าล่าสุด (Imported File Management &amp; Rollback)
                  </h3>
                  <p className="text-xs text-[#857E9E]">
                    หากนำเข้าผิดพลาดหรือมีข้อมูลซ้ำซ้อน สามารถกดลบไฟล์ข้อมูลชุดนี้ออกจากฐานข้อมูลทั้งหมดได้ทันที
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    type: "all_imported",
                    title: "ยืนยันการลบข้อมูลที่นำเข้าทั้งหมดออกจากระบบ",
                    message:
                      "ระบบจะทำการล้างและลบรายวิชาทั้งหมดที่นำเข้ามาจากไฟล์ Excel ออกจากฐานข้อมูลงานวัดผล (ข้อมูลระบบเดิมจะไม่ได้รับผลกระทบ)",
                  })
                }
                className="px-3.5 py-1.5 rounded-full border border-[#FFCCD5] bg-[#FFF0F3] hover:bg-[#FFE5EB] text-[#FF4D71] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ลบข้อมูลที่นำเข้าทั้งหมด (Clear All Imports)</span>
              </button>
            </div>

            {/* List of Batches */}
            <div className="space-y-2">
              {importBatches.length > 0 ? (
                importBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-[#EAE3F5] shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-[#F3EEFA] text-[#7A63E5]">
                        <FileSpreadsheet className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="font-bold text-xs text-[#2B244D] block">
                          {batch.fileName}
                        </span>
                        <span className="text-[11px] text-[#857E9E] font-medium">
                          นำเข้าเมื่อ: {batch.importedAt} • {batch.coursesCount} รายวิชา • รวม {batch.studentsCount} คน
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "batch",
                          batchId: batch.id,
                          title: `ยืนยันการลบไฟล์ "${batch.fileName}"`,
                          message: `ระบบจะทำการลบข้อมูลทั้งหมดที่นำเข้ามาในชุดนี้ (${batch.coursesCount} รายวิชา, นักศึกษาติด ขร. รวม ${batch.studentsCount} คน) ออกจากฐานข้อมูลทั้งหมดทันที`,
                        })
                      }
                      className="px-3 py-1.5 rounded-full border border-[#FFCCD5] text-[#FF4D71] hover:bg-[#FFF0F3] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบไฟล์ข้อมูลชุดนี้ (Rollback)</span>
                    </button>
                  </div>
                ))
              ) : (
                /* Fallback if imported items exist without batch metadata */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-[#EAE3F5]">
                  <span className="text-xs font-bold text-[#2B244D]">
                    พบข้อมูลนำเข้าจากไฟล์ Excel ในระบบ ({submissions.filter((s) => s.id.startsWith("sub-excel-")).length} รายวิชา)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        type: "all_imported",
                        title: "ยืนยันการลบข้อมูลที่นำเข้าจาก Excel ทั้งหมด",
                        message: "ระบบจะลบรายวิชาที่นำเข้าจากไฟล์ Excel ออกจากฐานข้อมูลทั้งหมดทันที",
                      })
                    }
                    className="px-3 py-1.5 rounded-full border border-[#FFCCD5] text-[#FF4D71] hover:bg-[#FFF0F3] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบข้อมูลชุดที่นำเข้าออก</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TABS CONTROL (Pill Style)                                      */}
        {/* ============================================================== */}
        <div className="inline-flex rounded-full bg-[#F3EEFA] p-1 border border-[#EAE3F5]">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-5 py-2 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "inbox"
                ? "bg-[#8C78EA] text-white shadow-[0_4px_12px_rgba(140,120,234,0.35)]"
                : "text-[#857E9E] hover:text-[#2B244D]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>กล่องบันทึกข้อความที่ครูส่งมา ({submissions.length})</span>
            {pendingCount > 0 && (
              <span className="bg-[#FFA0B2] text-white rounded-full text-[10px] px-2 py-0.2 font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all_students")}
            className={`px-5 py-2 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "all_students"
                ? "bg-[#8C78EA] text-white shadow-[0_4px_12px_rgba(140,120,234,0.35)]"
                : "text-[#857E9E] hover:text-[#2B244D]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>รายชื่อนักเรียน ขร. รวมทั้งวิทยาลัย ({allKhorRorStudents.length})</span>
          </button>
        </div>

        {/* TAB 1: Submissions Inbox */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((sub) => {
                const isPending = sub.status === "PENDING";
                const isExcelImported = sub.id.startsWith("sub-excel-");
                return (
                  <div
                    key={sub.id}
                    className="clay-card p-5 flex flex-col justify-between relative group"
                  >
                    <div>
                      {/* Status, Tag, and Memo Number */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#857E9E]">
                            {sub.memoNumber}
                          </span>
                          {isExcelImported && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-purple-50 text-[#7A63E5] border border-purple-200">
                              Excel
                            </span>
                          )}
                        </div>
                        {isPending ? (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FFF8F0] text-[#FFAB5E] border border-[#FFE0C2]">
                            รอตรวจสอบ
                          </span>
                        ) : (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EDFBF5] text-[#52C79E] border border-[#B7EED8]">
                            อนุมัติแล้ว
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-[#7A63E5] bg-[#F3EEFA] px-2.5 py-0.5 rounded-full">
                          {sub.courseCode}
                        </span>
                        <h3 className="font-black text-base text-[#2B244D] pt-1.5 line-clamp-1">
                          {cleanThaiText(sub.courseName)}
                        </h3>
                        <p className="text-xs text-[#857E9E]">
                          ครูผู้สอน: <span className="font-bold text-[#2B244D]">{cleanThaiText(sub.teacherName)}</span> ({cleanThaiText(sub.teacherDepartment)})
                        </p>
                      </div>

                      {/* Student Count & Time */}
                      <div className="mt-4 p-3 rounded-2xl bg-[#FAF7FE] border border-[#EAE3F5] flex items-center justify-between text-xs">
                        <span className="text-[#857E9E] font-medium">
                          ผู้เรียนที่เสนอ ขร. :
                        </span>
                        <span className="font-black text-[#FF6885] text-sm">
                          {sub.studentCount} คน
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-[#F0EBF7] flex items-center gap-2">
                      <button
                        type="button"
                        className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isPending
                            ? "btn-clay-purple"
                            : "border border-[#D8CCED] bg-white text-[#7A63E5] hover:bg-[#F3EEFA]"
                        }`}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsReviewModalOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{isPending ? "ตรวจสอบ & อนุมัติ" : "ดูรายละเอียด"}</span>
                      </button>

                      {/* Delete Submission Button (User Requested Feature) */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "submission",
                            id: sub.id,
                            title: "ยืนยันการลบรายการวิชาออกจากระบบ",
                            message: `ต้องการลบรายการวิชา "${sub.courseCode} ${sub.courseName}" (ครูผู้สอน: ${sub.teacherName}) พร้อมนักศึกษาติด ขร. ทั้งหมดในวิชานี้ (${sub.studentCount} คน) ออกจากฐานข้อมูลทั้งหมดหรือไม่?`,
                          })
                        }
                        title="ลบรายการวิชานี้ออกจากฐานข้อมูล"
                        className="p-2 rounded-full border border-[#FFCCD5] bg-white text-[#FF4D71] hover:bg-[#FFF0F3] transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: All Khor Ror Students Table */}
        {activeTab === "all_students" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="clay-card p-4 space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#A79FC2]" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ, นามสกุล, รายวิชา, แผนก, หรือกลุ่มเรียน..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 rounded-full border border-[#E2D6F5] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] placeholder:text-[#A79FC2] focus:outline-none focus:border-[#8C78EA] focus:bg-white transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-[#A79FC2] hover:text-[#2B244D] font-bold cursor-pointer"
                      title="ล้างคำค้นหา"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown 1: แผนกวิชา (ดึงอัตโนมัติจากไฟล์นำเข้าและระบบ) */}
                <div className="w-full lg:w-56">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-full border border-[#E2D6F5] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white transition-all shadow-xs cursor-pointer"
                  >
                    <option value="">🏢 ทุกแผนกวิชา ({allKhorRorStudents.length} คน)</option>
                    {availableDepartments.map((dept) => {
                      const count = allKhorRorStudents.filter(
                        (s) => cleanThaiText(s.attendance.student.department) === dept
                      ).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({count} คน)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dropdown 2: ระดับชั้น / กลุ่มเรียน (ดึงอัตโนมัติจากไฟล์นำเข้าและระบบ) */}
                <div className="w-full lg:w-56">
                  <select
                    value={classGroupFilter}
                    onChange={(e) => setClassGroupFilter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-full border border-[#E2D6F5] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white transition-all shadow-xs cursor-pointer"
                  >
                    <option value="">🎓 ทุกระดับ/กลุ่มเรียน</option>
                    {availableClassGroups.levels.length > 0 && (
                      <optgroup label="── แยกตามระดับชั้น ──">
                        {availableClassGroups.levels.map((lvl) => {
                          const count = allKhorRorStudents.filter(
                            (s) => cleanThaiText(s.attendance.student.level) === lvl
                          ).length;
                          return (
                            <option key={`lvl-${lvl}`} value={lvl}>
                              ระดับ {lvl} ({count} คน)
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {availableClassGroups.groups.length > 0 && (
                      <optgroup label="── แยกตามกลุ่มเรียน ──">
                        {availableClassGroups.groups.map((grp) => {
                          const count = allKhorRorStudents.filter(
                            (s) => cleanThaiText(s.attendance.student.classGroup) === grp
                          ).length;
                          return (
                            <option key={`grp-${grp}`} value={grp}>
                              กลุ่ม {grp} ({count} คน)
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Clear Filters Button (When active) */}
                {(searchQuery || departmentFilter || classGroupFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setDepartmentFilter("");
                      setClassGroupFilter("");
                    }}
                    className="px-3.5 py-2 rounded-full border border-[#FFCCD5] text-[#FF4D71] hover:bg-[#FFF0F3] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                    title="ล้างตัวกรองทั้งหมด"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}

                {/* Print Report Button */}
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D8CCED] bg-white px-4 py-2 text-xs font-bold text-[#7A63E5] hover:bg-[#F3EEFA] transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>🖨️ พิมพ์รายงานสรุป ({filteredStudents.length})</span>
                </button>
              </div>

              {/* Active Filter Tags & Count Bar */}
              {(searchQuery || departmentFilter || classGroupFilter) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F0EBF7] text-xs">
                  <span className="text-[#857E9E] font-medium">ตัวกรองที่เลือก:</span>
                  {departmentFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EEFA] text-[#7A63E5] border border-[#D8CCED] font-bold text-[11px]">
                      🏢 แผนก: {departmentFilter}
                      <button
                        type="button"
                        onClick={() => setDepartmentFilter("")}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {classGroupFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EEFA] text-[#7A63E5] border border-[#D8CCED] font-bold text-[11px]">
                      🎓 ระดับ/กลุ่ม: {classGroupFilter}
                      <button
                        type="button"
                        onClick={() => setClassGroupFilter("")}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7FE] text-[#2B244D] border border-[#E2D6F5] font-bold text-[11px]">
                      🔍 ค้นหา: "{searchQuery}"
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <span className="text-[11px] text-emerald-600 font-bold ml-auto">
                    พบ {filteredStudents.length} คน (จากทั้งหมด {allKhorRorStudents.length} คน)
                  </span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="clay-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3EEFA] text-[#2B244D] font-black border-b border-[#EAE3F5]">
                    <tr>
                    <th className="py-3 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-3 px-3 w-32">รหัสนักศึกษา</th>
                    <th className="py-3 px-3">ชื่อ - สกุล</th>
                    <th className="py-3 px-3 w-28">ระดับ/กลุ่ม</th>
                    <th className="py-3 px-3 w-36">แผนกวิชา</th>
                    <th className="py-3 px-3">รายวิชาที่ติด ขร.</th>
                    <th className="py-3 px-3 w-28 text-center">สถานะวัดผล</th>
                    <th className="py-3 px-3 w-16 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBF7]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-32 text-center text-[#857E9E]">
                        ไม่พบข้อมูลนักเรียนที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((item, idx) => (
                      <tr key={`${item.attendance.id}-${idx}`} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-center text-xs text-[#857E9E] font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-bold text-[#7A63E5]">
                          {item.attendance.student.studentId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#2B244D] text-sm">
                          {cleanThaiText(item.attendance.student.prefix)}
                          {cleanThaiText(item.attendance.student.firstName)}{" "}
                          {cleanThaiText(item.attendance.student.lastName)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[#5D5775]">
                          {cleanThaiText(item.attendance.student.level)} ({cleanThaiText(item.attendance.student.classGroup)})
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[#5D5775]">
                          {cleanThaiText(item.attendance.student.department)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#2B244D]">
                              {item.courseCode}
                            </span>
                            <span className="text-[11px] text-[#857E9E]">
                              {cleanThaiText(item.courseName)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.submissionStatus === "APPROVED" ? (
                            <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#EDFBF5] text-[#52C79E] border border-[#B7EED8]">
                              อนุมัติ ขร. แล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#FFF8F0] text-[#FFAB5E] border border-[#FFE0C2]">
                              รออนุมัติ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: "student",
                                id: item.attendance.student.studentId,
                                batchId: item.courseCode,
                                title: "ยืนยันการลบรายชื่อนักศึกษาออกจาก ขร.",
                                message: `ต้องการลบ ${item.attendance.student.prefix}${item.attendance.student.firstName} ${item.attendance.student.lastName} (${item.attendance.student.studentId}) ออกจากรายชื่อ ขร. วิชา ${item.courseCode} ${item.courseName} หรือไม่?`,
                              })
                            }
                            title="ลบนักเรียนคนนี้ออกจากรายชื่อ ขร."
                            className="p-1.5 text-[#A79FC2] hover:text-[#FF4D71] hover:bg-[#FFF0F3] rounded-lg transition-colors cursor-pointer"
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
        )}
      </main>

      {/* ================= Review & Approval Modal ================= */}
      {selectedSubmission && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={
            <div className="flex items-center gap-2.5">
              <div className="squircle-purple h-8 w-8 text-white shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-black text-lg text-[#2B244D]">
                พิจารณาตรวจสอบบันทึกข้อความ ขร.
              </span>
            </div>
          }
          description={`เลขที่บันทึก: ${selectedSubmission.memoNumber} | รายวิชา: ${selectedSubmission.courseCode} ${selectedSubmission.courseName}`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7FE] border border-[#EAE3F5] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#857E9E] block">ครูผู้สอน:</span>
                <span className="font-bold text-[#2B244D] text-sm">
                  {selectedSubmission.teacherName}
                </span>
                <span className="text-[#857E9E] block">
                  {selectedSubmission.teacherDepartment}
                </span>
              </div>
              <div>
                <span className="text-[#857E9E] block">วันที่ส่งเรื่อง:</span>
                <span className="font-bold text-[#2B244D]">
                  {selectedSubmission.submittedAt}
                </span>
              </div>
              <div>
                <span className="text-[#857E9E] block">สถานะปัจจุบัน:</span>
                {selectedSubmission.status === "PENDING" ? (
                  <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#FFF8F0] text-[#FFAB5E] border border-[#FFE0C2]">
                    รอตรวจสอบและอนุมัติ
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#EDFBF5] text-[#52C79E] border border-[#B7EED8]">
                    อนุมัติประกาศ ขร. แล้ว
                  </span>
                )}
              </div>
            </div>

            {/* Students List in this Submission */}
            <div>
              <h4 className="text-sm font-black text-[#2B244D] mb-2 flex items-center justify-between">
                <span>รายชื่อผู้เรียนที่เวลาเรียนต่ำกว่า 80% (เสนอขอ ขร.):</span>
                <span className="text-[#FF6885] font-black">
                  {selectedSubmission.students.length} คน
                </span>
              </h4>

              <div className="border border-[#EAE3F5] rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F3EEFA] text-[#2B244D] font-bold border-b border-[#EAE3F5] sticky top-0">
                    <tr>
                      <th className="p-2.5">ลำดับ</th>
                      <th className="p-2.5">รหัสนักศึกษา</th>
                      <th className="p-2.5">ชื่อ - สกุล</th>
                      <th className="p-2.5">ระดับ/กลุ่ม</th>
                      <th className="p-2.5 text-center">เวลาเรียน</th>
                      <th className="p-2.5 text-center">% เวลาเรียน</th>
                      <th className="p-2.5">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBF7]">
                    {selectedSubmission.students.map((att, idx) => (
                      <tr key={att.id} className="hover:bg-purple-50/40">
                        <td className="p-2.5 font-bold text-[#857E9E]">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-[#7A63E5]">
                          {att.student.studentId}
                        </td>
                        <td className="p-2.5 font-bold text-[#2B244D]">
                          {cleanThaiText(att.student.prefix)}
                          {cleanThaiText(att.student.firstName)} {cleanThaiText(att.student.lastName)}
                        </td>
                        <td className="p-2.5 text-[#5D5775]">
                          {cleanThaiText(att.student.level)} ({cleanThaiText(att.student.classGroup)})
                        </td>
                        <td className="p-2.5 text-center text-[#5D5775]">
                          {att.attendedHours}/{att.totalHours} ชม.
                        </td>
                        <td className="p-2.5 text-center font-bold text-[#FF6885]">
                          {att.attendanceRate.toFixed(1)}%
                        </td>
                        <td className="p-2.5 text-[#857E9E]">
                          {att.remark || "ขาดเรียนเกิน 20%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4 Signatories Check */}
            <div className="p-3.5 bg-[#FFF8F0] rounded-2xl border border-[#FFE0C2] text-xs text-[#99551E] flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#FFAB47] mt-0.5" />
              <div>
                <p className="font-bold">ขั้นตอนการลงนามเอกสาร 4 ฝ่าย:</p>
                <p className="text-[#884B1A] mt-0.5">
                  1. ครูผู้สอน (เสนอแล้ว) &rarr; 2. หัวหน้าสาขาวิชา (เห็นชอบแล้ว) &rarr; 3. หัวหน้างานวัดผลฯ (กำลังดำเนินการ) &rarr; 4. รองผู้อำนวยการฝ่ายวิชาการ (อนุมัติสั่งการ)
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EBF7]">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#857E9E] hover:bg-[#F3EEFA] transition-colors"
              >
                ปิดหน้าต่าง
              </button>
              {selectedSubmission.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => handleApproveSubmission(selectedSubmission.id)}
                  className="btn-clay-purple px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>อนุมัติประกาศ ขร. ลงระบบทะเบียน</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Official Print Modal */}
      <OfficialMemoModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        course={mockCourses[0]}
        teacher={mockTeacher}
        students={mockStudentAttendances["c-001"]}
        courses={mockCourses}
        attendancesMap={mockStudentAttendances}
      />

      {/* Std 02 Sync Modal */}
      <Std02SyncModal
        isOpen={isStd02ModalOpen}
        onClose={() => setIsStd02ModalOpen(false)}
        onSyncComplete={(count) => {
          setNotification(`ซิงค์ข้อมูลกับ ศธ.02 สำเร็จ (ประมวลผล ${count} รายการ)`);
          setTimeout(() => setNotification(null), 5000);
        }}
        onImportAllCourses={(data) => {
          setCurrentTerm(data.term);
          setCurrentAcademicYear(data.academicYear);

          const newBatchId = `batch-${Date.now()}`;
          const newSubmissionIds: string[] = [];

          const newSubmissions: KhorRorSubmissionSummary[] = data.courses.map((course, cIdx) => {
            const subId = `sub-excel-${course.courseCode}-${Date.now()}-${cIdx}`;
            newSubmissionIds.push(subId);

            const stdAttendances: StudentAttendance[] = course.students.map((s, sIdx) => ({
              id: `att-${course.courseCode}-${s.studentId}-${sIdx}`,
              student: {
                id: `std-${s.studentId}`,
                studentId: s.studentId,
                prefix: cleanThaiText(s.prefix),
                firstName: cleanThaiText(s.firstName),
                lastName: cleanThaiText(s.lastName),
                level: cleanThaiText(s.level),
                department: cleanThaiText(s.department),
                classGroup: cleanThaiText(s.classGroup),
              },
              courseId: `course-${course.courseCode}`,
              totalHours: 36,
              attendedHours: 24,
              absentHours: 12,
              leaveHours: 0,
              lateHours: 0,
              attendanceRate: 66.7,
              status: "KHOR_ROR",
              submissionStatus: "APPROVED",
              remark: cleanThaiText(s.remark || "หมดสิทธิ์สอบ (ขร.)"),
              lastCheckedDate: "19 ก.ย. 2567",
            }));

            return {
              id: subId,
              memoNumber: `ศธ 0629.04/${150 + cIdx}`,
              courseId: `course-${course.courseCode}`,
              courseCode: cleanThaiText(course.courseCode),
              courseName: cleanThaiText(course.courseName),
              teacherName: cleanThaiText(course.teacherName),
              teacherDepartment: "วิทยาลัยสารพัดช่างน่าน",
              studentCount: course.students.length,
              submittedAt: "19 ก.ย. 2567",
              status: "APPROVED",
              students: stdAttendances,
            };
          });

          // Check for duplicate course codes to prevent accidental inflation
          const incomingCodes = new Set(data.courses.map((c) => c.courseCode));
          const hasDuplicates = submissions.some((s) => incomingCodes.has(s.courseCode));

          if (hasDuplicates) {
            // Replace existing records with new records
            setSubmissions((prev) => [
              ...newSubmissions,
              ...prev.filter((s) => !incomingCodes.has(s.courseCode)),
            ]);
          } else {
            setSubmissions((prev) => [...newSubmissions, ...prev]);
          }

          // Register import batch for rollback
          const newBatch: ImportBatch = {
            id: newBatchId,
            fileName: data.fileName || "แบบฟอร์ม ประกาศ ขร 1.69.xlsx",
            importedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.",
            coursesCount: data.courses.length,
            studentsCount: data.allStudents.length,
            submissionIds: newSubmissionIds,
          };
          setImportBatches((prev) => [newBatch, ...prev]);

          setNotification(
            hasDuplicates
              ? `🔄 อัปเดตข้อมูลไฟล์ "${data.fileName || 'Excel'}" สำเร็จ (ตรวจพบรายวิชาเดิม จึงทำการแทนที่ข้อมูลล่าสุด ${data.courses.length} รายวิชา / รวม ${data.allStudents.length} คน เพื่อป้องกันข้อมูลซ้ำซ้อน)`
              : `🎉 นำเข้าข้อมูลประกาศผล ขร. สำเร็จครบทั้ง ${data.courses.length} รายวิชา (รวม ${data.allStudents.length} คน) ภาคเรียนที่ ${data.term}/${data.academicYear} เข้าสู่ระบบงานวัดผลเรียบร้อยแล้ว`
          );
          setTimeout(() => setNotification(null), 8000);
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
          setNotification(
            `เปลี่ยนการตั้งค่าเป็น ภาคเรียนที่ ${term === 3 ? "ฤดูร้อน" : term} ปีการศึกษา ${year} เรียบร้อยแล้ว`
          );
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* Delete Confirmation Modal (User Requested Feature) */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2.5 text-[#FF4D71]">
              <div className="h-9 w-9 rounded-2xl bg-[#FFF0F3] border border-[#FFCCD5] flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-[#FF4D71]" />
              </div>
              <div>
                <span className="font-black text-lg text-[#2B244D] block">
                  {deleteTarget.title}
                </span>
                <span className="text-xs text-[#FF4D71] font-bold block">
                  การดำเนินการนี้จะลบข้อมูลออกจากฐานข้อมูลระบบ
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-5 p-1">
            <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FFCCD5] text-xs text-[#662233] leading-relaxed">
              <p className="font-medium">{deleteTarget.message}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0EBF7]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-full border border-[#D8CCED] bg-white text-[#857E9E] hover:text-[#2B244D] text-xs font-bold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === "batch" && deleteTarget.batchId) {
                    handleDeleteBatch(deleteTarget.batchId);
                  } else if (deleteTarget.type === "submission" && deleteTarget.id) {
                    handleDeleteSubmission(deleteTarget.id);
                  } else if (deleteTarget.type === "student" && deleteTarget.id && deleteTarget.batchId) {
                    handleDeleteStudent(deleteTarget.id, deleteTarget.batchId);
                  } else if (deleteTarget.type === "all_imported") {
                    handleClearAllImports();
                  }
                  setDeleteTarget(null);
                }}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FF5C7A] to-[#E63956] text-white text-xs font-black shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>ยืนยันการลบข้อมูล</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
