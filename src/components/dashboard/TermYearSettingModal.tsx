"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Calendar, Check, Sparkles, GraduationCap, AlertCircle } from "lucide-react";

interface TermYearSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTerm: number;
  currentAcademicYear: number;
  onSave: (term: number, academicYear: number) => void;
}

export const TermYearSettingModal: React.FC<TermYearSettingModalProps> = ({
  isOpen,
  onClose,
  currentTerm,
  currentAcademicYear,
  onSave,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<number>(currentTerm);
  const [selectedYear, setSelectedYear] = useState<number>(currentAcademicYear);
  const [customYear, setCustomYear] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    setSelectedTerm(currentTerm);
    setSelectedYear(currentAcademicYear);
    setIsCustom(![2567, 2568, 2569, 2570].includes(currentAcademicYear));
    if (![2567, 2568, 2569, 2570].includes(currentAcademicYear)) {
      setCustomYear(String(currentAcademicYear));
    }
  }, [currentTerm, currentAcademicYear, isOpen]);

  const yearOptions = [2567, 2568, 2569, 2570];

  const handleSave = () => {
    const finalYear = isCustom && customYear.trim()
      ? parseInt(customYear.trim(), 10) || selectedYear
      : selectedYear;
    onSave(selectedTerm, finalYear);
    onClose();
  };

  const quickPresets = [
    { label: "ภาคเรียนที่ 1 / 2569 (ไฟล์ประกาศล่าสุด)", term: 1, year: 2569 },
    { label: "ภาคเรียนที่ 2 / 2567 (ปัจจุบัน)", term: 2, year: 2567 },
    { label: "ภาคเรียนที่ 1 / 2568 (ปีที่ผ่านมา)", term: 1, year: 2568 },
    { label: "ภาคฤดูร้อน / 2568", term: 3, year: 2568 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="squircle-purple h-9 w-9 text-white shrink-0 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="font-black text-lg text-[#2B244D] block">
              ตั้งค่าภาคเรียนและปีการศึกษา
            </span>
            <span className="text-xs text-[#857E9E] font-medium block">
              กำหนดรอบการประเมินผล ขร. และหัวรายงานราชการ (บันทึกข้อความ / ใบประกาศ)
            </span>
          </div>
        </div>
      }
      description=""
      maxWidth="md"
    >
      <div className="space-y-6 p-1">
        {/* Why this setting matters notification badge */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F4F0FC] text-[#5542A8] border border-[#D8CCED] text-xs font-bold shadow-xs">
          <AlertCircle className="h-4 w-4 text-[#8C78EA] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-black">สำคัญสำหรับการออกเอกสารราชการ:</p>
            <p className="font-medium text-[#736894]">
              ภาคเรียนและปีการศึกษาที่เลือก จะถูกนำไปพิมพ์ลงในหัวแบบบันทึกข้อความตราครุฑ และแบบฟอร์มประกาศผล ขร. ของวิทยาลัยโดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* ภาคเรียนที่ Selection */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#2B244D] uppercase tracking-wide flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-[#8C78EA]" />
            <span>ภาคเรียนที่ (Term):</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: 1, label: "ภาคเรียนที่ 1", sub: "เทอมต้น" },
              { val: 2, label: "ภาคเรียนที่ 2", sub: "เทอมปลาย" },
              { val: 3, label: "ภาคฤดูร้อน", sub: "Summer" },
            ].map((t) => {
              const active = selectedTerm === t.val;
              return (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setSelectedTerm(t.val)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    active
                      ? "bg-gradient-to-b from-[#9D8DF1] to-[#7A63E5] text-white border-[#7A63E5] shadow-[0_4px_14px_rgba(122,99,229,0.35)] scale-[1.02]"
                      : "bg-white text-[#2B244D] border-[#EAE3F5] hover:bg-[#F8F5FD] hover:border-[#D8CCED]"
                  }`}
                >
                  <span className="font-black text-sm">{t.label}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      active ? "text-purple-100" : "text-[#857E9E]"
                    }`}
                  >
                    {t.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ปีการศึกษา Selection */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#2B244D] uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#8C78EA]" />
            <span>ปีการศึกษา (Academic Year):</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {yearOptions.map((year) => {
              const active = !isCustom && selectedYear === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(year);
                    setIsCustom(false);
                  }}
                  className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer font-black text-sm ${
                    active
                      ? "bg-gradient-to-b from-[#9D8DF1] to-[#7A63E5] text-white border-[#7A63E5] shadow-[0_4px_14px_rgba(122,99,229,0.3)] scale-[1.02]"
                      : "bg-white text-[#2B244D] border-[#EAE3F5] hover:bg-[#F8F5FD] hover:border-[#D8CCED]"
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>

          {/* Custom Year Option */}
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  isCustom
                    ? "bg-[#F3EEFA] text-[#7A63E5] border-[#D8CCED] font-black"
                    : "text-[#857E9E] border-transparent hover:text-[#2B244D]"
                }`}
              >
                ระบุปีการศึกษาอื่น:
              </button>
              {isCustom && (
                <input
                  type="number"
                  placeholder="เช่น 2571"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-[#D8CCED] bg-white text-xs font-black text-[#2B244D] focus:outline-none focus:ring-2 focus:ring-[#8C78EA]/40"
                />
              )}
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5 border-t border-[#F0EBF7] pt-4">
          <span className="text-[11px] font-bold text-[#857E9E] block">
            ตัวเลือกด่วนตามรอบประกาศ:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedTerm(preset.term);
                  setSelectedYear(preset.year);
                  setIsCustom(false);
                }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F3EEFA] text-[#7A63E5] hover:bg-[#EAE3F5] transition-colors border border-[#E0D5F3] cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview and Save Button */}
        <div className="pt-2 flex items-center justify-between border-t border-[#F0EBF7]">
          <div className="text-xs">
            <span className="text-[#857E9E]">จะเปลี่ยนเป็น: </span>
            <strong className="text-[#7A63E5] font-black">
              ภาคเรียนที่ {selectedTerm === 3 ? "ฤดูร้อน" : selectedTerm} /{" "}
              {isCustom && customYear ? customYear : selectedYear}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#D8CCED] bg-white text-[#857E9E] hover:text-[#2B244D] text-xs font-bold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-clay-purple px-5 py-2 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
