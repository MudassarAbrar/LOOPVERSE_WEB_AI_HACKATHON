import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  Branch,
  Course,
  StudentProfile,
  ExamSlot,
  StudentSlotSelection,
  ChangeRequest,
  AuditLog,
  EmailLog,
  PasswordToken,
  PaginatedResult
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  lastActive: number;
}

interface DatabaseSchema {
  users: User[];
  sessions?: SessionRecord[];
  passwordTokens: PasswordToken[];
  branches: Branch[];
  courses: Course[];
  students: StudentProfile[];
  slots: ExamSlot[];
  selections: StudentSlotSelection[];
  requests: ChangeRequest[];
  auditLogs: AuditLog[];
  emails: EmailLog[];
}

let db: DatabaseSchema;

import { seedSupabase } from './seed_supabase.ts';

export async function initDb(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Always seed or verify database
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      if (!Array.isArray(db.sessions)) {
        db.sessions = [];
      }
      if (
        Array.isArray(db.users) &&
        Array.isArray(db.branches) &&
        Array.isArray(db.courses) &&
        Array.isArray(db.students)
      ) {
        // Sync loaded db object to Supabase in background
        syncLoadedDbToSupabase(db).catch(err => console.error('[SUPABASE SYNC WARNING]', err));
        return;
      }
    } catch {
      // Re-seed if corrupted
    }
  }

  // Seed Initial Database both locally and on Supabase
  await seedDb();
  await seedSupabase().catch(err => console.error('[SUPABASE SEED ERROR]', err));
}

