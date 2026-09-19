export type AttendanceStatus = 'NORMAL' | 'RISK' | 'KHOR_ROR';

export type SubmissionStatus = 'UNSUBMITTED' | 'SUBMITTED' | 'APPROVED';

export interface Student {
  id: string;
  studentId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  level: string; // e.g., 'ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2'
  department: string; // e.g., 'ช่างยนต์', 'คอมพิวเตอร์ธุรกิจ', 'ช่างไฟฟ้ากำลัง', 'การบัญชี'
  classGroup: string; // e.g., 'ชย.1/1', 'คธ.2/1', 'ชฟ.1/2'
  avatarUrl?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalHours: number;
  term: number;
  academicYear: number;
  teacherName: string;
  teacherDepartment: string;
  room: string;
  totalStudents: number;
}

export interface StudentAttendance {
  id: string;
  student: Student;
  courseId: string;
  totalHours: number;
  attendedHours: number;
  absentHours: number;
  leaveHours: number;
  lateHours: number;
  attendanceRate: number; // percentage e.g. 78.5
  status: AttendanceStatus;
  submissionStatus: SubmissionStatus;
  remark?: string;
  lastCheckedDate?: string;
}

export interface AttendanceFilterState {
  searchQuery: string;
  level: string;
  department: string;
  classGroup: string;
  status: 'ALL' | AttendanceStatus;
}

export interface TeacherProfile {
  id: string;
  name: string;
  role: 'TEACHER' | 'ADMIN';
  department: string;
  email: string;
  academicYear: number;
  term: number;
}

export interface AdminProfile {
  id: string;
  name: string;
  role: 'ADMIN';
  department: string;
  email: string;
  academicYear: number;
  term: number;
}

export interface KhorRorSubmissionSummary {
  id: string;
  memoNumber: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  teacherDepartment: string;
  studentCount: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  students: StudentAttendance[];
}
