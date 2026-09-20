"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Heart,
  Music,
  Clock,
  Flame,
  Info,
  AlertCircle,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAssetPath } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#EFE7FA] via-[#F8F5FD] to-[#E9DEFA]">
      {/* Background 3D Pastel Glowing Orbs & Soft Lighting */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-purple-300/35 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-pink-300/30 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[650px] w-[650px] rounded-full bg-indigo-200/30 blur-[150px]" />

      {/* Main 3D Soft Clay Split-Card Container */}
      <div className="relative z-10 w-full max-w-4xl rounded-[32px] bg-white/95 shadow-[0_24px_60px_-10px_rgba(140,110,210,0.22)] border border-white overflow-hidden flex flex-col md:flex-row backdrop-blur-sm">
        
        {/* ================= LEFT SIDE: Soft Lavender Clay Hero Banner ================= */}
        <div className="relative w-full md:w-[46%] min-h-[380px] md:min-h-[580px] p-8 sm:p-10 flex flex-col justify-between text-white overflow-hidden bg-gradient-to-b from-[#9E8DF4] via-[#8D7BEB] to-[#7964E1]">
          
          {/* Subtle Decorative Curves */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#FFA5B8]/20 blur-2xl" />

          {/* Top Logo Area with Official Nan Polytechnic College Seal */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white p-1 shadow-[0_6px_16px_rgba(0,0,0,0.1)] ring-4 ring-white/40 flex items-center justify-center shrink-0">
              <img
                src={getAssetPath("/logo.png")}
                alt="วิทยาลัยสารพัดช่างน่าน"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-wider uppercase block text-white drop-shadow-xs">
                NPC ClassPass
              </span>
              <span className="text-[11px] text-purple-100 font-semibold block -mt-0.5">
                วิทยาลัยสารพัดช่างน่าน
              </span>
            </div>
          </div>

          {/* Middle Typography (Matching Reference Image Style: "Good Morning, Mia! ✨") */}
          <div className="relative z-10 my-auto py-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white mb-3">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>ระบบประเมินผลเวลาเรียน สอศ.</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              ยินดีต้อนรับ,
              <br />
              <span>เข้าสู่ระบบ! ☀️</span>
            </h1>
            
            <p className="mt-3 text-xs sm:text-sm text-purple-100/95 leading-relaxed max-w-[290px]">
              ระบบตรวจสอบสิทธิ์สอบ แจ้งเตือน และบันทึกผลการเรียน "ขร." จากครูผู้สอนส่งตรงถึงงานวัดผลและประเมินผล
            </p>

            {/* 3D Squircle Feature Highlights (Matching the 4 pastel icons in image!) */}
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FFA5B6] to-[#FF6E8A] flex items-center justify-center text-white shadow-xs shrink-0">
                  <Heart className="h-4 w-4 fill-white" />
                </div>
                <span>คัดกรอง ขร. เวลาเรียน &lt; 80% อัตโนมัติ</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FFD07B] to-[#FFAB47] flex items-center justify-center text-white shadow-xs shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <span>บันทึกข้อความราชการ 4 ระดับ + พิมพ์รายงาน</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#8FE0FC] to-[#5CB9F8] flex items-center justify-center text-white shadow-xs shrink-0">
                  <Flame className="h-4 w-4 fill-white" />
                </div>
                <span>เชื่อมต่อ API &amp; SQL จากระบบ ศธ.02 สอศ.</span>
              </div>
            </div>
          </div>

          {/* Bottom Explore Button */}
          <div className="relative z-10 pt-2">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-[#7964E1] shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-purple-50 transition-all cursor-pointer active:scale-95"
            >
              <span>คู่มือการใช้งานระบบ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ================= RIGHT SIDE: Soft Clay Login Form Panel ================= */}
        <div className="w-full md:w-[54%] p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header: Role Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-[#2B244D]">
                  เข้าสู่ระบบ
                </h2>
                <p className="text-xs sm:text-sm text-[#857E9E] font-medium mt-1">
                  ระบบจัดการและแจ้งเตือนการหมดสิทธิ์สอบ (ขร.)
                </p>
              </div>
            </div>

            {/* Error Notification Banner if SSO failed or invalid domain */}
            <Suspense fallback={null}>
              <AuthErrorBanner />
            </Suspense>

            {/* Google Workspace Keycloak SSO Section */}
            <div className="space-y-4 my-6">
              <a
                href={getAssetPath("/api/auth/keycloak")}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-[#2B244D] bg-white border-2 border-[#D8CCED] hover:border-[#8C78EA] hover:bg-[#FAF7FE] shadow-[0_8px_24px_rgba(140,120,234,0.18)] hover:shadow-[0_12px_32px_rgba(140,120,234,0.28)] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-3.5 group select-none"
              >
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-extrabold text-sm sm:text-base">เข้าสู่ระบบด้วย Google Workspace</span>
              </a>

              {/* College Security & Guidance Notice */}
              <div className="rounded-2xl bg-[#FAF7FE] border border-[#EADBFA] p-4 text-xs text-[#5D5775] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#2B244D]">
                  <ShieldCheck className="h-4 w-4 text-[#8C78EA]" />
                  <span>ระบบยืนยันตัวตนสถานศึกษา (Single Sign-On)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#857E9E]">
                  สงวนสิทธิ์เฉพาะครูผู้สอนและบุคลากรวิทยาลัยสารพัดช่างน่าน โดยเข้าใช้งานด้วยบัญชีอีเมล <strong>@npc.ac.th</strong> เพื่อให้ระบบระบุตัวตนและสิทธิ์การทำงานโดยอัตโนมัติ
                </p>
                <div className="flex flex-wrap gap-2 pt-0.5 text-[10px] font-semibold text-[#7A63E5]">
                  <span className="bg-white px-2.5 py-1 rounded-full border border-[#D8CCED]">
                    ✓ ตรวจสอบสิทธิ์อัตโนมัติ
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-full border border-[#D8CCED]">
                    ✓ ปลอดภัยด้วย Keycloak SSO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#A79FC2]">
              NPC ClassPass © 2567 วิทยาลัยสารพัดช่างน่าน สอศ.
            </p>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBF7]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#B5A4F8] to-[#8C78EA] text-white flex items-center justify-center">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="font-black text-[#2B244D]">
                  เกี่ยวกับระบบ NPC ClassPass
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-xs font-bold text-[#857E9E] hover:text-[#2B244D] px-2 py-1 rounded-lg"
              >
                ปิด
              </button>
            </div>
            <div className="text-xs text-[#5D5775] space-y-2 leading-relaxed">
              <p>
                <strong>NPC ClassPass</strong> คือระบบตรวจสอบและแจ้งเตือนการหมดสิทธิ์สอบ (ขร.) 
                พัฒนาขึ้นเพื่อสนับสนุนงานวิชาการและงานวัดผลและประเมินผล วิทยาลัยสารพัดช่างน่าน
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>เกณฑ์เวลาเรียน 80% ตามระเบียบกระทรวงศึกษาธิการว่าด้วยการจัดการศึกษาและประเมินผล สอศ.</li>
                <li>ครูผู้สอนบันทึกและตรวจสอบรายชื่อนักศึกษาติด ขร. ส่งตรงถึงงานวัดผล</li>
                <li>พิมพ์รายงานแบบบัญชีรายชื่อแยกตามรายวิชา/กลุ่มเรียน และแบบบันทึกข้อความราชการ 4 ฝ่าย</li>
                <li>เชื่อมต่อและนำเข้าข้อมูลนักเรียนผ่าน API และ SQL จากระบบ ศธ.02 ออนไลน์</li>
              </ul>
            </div>
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#8C78EA] hover:bg-[#7B65E3]"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const rejectedEmail = searchParams.get("email");

  if (!error) return null;

  let title = "เข้าสู่ระบบไม่สำเร็จ";
  let message = "การเข้าสู่ระบบผ่าน SSO ล้มเหลว กรุณาลองใหม่อีกครั้ง";

  if (error === "invalid_domain") {
    title = "จำกัดเฉพาะอีเมลสถานศึกษา";
    message = `อีเมล "${rejectedEmail || ""}" ไม่ใช่บัญชีองค์กร กรุณาเข้าสู่ระบบด้วย Google Workspace ของวิทยาลัยสารพัดช่างน่าน (@npc.ac.th) เท่านั้น`;
  } else if (error === "auth_cancelled") {
    title = "ยกเลิกการเข้าสู่ระบบ";
    message = "คุณได้ยกเลิกขั้นตอนการยืนยันตัวตนกับ Google/Keycloak";
  } else if (error === "auth_failed") {
    title = "การเชื่อมต่อขัดข้อง";
    message = "ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ Keycloak SSO ได้ในขณะนี้";
  }

  return (
    <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake shadow-xs">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
      <div>
        <p className="font-bold text-rose-800">{title}</p>
        <p className="font-medium mt-0.5 text-rose-600 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
