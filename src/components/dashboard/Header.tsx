"use client";

import React from "react";
import { Calendar, LogOut, Sparkles } from "lucide-react";
import { TeacherProfile } from "@/types";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  teacher: TeacherProfile;
  onOpenTermSetting?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ teacher, onOpenTermSetting }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-purple-200/40 bg-gradient-to-r from-[#9D8DF1] via-[#8B77EB] to-[#7A63E5] text-white shadow-[0_6px_24px_rgba(139,119,235,0.22)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity with Nan Polytechnic College Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-2 ring-white/50 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="วิทยาลัยสารพัดช่างน่าน"
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wide text-white drop-shadow-xs">
                NPC ClassPass
              </span>
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white border border-white/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-purple-100 font-medium hidden sm:block">
              ระบบตรวจสอบสิทธิ์สอบ &amp; แจ้งเตือน ขร. | วิทยาลัยสารพัดช่างน่าน
            </p>
          </div>
        </div>

        {/* Center/Right: Term and Academic Year (Clickable to change settings) */}
        <button
          type="button"
          onClick={onOpenTermSetting}
          title="คลิกเพื่อตั้งค่าภาคเรียนและปีการศึกษา"
          className="hidden md:flex items-center gap-2 rounded-full border border-white/25 bg-white/15 hover:bg-white/25 hover:border-white/40 px-3.5 py-1 text-xs text-white font-bold backdrop-blur-xs shadow-xs transition-all cursor-pointer group"
        >
          <Calendar className="h-3.5 w-3.5 text-yellow-300 group-hover:scale-110 transition-transform" />
          <span>ภาคเรียนที่ {teacher.term === 3 ? "ฤดูร้อน" : teacher.term}</span>
          <span className="text-white/40">|</span>
          <span>ปีการศึกษา {teacher.academicYear}</span>
          <span className="text-[10px] bg-white/20 text-purple-100 group-hover:text-white px-1.5 py-0.2 rounded-md transition-colors ml-0.5">
            เปลี่ยน
          </span>
        </button>

        {/* Right: Teacher Profile & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-sm font-black text-white">
                {teacher.name}
              </span>
              <span className="text-[10px] font-black py-0.5 px-2 rounded-full bg-white/25 text-white border border-white/30">
                ครูผู้สอน
              </span>
            </div>
            <span className="text-xs text-purple-100">{teacher.department}</span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#7A63E5] font-black text-sm shadow-[0_4px_10px_rgba(0,0,0,0.12)] ring-2 ring-white/60">
            {teacher.name.charAt(2) || "ครู"}
          </div>

          {/* Logout Button */}
          <a
            href="/"
            title="ออกจากระบบ"
            className="p-2 text-purple-100 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
