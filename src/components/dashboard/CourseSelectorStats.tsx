"use client";

import React from "react";
import {
  BookOpen,
  Users,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { Course, StudentAttendance } from "@/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CourseSelectorStatsProps {
  courses: Course[];
  activeCourseId: string;
  onSelectCourse: (courseId: string) => void;
  attendances: StudentAttendance[];
}

export const CourseSelectorStats: React.FC<CourseSelectorStatsProps> = ({
  courses,
  activeCourseId,
  onSelectCourse,
  attendances,
}) => {
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Calculate statistics for active course
  const totalStudents = attendances.length;
  const khorRorCount = attendances.filter((a) => a.attendanceRate < 80).length;
  const riskCount = attendances.filter(
    (a) => a.attendanceRate >= 80 && a.attendanceRate < 85
  ).length;
  const normalCount = attendances.filter((a) => a.attendanceRate >= 85).length;

  // Maximum allowed absent hours for this course (20% of total hours)
  const maxAllowedAbsenceHours = Math.floor(activeCourse.totalHours * 0.2);

  return (
    <div className="space-y-6">
      {/* Course Selection Carousel / Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#0F1E36]" />
            <h2 className="text-base font-bold text-[#0F1E36]">
              รายวิชาที่รับผิดชอบการสอน
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            เลือกรายวิชาเพื่อตรวจสอบสิทธิ์สอบ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {courses.map((course) => {
            const isActive = course.id === activeCourseId;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-gradient-to-br from-[#005cd4] via-[#0047ba] to-[#002b80] text-white border-blue-600 shadow-lg ring-2 ring-[#C5A059]/60"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-200 hover:bg-blue-50/20"
                )}
              >
                <div className="flex items-start justify-between w-full">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide",
                      isActive
                        ? "bg-[#C5A059] text-white"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {course.code}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium flex items-center gap-1",
                      isActive ? "text-slate-300" : "text-slate-500"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {course.totalHours} ชม. ({course.credits} นก.)
                  </span>
                </div>

                <div className="mt-2 font-bold text-sm line-clamp-1">
                  {course.name}
                </div>

                <div
                  className={cn(
                    "mt-2.5 pt-2 border-t flex items-center justify-between text-xs",
                    isActive ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-500"
                  )}
                >
                  <span>{course.room}</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.totalStudents} คน
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Regulation Info Notice Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold">เกณฑ์เวลาเรียนตามระเบียบ สอศ. :</span>{" "}
            นักเรียนต้องมีเวลาเรียนไม่น้อยกว่า{" "}
            <span className="font-bold underline text-amber-950">80%</span> (ขาดเรียนได้ไม่เกิน{" "}
            <span className="font-bold text-red-700">{maxAllowedAbsenceHours} ชั่วโมง</span> จากทั้งหมด{" "}
            {activeCourse.totalHours} ชั่วโมง) มิฉะนั้นจะถูกตัดสินผลการเรียนเป็น{" "}
            <span className="font-bold text-red-700">"ขร." (หมดสิทธิ์สอบ)</span>
          </div>
        </div>
        <div className="text-[11px] text-amber-800 bg-amber-200/50 px-2.5 py-1 rounded-md font-semibold whitespace-nowrap self-end sm:self-auto">
          อ้างอิง: ระเบียบกระทรวงศึกษาธิการ
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              นักเรียนทั้งหมดในวิชา
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0F1E36]">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {activeCourse.name}
          </p>
        </Card>

        {/* Card 2: Eligible (Normal >=85%) */}
        <Card className="p-4 border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              สิทธิ์สอบปกติ (&ge; 85%)
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {normalCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600">
            คิดเป็น {totalStudents ? ((normalCount / totalStudents) * 100).toFixed(1) : 0}% ของชั้นเรียน
          </p>
        </Card>

        {/* Card 3: At Risk (80 - 84.9%) */}
        <Card className="p-4 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              กลุ่มเสี่ยง (80 - 84.9%)
            </span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">
              {riskCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            ต้องเฝ้าระวัง / ขาดอีก 1 ครั้งจะ ขร.
          </p>
        </Card>

        {/* Card 4: Ineligible / ขร. (<80%) */}
        <Card className="p-4 border-red-200 bg-gradient-to-b from-red-50/60 to-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">
              หมดสิทธิ์สอบ ขร. (&lt; 80%)
            </span>
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">
              {khorRorCount}
            </span>
            <span className="text-xs text-red-500 font-medium">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-red-600 font-bold">
            ต้องส่งรายชื่อให้งานวัดผล
          </p>
        </Card>
      </div>
    </div>
  );
};
