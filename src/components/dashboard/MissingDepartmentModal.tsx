"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissingDepartmentModalProps {
  isOpen: boolean;
  teacherName: string;
  teacherEmail: string;
  onSave: (department: string) => Promise<void> | void;
}

const COLLEGE_DEPARTMENTS = [
  "แผนกวิชาช่างยนต์",
  "แผนกวิชาช่างไฟฟ้ากำลัง",
  "แผนกวิชาช่างอิเล็กทรอนิกส์",
  "แผนกวิชาช่างเชื่อมโลหะ",
  "แผนกวิชาช่างก่อสร้าง",
  "แผนกวิชาการบัญชี",
  "แผนกวิชาการตลาด",
  "แผนกวิชาการโรงแรม",
  "แผนกวิชาการท่องเที่ยว",
  "แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
  "แผนกวิชาเทคโนโลยีสารสนเทศ",
  "แผนกวิชาสามัญสัมพันธ์",
  "อื่น ๆ (ระบุเอง)",
];

export const MissingDepartmentModal: React.FC<MissingDepartmentModalProps> = ({
  isOpen,
  teacherName,
  teacherEmail,
  onSave,
}) => {
  const [selectedDept, setSelectedDept] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDepartment = selectedDept === "อื่น ๆ (ระบุเอง)" ? customDept.trim() : selectedDept;

    if (!finalDepartment) {
      setErrorMsg("กรุณาเลือกหรือระบุแผนกวิชาของท่าน");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // เรียก API บันทึกแผนกวิชา
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: finalDepartment }),
      });

      if (!res.ok) {
        throw new Error("บันทึกข้อมูลไม่สำเร็จ");
      }

      await onSave(finalDepartment);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden transform transition-all">
        {/* Header Gradient */}
        <div className="relative bg-gradient-to-r from-[#8B77EB] via-[#7A63E5] to-[#6A52DA] p-6 text-white text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner ring-2 ring-white/40">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">ระบุข้อมูลแผนกวิชา</h2>
          <p className="mt-1 text-xs text-purple-100 font-medium">
            ยินดีต้อนรับเข้าสู่ระบบ NPC ClassPass | วิทยาลัยสารพัดช่างน่าน
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* User Info Card */}
          <div className="rounded-2xl bg-[#F7F5FD] p-4 border border-[#EADBFA]/80 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#857E9E] font-medium">ครูผู้สอน:</span>
              <span className="font-bold text-[#2B244D]">{teacherName || "ครูผู้สอน"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#857E9E] font-medium">บัญชี Google (@npc.ac.th):</span>
              <span className="font-mono text-[#7A63E5] font-semibold">{teacherEmail}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B244D]">
              กรุณาเลือกแผนกวิชาของท่าน <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-[#857E9E]">
              เนื่องจากยังไม่พบข้อมูลแผนกวิชาในระบบกลาง กรุณาเลือกแผนกวิชาเพื่อใช้ในการจัดกลุ่มรายงาน ขร.
            </p>

            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setErrorMsg("");
              }}
              className="w-full mt-2 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-[#2B244D] font-medium shadow-xs focus:border-[#7A63E5] focus:ring-2 focus:ring-[#7A63E5]/20 outline-none transition-all cursor-pointer"
            >
              <option value="">-- คลิกเลือกแผนกวิชา --</option>
              {COLLEGE_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* If Selected "อื่น ๆ (ระบุเอง)" */}
            {selectedDept === "อื่น ๆ (ระบุเอง)" && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="พิมพ์ชื่อแผนกวิชา เช่น แผนกวิชาเทคนิคกายภาพ..."
                  className="w-full rounded-xl border border-purple-300 px-4 py-2.5 text-sm text-[#2B244D] focus:border-[#7A63E5] focus:ring-2 focus:ring-[#7A63E5]/20 outline-none transition-all"
                  autoFocus
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDept}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B77EB] to-[#7A63E5] hover:from-[#7A63E5] hover:to-[#6A52DA] text-white font-bold shadow-lg shadow-purple-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลและเริ่มใช้งานระบบ"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