export function saveDb(): void {
  if (!db) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

export async function seedDb(): Promise<void> {
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', adminSalt);
  const studentSalt = await bcrypt.genSalt(10);
  const studentHash = await bcrypt.hash('Student@123', studentSalt);

  const adminUser: User = {
    id: 'user-admin-1',
    email: 'admin@examslot.edu',
    passwordHash: adminHash,
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const branches: Branch[] = [
    {
      id: 'br-lahore-1',
      code: 'LHR-01',
      name: 'Lahore Central Campus',
      city: 'Lahore',
      address: 'Plot 54, Block C, Canal Bank Road, Lahore',
      contactNumber: '+92-42-111-887-887',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'br-islamabad-2',
      code: 'ISB-02',
      name: 'Islamabad Capital Campus',
      city: 'Islamabad',
      address: 'Sector H-9/1, Kashmir Highway, Islamabad',
      contactNumber: '+92-51-111-887-888',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'br-karachi-3',
      code: 'KHI-03',
      name: 'Karachi City Campus',
      city: 'Karachi',
      address: 'Gulshan-e-Iqbal Block 7, Main University Road, Karachi',
      contactNumber: '+92-21-111-887-889',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'br-peshawar-4',
      code: 'PEW-04',
      name: 'Peshawar Valley Campus',
      city: 'Peshawar',
      address: 'University Road, Near Board of Intermediate, Peshawar',
      contactNumber: '+92-91-111-887-890',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const courses: Course[] = [
    {
      id: 'crs-cs101',
      code: 'CS101',
      title: 'Introduction to Computing & Algorithms',
      creditHours: 3,
      department: 'Computer Science',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-cs201',
      code: 'CS201',
      title: 'Object-Oriented Programming (C++ & Java)',
      creditHours: 4,
      department: 'Computer Science',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-cs301',
      code: 'CS301',
      title: 'Data Structures and Algorithms',
      creditHours: 3,
      department: 'Computer Science',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-cs304',
      code: 'CS304',
      title: 'Database Management Systems',
      creditHours: 3,
      department: 'Software Engineering',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-mth101',
      code: 'MTH101',
      title: 'Calculus and Analytical Geometry',
      creditHours: 3,
      department: 'Mathematics',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-phy101',
      code: 'PHY101',
      title: 'Applied Physics & Electromagnetism',
      creditHours: 3,
      department: 'Basic Sciences',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-eng101',
      code: 'ENG101',
      title: 'English Comprehension & Technical Writing',
      creditHours: 3,
      department: 'Humanities',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crs-mgt201',
      code: 'MGT201',
      title: 'Financial Accounting & Management',
      creditHours: 3,
      department: 'Management Sciences',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Exam Slots for each course (giving students real choice: morning and afternoon slots)
  const slots: ExamSlot[] = [];
  const baseDates = ['2026-11-10', '2026-11-12', '2026-11-14', '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-22', '2026-11-24'];

  courses.forEach((crs, idx) => {
    const d1 = baseDates[idx % baseDates.length];
    const d2 = baseDates[(idx + 2) % baseDates.length];

    // Slot 1: Morning
    slots.push({
      id: `slot-${crs.code.toLowerCase()}-m1`,
      courseId: crs.id,
      courseCode: crs.code,
      courseTitle: crs.title,
      examDate: d1,
      startTime: '09:00',
      endTime: '12:00',
      capacity: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Slot 2: Afternoon
    slots.push({
      id: `slot-${crs.code.toLowerCase()}-a1`,
      courseId: crs.id,
      courseCode: crs.code,
      courseTitle: crs.title,
      examDate: d1,
      startTime: '14:00',
      endTime: '17:00',
      capacity: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Slot 3: Alternative Day Morning (giving genuine flexibility)
    slots.push({
      id: `slot-${crs.code.toLowerCase()}-m2`,
      courseId: crs.id,
      courseCode: crs.code,
      courseTitle: crs.title,
      examDate: d2,
      startTime: '09:00',
      endTime: '12:00',
      capacity: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // 5 Students as required by specification
  const studentUsers: User[] = [
    {
      id: 'user-stu-1',
      email: 'ali.khan@student.examslot.edu',
      passwordHash: studentHash,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-stu-2',
      email: 'fatima.noor@student.examslot.edu',
      passwordHash: studentHash,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-stu-3',
      email: 'bilal.ahmed@student.examslot.edu',
      passwordHash: studentHash,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-stu-4',
      email: 'zainab.tariq@student.examslot.edu',
      passwordHash: studentHash,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-stu-5',
      email: 'hamza.malik@student.examslot.edu',
      passwordHash: studentHash,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const students: StudentProfile[] = [
    {
      id: 'stu-1',
      userId: 'user-stu-1',
      fullName: 'Ali Khan',
      email: 'ali.khan@student.examslot.edu',
      phone: '+92-300-1234567',
      cnic: '35202-1234567-1',
      dob: '2003-05-14',
      gender: 'Male',
      address: 'House 12, Street 4, Model Town, Lahore',
      fatherName: 'Muhammad Tariq Khan',
      parentCnic: '35202-9876543-1',
      parentOccupation: 'Senior Civil Engineer',
      parentPhone: '+92-321-9876543',
      emergencyContact: '+92-42-35889900',
      regNumber: 'BC210401890',
      program: 'BS Computer Science',
      semester: 4,
      sessionBatch: 'Fall 2024',
      prevQual: 'HSSC / FSc Pre-Engineering',
      prevInstitute: 'Punjab Group of Colleges, Lahore',
      cgpa: 3.72,
      branchId: 'br-lahore-1',
      branchName: 'Lahore Central Campus',
      isBranchSelected: true,
      isDateSheetSaved: false, // Ready for slot selection!
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: ['crs-cs101', 'crs-cs201', 'crs-cs301', 'crs-cs304', 'crs-mth101'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu-2',
      userId: 'user-stu-2',
      fullName: 'Fatima Noor',
      email: 'fatima.noor@student.examslot.edu',
      phone: '+92-333-5556677',
      cnic: '37405-7654321-2',
      dob: '2004-01-20',
      gender: 'Female',
      address: 'Apartment 4B, Silver Oak, F-10/2, Islamabad',
      fatherName: 'Dr. Noor Muhammad',
      parentCnic: '37405-1122334-3',
      parentOccupation: 'Medical Specialist',
      parentPhone: '+92-333-9998877',
      emergencyContact: '+92-51-2299880',
      regNumber: 'BC210402011',
      program: 'BS Software Engineering',
      semester: 3,
      sessionBatch: 'Spring 2024',
      prevQual: 'A-Levels (Sciences)',
      prevInstitute: 'Beaconhouse Margalla Campus, Islamabad',
      cgpa: 3.88,
      branchId: 'br-islamabad-2',
      branchName: 'Islamabad Capital Campus',
      isBranchSelected: true,
      isDateSheetSaved: true, // Already saved and locked date sheet!
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: ['crs-cs101', 'crs-cs201', 'crs-cs304', 'crs-eng101'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu-3',
      userId: 'user-stu-3',
      fullName: 'Bilal Ahmed',
      email: 'bilal.ahmed@student.examslot.edu',
      phone: '+92-345-4433221',
      cnic: '42101-5566778-9',
      dob: '2002-11-08',
      gender: 'Male',
      address: 'B-14, Darakhshan Villas, DHA Phase 6, Karachi',
      fatherName: 'Ahmed Raza',
      parentCnic: '42101-3322110-1',
      parentOccupation: 'Chartered Accountant',
      parentPhone: '+92-345-9988776',
      emergencyContact: '+92-21-35841234',
      regNumber: 'BC210403155',
      program: 'BS Information Technology',
      semester: 5,
      sessionBatch: 'Fall 2023',
      prevQual: 'FSc Pre-Engineering',
      prevInstitute: 'Adamjee Govt Science College, Karachi',
      cgpa: 3.45,
      branchId: null, // New student: Needs to do one-time branch selection!
      isBranchSelected: false,
      isDateSheetSaved: false,
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: ['crs-cs101', 'crs-cs201', 'crs-cs301', 'crs-mth101', 'crs-phy101'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu-4',
      userId: 'user-stu-4',
      fullName: 'Zainab Tariq',
      email: 'zainab.tariq@student.examslot.edu',
      phone: '+92-312-7788990',
      cnic: '35201-9988776-4',
      dob: '2003-08-30',
      gender: 'Female',
      address: 'House 77, Street 19, Cavalry Ground, Lahore',
      fatherName: 'Tariq Mehmood',
      parentCnic: '35201-5544332-1',
      parentOccupation: 'Business Owner',
      parentPhone: '+92-312-3322114',
      emergencyContact: '+92-42-36655443',
      regNumber: 'BC210404882',
      program: 'BS Computer Science',
      semester: 2,
      sessionBatch: 'Spring 2025',
      prevQual: 'ICS (Physics, Math, CS)',
      prevInstitute: 'Kinnaird College for Women, Lahore',
      cgpa: 3.65,
      branchId: 'br-lahore-1',
      branchName: 'Lahore Central Campus',
      isBranchSelected: true,
      isDateSheetSaved: false,
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: ['crs-cs101', 'crs-mth101'], // Incomplete course assignment! (< 4) for demonstrating assignment rule
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stu-5',
      userId: 'user-stu-5',
      fullName: 'Hamza Malik',
      email: 'hamza.malik@student.examslot.edu',
      phone: '+92-301-8899001',
      cnic: '17301-3344556-7',
      dob: '2003-03-25',
      gender: 'Male',
      address: 'House 10, Sector F, Hayatabad, Peshawar',
      fatherName: 'Malik Jahangir',
      parentCnic: '17301-8877665-9',
      parentOccupation: 'Government Officer',
      parentPhone: '+92-301-2233445',
      emergencyContact: '+92-91-5823456',
      regNumber: 'BC210405991',
      program: 'BS Software Engineering',
      semester: 4,
      sessionBatch: 'Fall 2024',
      prevQual: 'FSc Pre-Engineering',
      prevInstitute: 'Islamia College, Peshawar',
      cgpa: 3.52,
      branchId: 'br-peshawar-4',
      branchName: 'Peshawar Valley Campus',
      isBranchSelected: true,
      isDateSheetSaved: true,
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: ['crs-cs101', 'crs-cs201', 'crs-cs301', 'crs-mth101', 'crs-eng101'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Selections for Student 2 (Fatima Noor) and Student 5 (Hamza Malik) who already saved their date sheet
  const selections: StudentSlotSelection[] = [
    {
      id: 'sel-fn-1',
      studentId: 'stu-2',
      courseId: 'crs-cs101',
      slotId: 'slot-cs101-m1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-fn-2',
      studentId: 'stu-2',
      courseId: 'crs-cs201',
      slotId: 'slot-cs201-a1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-fn-3',
      studentId: 'stu-2',
      courseId: 'crs-cs304',
      slotId: 'slot-cs304-m1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-fn-4',
      studentId: 'stu-2',
      courseId: 'crs-eng101',
      slotId: 'slot-eng101-m1',
      createdAt: new Date().toISOString()
    },
    // Student 5 selections
    {
      id: 'sel-hm-1',
      studentId: 'stu-5',
      courseId: 'crs-cs101',
      slotId: 'slot-cs101-m2',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-hm-2',
      studentId: 'stu-5',
      courseId: 'crs-cs201',
      slotId: 'slot-cs201-m1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-hm-3',
      studentId: 'stu-5',
      courseId: 'crs-cs301',
      slotId: 'slot-cs301-m1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-hm-4',
      studentId: 'stu-5',
      courseId: 'crs-mth101',
      slotId: 'slot-mth101-m1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sel-hm-5',
      studentId: 'stu-5',
      courseId: 'crs-eng101',
      slotId: 'slot-eng101-a1',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Student Requests (one pending, one approved for demonstration)
  const requests: ChangeRequest[] = [
    {
      id: 'req-1',
      studentId: 'stu-5',
      studentName: 'Hamza Malik',
      studentEmail: 'hamza.malik@student.examslot.edu',
      regNumber: 'BC210405991',
      requestType: 'CHANGE_DATESHEET',
      reason: 'Have an overlapping family medical emergency on Nov 10; need to reschedule CS101 slot to morning shift.',
      status: 'PENDING',
      dateRaised: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'req-2',
      studentId: 'stu-2',
      studentName: 'Fatima Noor',
      studentEmail: 'fatima.noor@student.examslot.edu',
      regNumber: 'BC210402011',
      requestType: 'CHANGE_BRANCH',
      reason: 'Relocating to Lahore for family wedding during exam weeks.',
      status: 'APPROVED',
      adminRemark: 'Approved per university inter-campus transfer policy for exam sitting.',
      dateRaised: new Date(Date.now() - 86400000 * 2).toISOString(),
      resolvedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-1',
      adminEmail: 'admin@examslot.edu',
      action: 'SYSTEM_SEED',
      target: 'SYSTEM',
      details: 'System initialized with seed branches, courses, and students.',
      timestamp: new Date().toISOString()
    },
    {
      id: 'audit-2',
      adminEmail: 'admin@examslot.edu',
      action: 'APPROVE_REQUEST',
      target: 'Fatima Noor (BC210402011)',
      details: 'Approved branch change request with remark: Approved per university inter-campus transfer policy.',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const emails: EmailLog[] = [
    {
      id: 'email-welcome-1',
      to: 'ali.khan@student.examslot.edu',
      subject: 'Welcome to ExamSlot Portal - Account Setup',
      body: 'Your student portal account has been created for Spring 2026 examination sitting. Please set your password using the link below.',
      link: '/set-password?token=demo-token-ali-khan-1',
      type: 'PASSWORD_SETUP',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 'email-req-approved',
      to: 'fatima.noor@student.examslot.edu',
      subject: 'Change Request Approved - ExamSlot Portal',
      body: 'Your request for CHANGE_BRANCH has been approved by the examination controller. You may now re-select your preferred examination branch.',
      type: 'REQUEST_APPROVED',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ];

  const passwordTokens: PasswordToken[] = [
    {
      id: 'token-1',
      userId: 'user-stu-1',
      email: 'ali.khan@student.examslot.edu',
      token: 'demo-token-ali-khan-1',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      isUsed: true, // Mark used since student account already has active demo password Student@123
      createdAt: new Date().toISOString()
    }
  ];

  db = {
    users: [adminUser, ...studentUsers],
    passwordTokens,
    branches,
    courses,
    students,
    slots,
    selections,
    requests,
    auditLogs,
    emails
  };

  saveDb();
}

import { supabaseAdmin } from './supabase.ts';

// ----------------- RESILIENT DATABASE & CACHE HELPERS -----------------

export function getDb(): DatabaseSchema {
  return db;
}

export function getPersistedSessions(): SessionRecord[] {
  if (!db) return [];
  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
  }
  return db.sessions;
}

export function saveSessionRecord(session: SessionRecord): void {
  if (!db) return;
  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
  }
  const idx = db.sessions.findIndex(s => s.token === session.token);
  if (idx >= 0) {
    db.sessions[idx] = session;
  } else {
    db.sessions.push(session);
  }
  saveDb();
}

export function deleteSessionRecord(token: string): void {
  if (!db || !Array.isArray(db.sessions)) return;
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDb();
}

// Asynchronously sync mutations to Supabase in background
export function syncRecordToSupabase(table: string, record: any): void {
  if (!supabaseAdmin) return;
  Promise.resolve(supabaseAdmin.from(table).upsert(record))
    .then((res: any) => {
      if (res.error) {
        console.warn(`[SUPABASE ASYNC SYNC WARNING] Failed to sync ${table}:`, res.error.message);
      } else {
        console.log(`[SUPABASE ASYNC SYNC SUCCESS] Synced ${table} record`);
      }
    })
    .catch((err: any) => {
      console.warn(`[SUPABASE ASYNC SYNC ERROR] ${table}:`, err);
    });
}

export async function syncLoadedDbToSupabase(data: DatabaseSchema): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    for (const u of data.users) {
      await supabaseAdmin.from('users').upsert({
        id: u.id,
        email: u.email,
        password_hash: u.passwordHash,
        role: u.role
      }, { onConflict: 'email' });
    }
    for (const b of data.branches) {
      await supabaseAdmin.from('branches').upsert({
        id: b.id,
        code: b.code,
        name: b.name,
        city: b.city,
        address: b.address,
        contact_number: b.contactNumber,
        status: b.status
      }, { onConflict: 'code' });
    }
    for (const c of data.courses) {
      await supabaseAdmin.from('courses').upsert({
        id: c.id,
        course_code: c.code,
        title: c.title,
        credit_hours: c.creditHours,
        department: c.department,
        status: c.status
      }, { onConflict: 'course_code' });
    }
    for (const s of data.students) {
      await supabaseAdmin.from('student_profiles').upsert({
        id: s.id,
        user_id: s.userId,
        full_name: s.fullName,
        phone: s.phone,
        cnic: s.cnic,
        dob: s.dob,
        gender: s.gender,
        address: s.address,
        father_name: s.fatherName,
        parent_cnic: s.parentCnic,
        parent_occupation: s.parentOccupation,
        parent_phone: s.parentPhone,
        emergency_contact: s.emergencyContact,
        reg_number: s.regNumber,
        program: s.program,
        semester: s.semester,
        session_batch: s.sessionBatch,
        prev_qual: s.prevQual,
        prev_institute: s.prevInstitute,
        cgpa: s.cgpa,
        branch_id: s.branchId,
        is_branch_selected: s.isBranchSelected,
        is_datesheet_saved: s.isDateSheetSaved,
        branch_unlocked: s.branchUnlocked,
        datesheet_unlocked: s.dateSheetUnlocked
      }, { onConflict: 'reg_number' });
    }
  } catch (err) {
    console.warn('[SUPABASE DB SYNC WARNING]', err);
  }
}

// Audit Logger Helper (Bonus Feature)
export function logAudit(adminEmail: string, action: string, target: string, details?: string): void {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminEmail,
    action,
    target,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDb();

  const adminUser = db.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
  syncRecordToSupabase('audit_logs', {
    id: log.id,
    admin_id: adminUser ? adminUser.id : null,
    action: log.action,
    target_resource: log.target,
    details: { adminEmail, info: log.details || null },
    timestamp: log.timestamp
  });
}
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
  filterFn?: (item: T) => boolean
): PaginatedResult<T> {
  const filtered = filterFn ? items.filter(filterFn) : items;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      pageSize: limit
    }
  };
}

// Safe Delete Branch Check
export function canDeleteBranch(branchId: string): { canDelete: boolean; studentCount: number } {
  const studentCount = db.students.filter(s => s.branchId === branchId).length;
  return {
    canDelete: studentCount === 0,
    studentCount
  };
}

// Safe Delete Slot Check
export function canDeleteSlot(slotId: string): { canDelete: boolean; bookedCount: number } {
  const bookedCount = db.selections.filter(s => s.slotId === slotId).length;
  return {
    canDelete: bookedCount === 0,
    bookedCount
  };
}

// Check time overlap between two slot times (e.g. 09:00 - 12:00 vs 10:00 - 13:00)
export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

// Generate secure password reset / onboarding token
export function createPasswordToken(userId: string, email: string): PasswordToken {
  // Invalidate all previous unused tokens for this user so only the newest link works
  db.passwordTokens.forEach(t => {
    if (t.userId === userId && !t.isUsed) {
      t.isUsed = true;
    }
  });

  const token = crypto.randomBytes(32).toString('hex');
  const record: PasswordToken = {
    id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    email,
    token,
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    isUsed: false,
    createdAt: new Date().toISOString()
  };
  db.passwordTokens.push(record);
  saveDb();
  return record;
}

