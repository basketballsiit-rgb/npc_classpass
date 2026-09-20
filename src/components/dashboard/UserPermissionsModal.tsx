"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Building,
  Mail,
  UserCheck,
} from "lucide-react";
import { getAssetPath } from "@/lib/utils";

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  department: string;
  role: "TEACHER" | "ADMIN";
  position?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLEGE_DEPARTMENTS = [
  "แผนกวิชาช่างยนต์",
  "แผนกวิชาช่างไฟฟ้ากำลัง",
  "แผนกวิชาช่างอิเล็กทรอนิกส์",
  "แผนกวิชาช่างกลโรงงาน",
  "แผนกวิชาช่างเชื่อมโลหะ",
  "แผนกวิชาการบัญชี",
  "แผนกวิชาการตลาด",
  "แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
  "แผนกวิชาเทคโนโลยีสารสนเทศ",
  "แผนกวิชาอาหารและโภชนาการ",
  "แผนกวิชาสามัญสัมพันธ์",
  "งานวัดผลและประเมินผล",
  "งานทะเบียน",
  "ฝ่ายวิชาการ",
];

export function UserPermissionsModal({ isOpen, onClose }: UserPermissionsModalProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "TEACHER" | "ADMIN">("ALL");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State for Adding New User
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState(COLLEGE_DEPARTMENTS[0]);
  const [newRole, setNewRole] = useState<"TEACHER" | "ADMIN">("TEACHER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users from API
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getAssetPath("/api/users/permissions"));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setNotification(null);
    }
  }, [isOpen]);

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Switch role handler
  const handleToggleRole = async (user: SystemUser) => {
    const nextRole: "TEACHER" | "ADMIN" = user.role === "ADMIN" ? "TEACHER" : "ADMIN";
    try {
      const res = await fetch(getAssetPath("/api/users/permissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          email: user.email,
          role: nextRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, role: nextRole } : u))
        );
        showToast(
          "success",
          `เปลี่ยนสิทธิ์ของ "${user.name || user.email}" เป็น ${nextRole === "ADMIN" ? "งานวัดผล (Admin)" : "ครูผู้สอน"} เรียบร้อยแล้ว`
        );
      } else {
        showToast("error", data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์");
      }
    } catch (err) {
      showToast("error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อเปลี่ยนสิทธิ์ได้");
    }
  };

  // Add new user handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showToast("error", "กรุณากรอกอีเมล");
      return;
    }
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      showToast("error", "รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getAssetPath("/api/users/permissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          email: cleanEmail,
          name: newName.trim() || cleanEmail.split("@")[0],
          department: newDept,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `เพิ่มผู้ใช้งาน "${cleanEmail}" เรียบร้อยแล้ว`);
        setNewEmail("");
        setNewName("");
        setIsAddUserOpen(false);
        loadUsers();
      } else {
        showToast("error", data.error || "บันทึกผู้ใช้ไม่สำเร็จ");
      }
    } catch (err) {
      showToast("error", "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user permission handler
  const handleDeleteUser = async (user: SystemUser) => {
    if (!confirm(`คุณต้องการลบสิทธิ์ของ "${user.name || user.email}" ออกจากระบบหรือไม่?`)) return;
    try {
      const res = await fetch(getAssetPath("/api/users/permissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showToast("success", `ลบสิทธิ์ของ "${user.email}" เรียบร้อยแล้ว`);
      }
    } catch (err) {
      showToast("error", "เกิดข้อผิดพลาดในการลบผู้ใช้งาน");
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q));
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      {/* Modal Header */}
      <div className="p-6 bg-gradient-to-r from-[#9E8DF4] via-[#8D7BEB] to-[#7964E1] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wide">
              กำหนดสิทธิ์ผู้ใช้งาน (User Permission Management)
            </h3>
            <p className="text-xs text-purple-100 font-medium">
              กำหนดบทบาทบุคลากรระหว่าง ครูผู้สอน (TEACHER) และ งานวัดผล/ผู้ดูแลระบบ (ADMIN)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2 rounded-full bg-white text-[#7964E1] font-bold text-xs shadow-md hover:bg-purple-50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>เพิ่มผู้ใช้งาน</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-[#FAF8FE]">
        {/* Toast Alert */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all shadow-xs ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EADBFA] shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#A79FC2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล @npc.ac.th, หรือแผนก..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full border border-[#E2D8F7] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] placeholder:text-[#A79FC2] focus:outline-none focus:border-[#8C78EA] focus:bg-white"
            />
          </div>

          <div className="inline-flex rounded-full bg-[#F3EEFA] p-1 border border-[#EAE3F5] text-xs font-bold self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                roleFilter === "ALL" ? "bg-[#8C78EA] text-white shadow-xs" : "text-[#857E9E] hover:text-[#2B244D]"
              }`}
            >
              ทั้งหมด ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("TEACHER")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                roleFilter === "TEACHER" ? "bg-[#8C78EA] text-white shadow-xs" : "text-[#857E9E] hover:text-[#2B244D]"
              }`}
            >
              ครูผู้สอน ({users.filter((u) => u.role === "TEACHER").length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("ADMIN")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                roleFilter === "ADMIN" ? "bg-[#8C78EA] text-white shadow-xs" : "text-[#857E9E] hover:text-[#2B244D]"
              }`}
            >
              งานวัดผล ({users.filter((u) => u.role === "ADMIN").length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-[#EADBFA] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4EFFC] text-[#2B244D] font-black border-b border-[#EAE3F5]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">ที่</th>
                <th className="py-3 px-4 min-w-[160px]">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 min-w-[180px]">อีเมลสถานศึกษา</th>
                <th className="py-3 px-4 min-w-[140px]">แผนกวิชา</th>
                <th className="py-3 px-4 min-w-[150px] text-center">สิทธิ์ปัจจุบัน (คลิกเพื่อเปลี่ยน)</th>
                <th className="py-3 px-4 w-16 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBF7]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-[#857E9E]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#8C78EA]" />
                      <span>กำลังโหลดรายชื่อผู้ใช้งาน...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-[#857E9E]">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-7 w-7 text-[#D5C7F2] mb-1" />
                      <p className="font-bold text-xs text-[#2B244D]">ไม่พบรายชื่อผู้ใช้งานที่ตรงกับเงื่อนไข</p>
                      <p className="text-[11px] text-[#A79FC2]">คลิกปุ่ม &quot;เพิ่มผู้ใช้งาน&quot; เพื่อระบุสิทธิ์ล่วงหน้า</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id || user.email} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-[#857E9E]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2B244D] text-xs sm:text-sm">
                        {user.name || "-"}
                      </div>
                      {user.position && (
                        <span className="text-[10px] text-[#857E9E] font-medium block">
                          {user.position}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-[#7A63E5] bg-[#FAF7FE] px-2 py-0.5 rounded-md border border-[#EAE3F5]">
                        {user.email}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5D5775] font-medium">
                      {user.department || (
                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ยังไม่ระบุ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRole(user)}
                        title="คลิกเพื่อสลับสิทธิ์ระหว่างครูผู้สอนและงานวัดผล"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs border active:scale-95 ${
                          user.role === "ADMIN"
                            ? "bg-[#EBF7FF] text-[#0284C7] border-[#BAE6FD] hover:bg-[#E0F2FE]"
                            : "bg-[#FAF7FE] text-[#7A63E5] border-[#D8CCED] hover:bg-[#F3EEFA]"
                        }`}
                      >
                        {user.role === "ADMIN" ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-[#0284C7]" />
                            <span>งานวัดผล (Admin)</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-3.5 w-3.5 text-[#7A63E5]" />
                            <span>ครูผู้สอน</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        title="ลบสิทธิ์"
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

        <div className="flex items-center justify-between text-xs text-[#857E9E] px-1 pt-1">
          <span>ผู้ใช้งานที่ล็อกอินผ่าน Google Workspace (@npc.ac.th) จะได้รับสิทธิ์ตามที่ระบุในตารางนี้</span>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full px-5 py-1.5 text-xs font-bold border-[#D8CCED] text-[#2B244D]"
          >
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>

      {/* Add User Sub-Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBF7]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#8C78EA] text-white flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h4 className="font-black text-[#2B244D] text-base">เพิ่มผู้ใช้งาน / กำหนดสิทธิ์ล่วงหน้า</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-xs font-bold text-[#857E9E] hover:text-[#2B244D] p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#2B244D] block">
                  อีเมล Google Workspace (@npc.ac.th) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-[#E2D8F7] bg-[#FAF7FE] focus-within:border-[#8C78EA] focus-within:bg-white">
                  <Mail className="absolute left-3 h-4 w-4 text-[#A79FC2]" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. somsak.v@npc.ac.th"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-[#2B244D] placeholder:text-[#A79FC2] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2B244D] block">ชื่อ - นามสกุล (ถ้ามี)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น อ.สมศักดิ์ วิจิตรกุล"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2D8F7] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] placeholder:text-[#A79FC2] focus:outline-none focus:border-[#8C78EA] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2B244D] block">แผนกวิชา / ฝ่ายงาน</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2D8F7] bg-[#FAF7FE] text-xs font-bold text-[#2B244D] focus:outline-none focus:border-[#8C78EA] focus:bg-white"
                >
                  {COLLEGE_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-[#2B244D] block">สิทธิ์การใช้งาน (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("TEACHER")}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newRole === "TEACHER"
                        ? "bg-[#FAF7FE] text-[#7A63E5] border-[#8C78EA] shadow-xs"
                        : "bg-white text-[#857E9E] border-[#EAE3F5]"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>ครูผู้สอน</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("ADMIN")}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newRole === "ADMIN"
                        ? "bg-[#EBF7FF] text-[#0284C7] border-[#0284C7] shadow-xs"
                        : "bg-white text-[#857E9E] border-[#EAE3F5]"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>งานวัดผล (Admin)</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0EBF7]">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-xs text-[#857E9E] hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full font-bold text-xs text-white bg-[#8C78EA] hover:bg-[#7B65E3] shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกผู้ใช้งาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}
