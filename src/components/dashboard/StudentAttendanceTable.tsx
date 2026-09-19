"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAttendance } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  SendHorizontal,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentAttendanceTableProps {
  attendances: StudentAttendance[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenRemarkModal?: (attendance: StudentAttendance) => void;
}

export const StudentAttendanceTable: React.FC<StudentAttendanceTableProps> = ({
  attendances,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenRemarkModal,
}) => {
  const isAllSelected =
    attendances.length > 0 && selectedIds.length === attendances.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < attendances.length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      {/* Table Selection Count & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="text-xs text-slate-600 font-medium">
          แสดงรายการทั้งหมด{" "}
          <span className="font-bold text-[#0F1E36]">{attendances.length}</span>{" "}
          คน
          {selectedIds.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-md bg-[#0F1E36] px-2 py-0.5 text-xs font-semibold text-white">
              เลือกอยู่ {selectedIds.length} คน
            </span>
          )}
        </div>

        {/* Status Indicators Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            ปกติ (&ge;85%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
            เฝ้าระวัง เสี่ยง ขร. (80-84.9%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 inline-block" />
            หมดสิทธิ์สอบ ขร. (&lt;80%)
          </span>
        </div>
      </div>

      {/* Main Data Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all students"
              />
            </TableHead>
            <TableHead className="w-36">รหัสนักศึกษา</TableHead>
            <TableHead className="min-w-[200px]">ชื่อ - สกุล</TableHead>
            <TableHead className="w-28">ระดับ/กลุ่ม</TableHead>
            <TableHead className="w-36">แผนกวิชา</TableHead>
            <TableHead className="w-48 text-center">
              เวลาเรียน (ชั่วโมง)
            </TableHead>
            <TableHead className="w-36 text-center">% เวลาเรียน</TableHead>
            <TableHead className="w-36 text-center">สถานะสิทธิ์สอบ</TableHead>
            <TableHead className="w-28 text-center">การส่งวัดผล</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attendances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-44 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">
                    ไม่พบข้อมูลนักเรียนตามเงื่อนไขการค้นหา
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองด้านบน
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            attendances.map((att) => {
              const isSelected = selectedIds.includes(att.id);
              const isKhorRor = att.attendanceRate < 80;
              const isRisk =
                att.attendanceRate >= 80 && att.attendanceRate < 85;

              return (
                <TableRow
                  key={att.id}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "group transition-colors",
                    isKhorRor && "bg-red-50/30 hover:bg-red-50/60",
                    isRisk && "bg-amber-50/20 hover:bg-amber-50/40"
                  )}
                >
                  {/* Selection Checkbox */}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(att.id)}
                      aria-label={`Select ${att.student.firstName}`}
                    />
                  </TableCell>

                  {/* Student ID with copy icon */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                      <span>{att.student.studentId}</span>
                      <button
                        onClick={() => copyToClipboard(att.student.studentId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-[#0F1E36]"
                        title="คัดลอกรหัส"
                      >
                        <Copy className="h-3 w-3 text-slate-500" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Student Name */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-950 text-sm">
                        {att.student.prefix}
                        {att.student.firstName} {att.student.lastName}
                      </span>
                      {att.remark && (
                        <span className="text-xs text-slate-600 font-medium truncate max-w-[240px]">
                          หมายเหตุ: {att.remark}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Level and Class Group */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-950">
                        {att.student.level}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        กลุ่ม {att.student.classGroup}
                      </span>
                    </div>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-800">
                      {att.student.department}
                    </span>
                  </TableCell>

                  {/* Attendance Hours Breakdown */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-xs font-black text-slate-950">
                        <span>{att.attendedHours}</span>
                        <span className="text-slate-500 font-normal">/</span>
                        <span>{att.totalHours} ชม.</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span title="ขาดเรียน" className="text-red-500 font-semibold">
                          ขาด {att.absentHours}
                        </span>
                        <span>•</span>
                        <span title="ลา" className="text-slate-500">
                          ลา {att.leaveHours}
                        </span>
                        <span>•</span>
                        <span title="สาย" className="text-amber-600">
                          สาย {att.lateHours}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Attendance Rate & Progress Bar */}
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-32 mx-auto">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={cn(
                            "font-bold",
                            isKhorRor
                              ? "text-red-700"
                              : isRisk
                              ? "text-amber-700"
                              : "text-emerald-700"
                          )}
                        >
                          {att.attendanceRate.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (เกณฑ์ 80%)
                        </span>
                      </div>
                      {/* Bar indicator */}
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isKhorRor
                              ? "bg-red-600"
                              : isRisk
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(att.attendanceRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Attendance Status Badge */}
                  <TableCell className="text-center">
                    {isKhorRor ? (
                      <Badge variant="danger" className="gap-1 shadow-xs">
                        <XCircle className="h-3 w-3 text-red-600" />
                        หมดสิทธิ์สอบ (ขร.)
                      </Badge>
                    ) : isRisk ? (
                      <Badge variant="warning" className="gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        เฝ้าระวัง เสี่ยง ขร.
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        สิทธิ์สอบปกติ
                      </Badge>
                    )}
                  </TableCell>

                  {/* Submission Status */}
                  <TableCell className="text-center">
                    {att.submissionStatus === "SUBMITTED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <SendHorizontal className="h-3 w-3" />
                        ส่งแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-slate-400">
                        ยังไม่ส่ง
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
