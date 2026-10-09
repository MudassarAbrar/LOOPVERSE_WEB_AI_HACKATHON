import {
  User,
  StudentProfile,
  Branch,
  Course,
  ExamSlot,
  ChangeRequest,
  AuditLog,
  EmailLog,
  PaginatedResult
} from '../types/index.ts';

const TOKEN_KEY = 'examslot_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User; studentProfile: StudentProfile | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyToken: (token: string) =>
    request<{ valid: boolean; email: string }>('/api/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  setPassword: (token: string, password: string) =>
    request<{ message: string; token: string; user: User; studentProfile: StudentProfile | null }>(
      '/api/auth/set-password',
      {
        method: 'POST',
        body: JSON.stringify({ token, password })
      }
    ),

  getMe: () =>
    request<{ user: User; studentProfile: StudentProfile | null }>('/api/auth/me'),

  // Admin Branches
  getBranches: (page = 1, limit = 10, search = '', status = '') =>
    request<PaginatedResult<Branch>>(
      `/api/admin/branches?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`
    ),

  createBranch: (data: Partial<Branch>) =>
    request<Branch>('/api/admin/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateBranch: (id: string, data: Partial<Branch>) =>
    request<Branch>(`/api/admin/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteBranch: (id: string) =>
    request<{ message: string; softDeleted?: boolean }>(`/api/admin/branches/${id}`, {
      method: 'DELETE'
    }),

  // Admin Courses
  getCourses: (page = 1, limit = 10, search = '', department = '') =>
    request<PaginatedResult<Course>>(
      `/api/admin/courses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}`
    ),

  createCourse: (data: Partial<Course>) =>
    request<Course>('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCourse: (id: string, data: Partial<Course>) =>
    request<Course>(`/api/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCourse: (id: string) =>
    request<{ message: string }>(`/api/admin/courses/${id}`, {
      method: 'DELETE'
    }),

  // Admin Students
  getStudents: (page = 1, limit = 10, search = '', branchId = '') =>
    request<PaginatedResult<StudentProfile>>(
      `/api/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&branchId=${branchId}`
    ),

  createStudent: (data: any) =>
    request<{ student: StudentProfile; setupToken: string; message: string }>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateStudent: (id: string, data: Partial<StudentProfile>) =>
    request<StudentProfile>(`/api/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteStudent: (id: string) =>
    request<{ message: string }>(`/api/admin/students/${id}`, {
      method: 'DELETE'
    }),

  resendStudentInvite: (id: string) =>
    request<{ message: string; token: string }>(`/api/admin/students/${id}/resend-invite`, {
      method: 'POST'
    }),

  assignCourses: (studentId: string, courseIds: string[]) =>
    request<{ message: string; assignedCourseIds: string[] }>(`/api/admin/students/${studentId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ courseIds })
    }),

  // Admin Slots
  getSlots: (page = 1, limit = 10, search = '', courseId = '') =>
    request<PaginatedResult<ExamSlot>>(
      `/api/admin/slots?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&courseId=${courseId}`
    ),

  createSlot: (data: Partial<ExamSlot>) =>
    request<ExamSlot>('/api/admin/slots', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateSlot: (id: string, data: Partial<ExamSlot>) =>
    request<ExamSlot>(`/api/admin/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteSlot: (id: string) =>
    request<{ message: string }>(`/api/admin/slots/${id}`, {
      method: 'DELETE'
    }),

  // Admin Requests
  getRequests: (page = 1, limit = 10, search = '', status = '', type = '') =>
    request<PaginatedResult<ChangeRequest>>(
      `/api/admin/requests?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}&type=${type}`
    ),

  reviewRequest: (id: string, action: 'APPROVE' | 'REJECT', adminRemark?: string) =>
    request<{ message: string; request: ChangeRequest }>(`/api/admin/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, adminRemark })
    }),

  // Admin Analytics & Audit
  getAnalytics: () =>
    request<{
      counts: {
        totalStudents: number;
        savedDateSheets: number;
        branchSelected: number;
        pendingRequests: number;
        totalBranches: number;
        totalCourses: number;
        totalSlots: number;
        dateSheetCompletionRate: number;
      };
      branchStats: Array<{ name: string; code: string; studentCount: number }>;
      courseStats: Array<{ code: string; title: string; enrolledStudents: number; bookedSelections: number }>;
    }>('/api/admin/analytics'),

  getAuditLogs: (page = 1, limit = 15, search = '') =>
    request<PaginatedResult<AuditLog>>(`/api/admin/audit-logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  // Student Panel
  getStudentProfile: () =>
    request<{ student: StudentProfile; branch: Branch | null; assignedCourses: Course[] }>('/api/student/profile'),

  selectBranch: (branchId: string) =>
    request<{ message: string; student: StudentProfile }>('/api/student/select-branch', {
      method: 'POST',
      body: JSON.stringify({ branchId })
    }),

  getAvailableSlots: () =>
    request<{
      assignedCourses: Course[];
      courseSlots: Record<string, ExamSlot[]>;
      isIncomplete?: boolean;
    }>('/api/student/available-slots'),

  saveDateSheet: (selections: Array<{ courseId: string; slotId: string }>) =>
    request<{ message: string; student: StudentProfile }>('/api/student/save-datesheet', {
      method: 'POST',
      body: JSON.stringify({ selections })
    }),

  getDateSheet: () =>
    request<{
      student: {
        fullName: string;
        regNumber: string;
        program: string;
        semester: number;
        sessionBatch: string;
        email: string;
        cnic: string;
      };
      branch: {
        name: string;
        code: string;
        city: string;
        address: string;
        contactNumber: string;
      } | null;
      entries: Array<{
        courseCode: string;
        courseTitle: string;
        creditHours: number;
        department: string;
        examDate: string;
        day: string;
        startTime: string;
        endTime: string;
      }>;
    }>('/api/student/datesheet'),

  submitChangeRequest: (requestType: 'CHANGE_BRANCH' | 'CHANGE_DATESHEET', reason: string) =>
    request<{ message: string; request: ChangeRequest }>('/api/student/change-request', {
      method: 'POST',
      body: JSON.stringify({ requestType, reason })
    }),

  getMyRequests: () =>
    request<ChangeRequest[]>('/api/student/requests'),

  // Emails
  getEmails: (email?: string) =>
    request<EmailLog[]>(`/api/emails${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  markEmailRead: (id: string) =>
    request<{ success: boolean }>(`/api/emails/${id}/read`, {
      method: 'POST'
    }),

  // Reset demo
  resetDemo: () =>
    request<{ message: string }>('/api/demo/reset', { method: 'POST' })
};
