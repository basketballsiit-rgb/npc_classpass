"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  Printer,
  Send,
  CheckSquare,
  RefreshCw,
} from "lucide-react";
import { AttendanceFilterState, AttendanceStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchFilterBarProps {
  filter: AttendanceFilterState;
  onFilterChange: (newFilter: Partial<AttendanceFilterState>) => void;
  onSelectAllKhorRor: () => void;
  onSubmitToAdmin: () => void;
  onOpenPrintModal: () => void;
  selectedCount: number;
  khorRorCount: number;
  availableLevels: string[];
  availableDepartments: string[];
  availableClassGroups: string[];
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filter,
  onFilterChange,
  onSelectAllKhorRor,
  onSubmitToAdmin,
  onOpenPrintModal,
  selectedCount,
  khorRorCount,
  availableLevels,
  availableDepartments,
  availableClassGroups,
}) => {
  // Local state for debounced search
  const [searchTerm, setSearchTerm] = useState(filter.searchQuery);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ searchQuery: searchTerm });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    onFilterChange({
      searchQuery: "",
      level: "",
      department: "",
      classGroup: "",
      status: "ALL",
    });
  };

  const hasActiveFilters =
    filter.searchQuery !== "" ||
    filter.level !== "" ||
    filter.department !== "" ||
    filter.classGroup !== "" ||
    filter.status !== "ALL";

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Row 1: Search Bar & Batch Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Real-time Debounced Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ, หรือนามสกุล (Real-time Search)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 text-sm focus-visible:ring-[#0F1E36]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Toggle: Filter only <80% students */}
          <Button
            type="button"
            variant={filter.status === "KHOR_ROR" ? "danger" : "dangerOutline"}
            size="sm"
            onClick={() =>
              onFilterChange({
                status: filter.status === "KHOR_ROR" ? "ALL" : "KHOR_ROR",
              })
            }
            className="text-xs"
            title="แสดงเฉพาะผู้เรียนที่มีเวลาเรียนต่ำกว่า 80% เพื่อเตรียมแจ้งงานวัดผล"
          >
            🎯 {filter.status === "KHOR_ROR" ? "แสดงทั้งหมด" : `เช็คเฉพาะ ขร. (${khorRorCount})`}
          </Button>

          {/* Select all Khor Ror button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAllKhorRor}
            className="text-xs text-red-700 border-red-200 bg-red-50/50 hover:bg-red-100/70"
            title="เลือกเฉพาะนักเรียนที่มีเวลาเรียนต่ำกว่า 80%"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            เลือก ขร. ทั้งหมด ({khorRorCount})
          </Button>

          {/* Submit to Admin Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={selectedCount === 0}
            onClick={onSubmitToAdmin}
            className="text-xs bg-[#0F1E36] hover:bg-[#1A2E4D]"
          >
            <Send className="h-3.5 w-3.5 mr-1 text-[#C5A059]" />
            ส่งรายชื่อไปงานวัดผล ({selectedCount})
          </Button>

          {/* Print Official Thai Memo Button (Crucial Feature) */}
          <Button
            type="button"
            variant="gold"
            size="sm"
            onClick={onOpenPrintModal}
            className="text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            🖨️ พิมพ์ประกาศ ขร.
          </Button>
        </div>
      </div>

      {/* Row 2: Dropdown Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
        {/* Level Filter (ระดับชั้น) */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
            ระดับชั้น (Level)
          </label>
          <Select
            value={filter.level}
            onChange={(e) => onFilterChange({ level: e.target.value })}
          >
            <option value="">ทุกระดับชั้น</option>
            {availableLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </Select>
        </div>

        {/* Department Filter (แผนกวิชา) */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
            แผนกวิชา (Department)
          </label>
          <Select
            value={filter.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
          >
            <option value="">ทุกแผนกวิชา</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </div>

        {/* Class Group Filter (กลุ่มเรียน) */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
            กลุ่มเรียน (Class Group)
          </label>
          <Select
            value={filter.classGroup}
            onChange={(e) => onFilterChange({ classGroup: e.target.value })}
          >
            <option value="">ทุกกลุ่มเรียน</option>
            {availableClassGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </Select>
        </div>

        {/* Status Filter Dropdown / Quick Reset */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
            สถานะเวลาเรียน (Status)
          </label>
          <Select
            value={filter.status}
            onChange={(e) =>
              onFilterChange({
                status: e.target.value as "ALL" | AttendanceStatus,
              })
            }
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="KHOR_ROR">🔴 หมดสิทธิ์สอบ ขร. (&lt; 80%)</option>
            <option value="RISK">🟠 เฝ้าระวัง เสี่ยง ขร. (80-84.9%)</option>
            <option value="NORMAL">🟢 ปกติ (&ge; 85%)</option>
          </Select>
        </div>
      </div>

      {/* Row 3: Active Filters Pills and Reset Button */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3" /> ตัวกรองที่เปิดใช้:
          </span>

          {filter.searchQuery && (
            <Badge variant="secondary" className="gap-1 text-xs">
              คำค้น: "{filter.searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  setSearchTerm("");
                  onFilterChange({ searchQuery: "" });
                }}
              />
            </Badge>
          )}

          {filter.level && (
            <Badge variant="secondary" className="gap-1 text-xs">
              ระดับ: {filter.level}
              <X
                className="h-3 w-3 cursor-pointer hover:text-slate-900"
                onClick={() => onFilterChange({ level: "" })}
              />
            </Badge>
          )}

          {filter.department && (
            <Badge variant="secondary" className="gap-1 text-xs">
              แผนก: {filter.department}
              <X
                className="h-3 w-3 cursor-pointer hover:text-slate-900"
                onClick={() => onFilterChange({ department: "" })}
              />
            </Badge>
          )}

          {filter.classGroup && (
            <Badge variant="secondary" className="gap-1 text-xs">
              กลุ่ม: {filter.classGroup}
              <X
                className="h-3 w-3 cursor-pointer hover:text-slate-900"
                onClick={() => onFilterChange({ classGroup: "" })}
              />
            </Badge>
          )}

          {filter.status !== "ALL" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              สถานะ:{" "}
              {filter.status === "KHOR_ROR"
                ? "หมดสิทธิ์สอบ ขร."
                : filter.status === "RISK"
                ? "เฝ้าระวัง เสี่ยง ขร."
                : "ปกติ"}
              <X
                className="h-3 w-3 cursor-pointer hover:text-slate-900"
                onClick={() => onFilterChange({ status: "ALL" })}
              />
            </Badge>
          )}

          <button
            onClick={handleResetFilters}
            className="text-xs text-[#C5A059] hover:text-[#9E7A2B] font-semibold underline ml-1 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
