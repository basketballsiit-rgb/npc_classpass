"use client";

import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Course, StudentAttendance, TeacherProfile } from "@/types";
import { Printer, FileText, Table as TableIcon, Layers, Check } from "lucide-react";
import { cleanThaiText } from "@/lib/thaiUtils";

interface OfficialMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  teacher: TeacherProfile;
  students: StudentAttendance[];
  courses?: Course[];
  attendancesMap?: Record<string, StudentAttendance[]>;
}

export const OfficialMemoModal: React.FC<OfficialMemoModalProps> = ({
  isOpen,
  onClose,
  course,
  teacher,
  students,
  courses,
  attendancesMap,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Template Mode:
  // "table_report" = บัญชีรายชื่อแยกตามรายวิชา/กลุ่มเรียน (ตามตัวอย่างที่ผู้ใช้แนบมา)
  // "official_memo" = บันทึกข้อความราชการ (พร้อมตราครุฑ 3 ซม. และช่องลงนาม 4 ฝ่าย)
  const [reportType, setReportType] = useState<"table_report" | "official_memo">(
    "table_report"
  );

  // Scope: "single" = เฉพาะวิชาที่กำลังดู, "all" = รวมทุกวิชาที่ครูสอน
  const [scope, setScope] = useState<"single" | "all">("all");

  const handlePrint = () => {
    window.print();
  };

  const todayDate = "19 กันยายน 2567";

  // Prepare grouped data for table_report
  const coursesToRender = React.useMemo(() => {
    if (scope === "single" || !courses || !attendancesMap) {
      return [
        {
          courseInfo: course,
          khorRorList: students.filter((s) => s.attendanceRate < 80),
        },
      ];
    }

    return courses.map((c) => {
      const courseAttendances = attendancesMap[c.id] || [];
      return {
        courseInfo: c,
        khorRorList: courseAttendances.filter((s) => s.attendanceRate < 80),
      };
    });
  }, [scope, course, students, courses, attendancesMap]);

  const totalSelectedStudents = coursesToRender.reduce(
    (acc, curr) => acc + curr.khorRorList.length,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#C5A059]" />
          <span>พิมพ์รายงานผู้หมดสิทธิ์สอบ (ขร.)</span>
        </div>
      }
      description="ระบบจัดพิมพ์เอกสารรายงานตามแบบ สอศ. แยกตามรายวิชาและกลุ่มเรียน หรือแบบบันทึกข้อความราชการ"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          {/* Format Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">รูปแบบ:</span>
            
            <button
              type="button"
              onClick={() => setReportType("table_report")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportType === "table_report"
                  ? "bg-[#0F1E36] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5 text-[#C5A059]" />
              แบบบัญชีรายชื่อแยกตามรายวิชา (ตามตัวอย่าง)
            </button>

            <button
              type="button"
              onClick={() => setReportType("official_memo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportType === "official_memo"
                  ? "bg-[#0F1E36] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
              แบบบันทึกข้อความราชการ (มีตราครุฑ 3 ซม.)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              ปิดหน้าต่าง
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handlePrint}
              className="text-xs shadow-md font-bold"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              สั่งพิมพ์รายงาน (Print)
            </Button>
          </div>
        </div>

        {/* Filter / Scope Toolbar for table_report */}
        {reportType === "table_report" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">ขอบเขตการพิมพ์:</span>
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  scope === "all"
                    ? "bg-slate-200 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                รวมทุกวิชาที่สอน ({courses?.length || 1} วิชา)
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setScope("single")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  scope === "single"
                    ? "bg-slate-200 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                เฉพาะวิชาปัจจุบัน ({course.code})
              </button>
            </div>

            <span className="text-slate-500">
              รวมผู้เรียนที่หมดสิทธิ์สอบ (ขร.):{" "}
              <strong className="text-red-600">{totalSelectedStudents}</strong> คน
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOCUMENT PREVIEW CONTAINER (Matching Exact A4 Paper Styling)  */}
        {/* ============================================================== */}
        <div
          ref={printRef}
          className="printable-content bg-white text-black p-8 sm:p-12 rounded-lg border border-slate-300 shadow-md font-serif text-[15px] leading-normal max-w-[210mm] mx-auto min-h-[297mm]"
          style={{
            fontFamily: "'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', serif",
          }}
        >
          {/* ========================================================== */}
          {/* MODE 1: รายการแยกตามรายวิชา/กลุ่มเรียน (ตามตัวอย่างไฟล์ภาพแนบ) */}
          {/* ========================================================== */}
          {reportType === "table_report" && (
            <div className="space-y-8">
              {coursesToRender.map((block, bIdx) => (
                <div key={block.courseInfo.id} className="course-print-block">
                  {/* Header Line: รหัสวิชา ... วิชา ... ครูผู้สอน ... */}
                  <div className="font-bold text-sm text-black mb-1.5 flex items-baseline justify-between">
                    <div>
                      <span>รหัสวิชา {block.courseInfo.code}</span>{" "}
                      <span className="ml-3">วิชา {block.courseInfo.name}</span>{" "}
                      <span className="ml-5">
                        ครูผู้สอน {teacher.name}
                      </span>
                    </div>
                    {bIdx > 0 && (
                      <span className="text-xs text-slate-400 font-normal">
                        (ต่อ)
                      </span>
                    )}
                  </div>

                  {/* Standard Table (Matching Image Columns) */}
                  <table className="w-full border-collapse border border-black text-xs text-black">
                    <thead>
                      <tr className="border-b border-black text-center font-bold bg-slate-50/50">
                        <th className="border-r border-black p-1.5 w-12 text-center">
                          ที่
                        </th>
                        <th className="border-r border-black p-1.5 w-32 text-center">
                          รหัสประจำตัว
                        </th>
                        <th className="border-r border-black p-1.5 text-left px-3">
                          ชื่อ-สกุล
                        </th>
                        <th className="border-r border-black p-1.5 w-40 text-left px-3">
                          แผนกวิชา/กลุ่ม
                        </th>
                        <th className="p-1.5 w-32 text-center">
                          หมายเหตุ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.khorRorList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-slate-500 italic"
                          >
                            - ไม่มีผู้เรียนหมดสิทธิ์สอบ (ขร.) ในรายวิชานี้ -
                          </td>
                        </tr>
                      ) : (
                        block.khorRorList.map((att, idx) => (
                          <tr
                            key={att.id}
                            className="border-b border-black last:border-0"
                          >
                            {/* Column 1: ที่ */}
                            <td className="border-r border-black p-1.5 text-center font-normal">
                              {idx + 1}
                            </td>

                            {/* Column 2: รหัสประจำตัว */}
                            <td className="border-r border-black p-1.5 text-center font-mono">
                              {att.student.studentId}
                            </td>

                            {/* Column 3: ชื่อ-สกุล */}
                            <td className="border-r border-black p-1.5 text-left px-3 font-normal">
                              {cleanThaiText(att.student.prefix)}
                              {cleanThaiText(att.student.firstName)} {cleanThaiText(att.student.lastName)}
                            </td>

                            {/* Column 4: แผนกวิชา/กลุ่ม (e.g. ปวช.1/1 ช่างไฟฟ้า, ปวส.1/1 บัญชี) */}
                            <td className="border-r border-black p-1.5 text-left px-3 font-normal">
                              {att.student.level}/{att.student.classGroup.includes('/') ? att.student.classGroup.split('/')[1] : '1'}{" "}
                              {att.student.department}
                            </td>

                            {/* Column 5: หมายเหตุ */}
                            <td className="p-1.5 text-center text-[11px] font-normal"></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================== */}
          {/* MODE 2: แบบบันทึกข้อความราชการ (มีตราครุฑ 3 ซม. และ 4 ลายเซ็น) */}
          {/* ========================================================== */}
          {reportType === "official_memo" && (
            <div>
              {/* Header with Garuda Symbol (3 cm standard) */}
              <div className="relative mb-6">
                <div className="flex items-start">
                  <div className="w-[100px] h-[100px] flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-[90px] h-[90px] fill-current text-slate-900"
                      aria-label="ตราครุฑ 3 ซม."
                    >
                      <path d="M50 8 C48 15, 42 20, 35 24 C28 28, 20 28, 12 32 C22 36, 32 38, 40 40 C32 44, 20 48, 10 58 C24 56, 36 54, 45 52 C38 60, 30 70, 25 82 C35 76, 43 68, 48 60 L50 92 L52 60 C57 68, 65 76, 75 82 C70 70, 62 60, 55 52 C64 54, 76 56, 90 58 C80 48, 68 44, 60 40 C68 38, 78 36, 88 32 C80 28, 72 28, 65 24 C58 20, 52 15, 50 8 Z" />
                    </svg>
                  </div>

                  <div className="flex-1 text-center pt-5">
                    <h1 className="text-3xl font-extrabold tracking-wide text-black">
                      บันทึกข้อความ
                    </h1>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-4 space-y-2 text-sm border-b-2 border-black pb-3">
                  <div className="flex items-baseline">
                    <span className="font-bold w-24">ส่วนราชการ</span>
                    <span className="flex-1">
                      วิทยาลัยสารพัดช่างน่าน {teacher.department} โทรศัพท์ 0-54xx-xxxx
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline">
                      <span className="font-bold w-24">ที่</span>
                      <span>วสช. {course.code}/พิเศษ</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="font-bold mr-2">วันที่</span>
                      <span>{todayDate}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline">
                    <span className="font-bold w-24">เรื่อง</span>
                    <span className="font-bold">
                      ขออนุมัติประกาศรายชื่อผู้หมดสิทธิ์เข้ารับการประเมินผลการเรียน
                      (ขร.) ภาคเรียนที่ {teacher.term} ปีการศึกษา {teacher.academicYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-sm">
                <p>
                  <span className="font-bold">เรียน</span>{" "}
                  รองผู้อำนวยการฝ่ายวิชาการ (ผ่านหัวหน้างานวัดผลและประเมินผล)
                </p>

                <p className="indent-10 text-justify">
                  ด้วยข้าพเจ้า {teacher.name} ตำแหน่ง ครูผู้สอน ได้รับมอบหมายให้ปฏิบัติการสอนในรายวิชา{" "}
                  <span className="font-bold">{course.name}</span> รหัสวิชา{" "}
                  <span className="font-bold">{course.code}</span> จำนวน{" "}
                  {course.credits} หน่วยกิต เวลาเรียนทั้งหมด {course.totalHours}{" "}
                  ชั่วโมง ในภาคเรียนที่ {teacher.term} ปีการศึกษา {teacher.academicYear} นั้น
                </p>

                <p className="indent-10 text-justify">
                  ตามระเบียบกระทรวงศึกษาธิการ ว่าด้วยการจัดการศึกษาและการประเมินผลการเรียน
                  กำหนดให้ผู้เรียนต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80
                  ของเวลาเรียนทั้งหมดในรายวิชานั้นๆ จึงจะมีสิทธิ์ได้รับการประเมินผลการเรียน
                  บัดนี้ ได้ทำการตรวจสอบเวลาเรียนแล้ว ปรากฏว่ามีนักเรียน/นักศึกษา
                  ที่มีเวลาเรียนต่ำกว่าร้อยละ 80 จึงหมดสิทธิ์สอบ (ขร.) จำนวนทั้งสิ้น{" "}
                  <span className="font-bold underline text-red-600">{students.length}</span> คน
                  โดยมีรายละเอียดตามบัญชีรายชื่อแนบท้าย ดังนี้
                </p>

                {/* Table */}
                <div className="my-4 border border-black overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-slate-100 font-bold text-center">
                        <th className="border-r border-black p-2 w-10">ลำดับ</th>
                        <th className="border-r border-black p-2 w-28">
                          รหัสนักศึกษา
                        </th>
                        <th className="border-r border-black p-2 text-left">
                          ชื่อ - สกุล
                        </th>
                        <th className="border-r border-black p-2 w-24">ระดับ/กลุ่ม</th>
                        <th className="border-r border-black p-2 w-28">แผนกวิชา</th>
                        <th className="border-r border-black p-2 w-20">เวลาเรียน</th>
                        <th className="border-r border-black p-2 w-16">% เวลาเรียน</th>
                        <th className="p-2 w-24">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((att, idx) => (
                        <tr
                          key={att.id}
                          className="border-b border-black last:border-0 text-center"
                        >
                          <td className="border-r border-black p-2">{idx + 1}</td>
                          <td className="border-r border-black p-2 font-mono">
                            {att.student.studentId}
                          </td>
                          <td className="border-r border-black p-2 text-left font-medium">
                            {att.student.prefix}
                            {att.student.firstName} {att.student.lastName}
                          </td>
                          <td className="border-r border-black p-2">
                            {att.student.level} ({att.student.classGroup})
                          </td>
                          <td className="border-r border-black p-2 text-left">
                            {att.student.department}
                          </td>
                          <td className="border-r border-black p-2">
                            {att.attendedHours}/{att.totalHours} ชม.
                          </td>
                          <td className="border-r border-black p-2 font-bold text-red-600">
                            {att.attendanceRate.toFixed(1)}%
                          </td>
                          <td className="p-2 text-center text-[11px]"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="indent-10">
                  จึงเรียนมาเพื่อโปรดทราบ และพิจารณาประกาศรายชื่อผู้หมดสิทธิ์เข้ารับการประเมินผลการเรียน
                  (ขร.) ดังกล่าวต่อไป
                </p>
              </div>

              {/* 4 Signature Blocks */}
              <div className="mt-12 grid grid-cols-2 gap-8 text-xs">
                {/* 1. Teacher */}
                <div className="text-center space-y-2">
                  <p className="font-semibold">1. ครูผู้สอน</p>
                  <div className="pt-4">
                    <p>ลงชื่อ.......................................................</p>
                    <p className="mt-1">({teacher.name})</p>
                    <p className="text-slate-600">ครูผู้สอน</p>
                    <p className="text-slate-500">วันที่ ......./......./.......</p>
                  </div>
                </div>

                {/* 2. Head of Program */}
                <div className="text-center space-y-2">
                  <p className="font-semibold">2. ความเห็นหัวหน้าสาขาวิชา</p>
                  <div className="pt-4">
                    <p>ลงชื่อ.......................................................</p>
                    <p className="mt-1">(.......................................................)</p>
                    <p className="text-slate-600">หัวหน้าสาขาวิชา</p>
                    <p className="text-slate-500">วันที่ ......./......./.......</p>
                  </div>
                </div>

                {/* 3. Head of Evaluation */}
                <div className="text-center space-y-2 pt-6">
                  <p className="font-semibold">3. ความเห็นหัวหน้างานวัดผลและประเมินผล</p>
                  <div className="pt-4">
                    <p>ลงชื่อ.......................................................</p>
                    <p className="mt-1">(.......................................................)</p>
                    <p className="text-slate-600">หัวหน้างานวัดผลและประเมินผล</p>
                    <p className="text-slate-500">วันที่ ......./......./.......</p>
                  </div>
                </div>

                {/* 4. Deputy Director for Academic Affairs */}
                <div className="text-center space-y-2 pt-6">
                  <p className="font-semibold">4. คำสั่ง / การพิจารณา</p>
                  <div className="flex justify-center gap-4 text-[11px] mb-2">
                    <span>[ &nbsp; ] ทราบ / อนุมัติ</span>
                    <span>[ &nbsp; ] อื่นๆ .............................</span>
                  </div>
                  <div className="pt-2">
                    <p>ลงชื่อ.......................................................</p>
                    <p className="mt-1">(.......................................................)</p>
                    <p className="text-slate-600 font-bold">รองผู้อำนวยการฝ่ายวิชาการ</p>
                    <p className="text-slate-500">วันที่ ......./......./.......</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
