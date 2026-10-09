export type Role = 'ADMIN' | 'STUDENT';
export type BranchStatus = 'ACTIVE' | 'INACTIVE';
export type CourseStatus = 'ACTIVE' | 'INACTIVE';
export type RequestType = 'CHANGE_BRANCH' | 'CHANGE_DATESHEET';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  contactNumber: string;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  creditHours: number;
  department: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  slotCount?: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  // Personal
  fullName: string;
  email: string;
  phone: string;
  cnic: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  photoUrl?: string;

  // Parent / Guardian
  fatherName: string;
  parentCnic: string;
  parentOccupation: string;
  parentPhone: string;
  emergencyContact: string;

  // Academic
  regNumber: string;
  program: string;
  semester: number;
  sessionBatch: string;
  prevQual: string;
  prevInstitute: string;
  cgpa: number;

  // State Machine Flags
  branchId?: string | null;
  branchName?: string;
  isBranchSelected: boolean;
  isDateSheetSaved: boolean;

  // Single-use unlock flags granted by admin approval
  branchUnlocked: boolean;
  dateSheetUnlocked: boolean;

  // Course assignments
  assignedCourseIds: string[];

  createdAt: string;
  updatedAt: string;
}

export interface ExamSlot {
  id: string;
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number; // Seat capacity per slot (bonus)
  bookedSeats?: number;
  remainingSeats?: number;
  isFull?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSlotSelection {
  id: string;
  studentId: string;
  courseId: string;
  slotId: string;
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  regNumber?: string;
  requestType: RequestType;
  reason: string;
  status: RequestStatus;
  adminRemark?: string;
  dateRaised: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  link?: string;
  type: 'PASSWORD_SETUP' | 'PASSWORD_RESET' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED';
  timestamp: string;
  read: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
