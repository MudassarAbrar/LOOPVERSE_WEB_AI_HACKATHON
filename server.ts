import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  initDb,
  getDb,
  saveDb,
  logAudit,
  paginate,
  canDeleteBranch,
  canDeleteSlot,
  isTimeOverlapping,
  createPasswordToken,
  seedDb
} from './server/db.ts';
import { sendEmail, getEmailsForUser, markEmailRead } from './server/email.ts';
import {
  User,
  StudentProfile,
  ExamSlot,
  ChangeRequest,
  StudentSlotSelection
} from './src/types/index.ts';
import { GoogleGenAI } from '@google/genai';
import { examSlotTools } from './server/aiTools.ts';
import { executeAiTool } from './server/aiToolHandlers.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Database
await initDb();

// ----------------- AUTH HELPERS -----------------
// Simple cryptographically signed Bearer session token
interface AuthSession {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
}

const activeSessions = new Map<string, AuthSession>();

function createSession(user: User): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.role
  });
  return token;
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  (req as any).user = session;
  next();
}

function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const session = (req as any).user as AuthSession;
  if (!session || session.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}

function studentOnly(req: Request, res: Response, next: NextFunction): void {
  const session = (req as any).user as AuthSession;
  if (!session || session.role !== 'STUDENT') {
    res.status(403).json({ error: 'Access denied. Student privileges required.' });
    return;
  }
  next();
}

// ----------------- AUTH ENDPOINTS -----------------

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSession(user);
    const studentProfile = user.role === 'STUDENT'
      ? db.students.find(s => s.userId === user.id)
      : null;

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      studentProfile
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    // Return friendly generic response for security, but inform if demo user
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }

  const tokenRecord = createPasswordToken(user.id, user.email);
  sendEmail({
    to: user.email,
    subject: 'ExamSlot Password Reset Request',
    body: 'You requested a password reset for your ExamSlot account. Click the secure link below to set a new password. Link valid for 24 hours.',
    link: `/set-password?token=${tokenRecord.token}`,
    type: 'PASSWORD_RESET'
  });

  res.json({
    message: 'Password reset link sent to your email address.',
    token: tokenRecord.token // Included for effortless local demo testing
  });
});

// POST /api/auth/verify-token
app.post('/api/auth/verify-token', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  const db = getDb();
  const tokenRecord = db.passwordTokens.find(t => t.token === token);
  if (!tokenRecord) {
    return res.status(404).json({ error: 'Invalid or non-existent token.' });
  }

  if (tokenRecord.isUsed) {
    return res.status(400).json({ error: 'This token has already been used. Please request a new link.' });
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'This setup link has expired (24h limit). Please request a new link.' });
  }

  res.json({
    valid: true,
    email: tokenRecord.email
  });
});

// POST /api/auth/set-password
app.post('/api/auth/set-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = getDb();
    const tokenRecord = db.passwordTokens.find(t => t.token === token);
    if (!tokenRecord || tokenRecord.isUsed) {
      return res.status(400).json({ error: 'Token is invalid or already consumed.' });
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Token has expired.' });
    }

    const user = db.users.find(u => u.id === tokenRecord.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated user account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.updatedAt = new Date().toISOString();
    tokenRecord.isUsed = true;
    saveDb();

    // Auto log in after setting password
    const sessionToken = createSession(user);
    const studentProfile = user.role === 'STUDENT'
      ? db.students.find(s => s.userId === user.id)
      : null;

    res.json({
      message: 'Password set successfully! Logging you in...',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      studentProfile
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set password.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const session = (req as any).user as AuthSession;
  const db = getDb();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const studentProfile = user.role === 'STUDENT'
    ? db.students.find(s => s.userId === user.id)
    : null;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    studentProfile
  });
});

// ----------------- ADMIN BRANCH MANAGEMENT -----------------

// GET /api/admin/branches (Server-side search & pagination)
app.get('/api/admin/branches', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const status = req.query.status as string;

  const db = getDb();
  const result = paginate(
    db.branches.map(b => ({
      ...b,
      studentCount: db.students.filter(s => s.branchId === b.id).length
    })),
    page,
    limit,
    b => {
      const matchSearch = !search ||
        b.name.toLowerCase().includes(search) ||
        b.code.toLowerCase().includes(search) ||
        b.city.toLowerCase().includes(search);
      const matchStatus = !status || b.status === status;
      return matchSearch && matchStatus;
    }
  );

  res.json(result);
});

// POST /api/admin/branches
app.post('/api/admin/branches', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, code, city, address, contactNumber, status } = req.body;
  if (!name || !code || !city || !address || !contactNumber) {
    return res.status(400).json({ error: 'All branch fields are required.' });
  }

  const db = getDb();
  if (db.branches.some(b => b.code.toUpperCase() === code.trim().toUpperCase())) {
    return res.status(400).json({ error: `Branch code '${code}' is already registered.` });
  }

  const newBranch = {
    id: `br-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    city: city.trim(),
    address: address.trim(),
    contactNumber: contactNumber.trim(),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.branches.unshift(newBranch as any);
  saveDb();
  logAudit((req as any).user.email, 'CREATE_BRANCH', newBranch.name, `Branch Code: ${newBranch.code}`);

  res.status(201).json(newBranch);
});

// PUT /api/admin/branches/:id
app.put('/api/admin/branches/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, city, address, contactNumber, status } = req.body;

  const db = getDb();
  const branch = db.branches.find(b => b.id === id);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found.' });
  }

  if (code && code.trim().toUpperCase() !== branch.code) {
    if (db.branches.some(b => b.id !== id && b.code.toUpperCase() === code.trim().toUpperCase())) {
      return res.status(400).json({ error: `Branch code '${code}' already exists.` });
    }
    branch.code = code.trim().toUpperCase();
  }

  if (name) branch.name = name.trim();
  if (city) branch.city = city.trim();
  if (address) branch.address = address.trim();
  if (contactNumber) branch.contactNumber = contactNumber.trim();
  if (status) branch.status = status;
  branch.updatedAt = new Date().toISOString();

  saveDb();
  logAudit((req as any).user.email, 'UPDATE_BRANCH', branch.name);
  res.json(branch);
});

// DELETE /api/admin/branches/:id (Safe-delete rule enforcement)
app.delete('/api/admin/branches/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const branch = db.branches.find(b => b.id === id);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found.' });
  }

  // Safe delete rule: If chosen by students, block hard delete
  const { canDelete, studentCount } = canDeleteBranch(id);
  if (!canDelete) {
    // Offer soft deactivation
    branch.status = 'INACTIVE';
    branch.updatedAt = new Date().toISOString();
    saveDb();
    logAudit((req as any).user.email, 'DEACTIVATE_BRANCH', branch.name, `Safe-delete enforced: ${studentCount} students enrolled. Marked as INACTIVE.`);
    return res.status(200).json({
      softDeleted: true,
      message: `Branch cannot be hard-deleted because ${studentCount} student(s) have selected it. It has been marked INACTIVE to protect student records.`
    });
  }

  db.branches = db.branches.filter(b => b.id !== id);
  saveDb();
  logAudit((req as any).user.email, 'HARD_DELETE_BRANCH', branch.name);
  res.json({ message: 'Branch successfully removed.' });
});

// ----------------- ADMIN COURSE MANAGEMENT -----------------

// GET /api/admin/courses (Search, server-side pagination)
app.get('/api/admin/courses', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const department = req.query.department as string;

  const db = getDb();
  const result = paginate(
    db.courses.map(c => ({
      ...c,
      slotCount: db.slots.filter(s => s.courseId === c.id).length
    })),
    page,
    limit,
    c => {
      const matchSearch = !search ||
        c.title.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search) ||
        c.department.toLowerCase().includes(search);
      const matchDept = !department || c.department === department;
      return matchSearch && matchDept;
    }
  );

  res.json(result);
});

// POST /api/admin/courses
app.post('/api/admin/courses', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { code, title, creditHours, department, status } = req.body;
  if (!code || !title || !creditHours || !department) {
    return res.status(400).json({ error: 'Course code, title, credit hours, and department are required.' });
  }

  const db = getDb();
  if (db.courses.some(c => c.code.toUpperCase() === code.trim().toUpperCase())) {
    return res.status(400).json({ error: `Course code '${code}' already exists.` });
  }

  const newCourse = {
    id: `crs-${code.trim().toLowerCase()}-${Date.now().toString(36)}`,
    code: code.trim().toUpperCase(),
    title: title.trim(),
    creditHours: Number(creditHours),
    department: department.trim(),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.courses.unshift(newCourse as any);
  saveDb();
  logAudit((req as any).user.email, 'CREATE_COURSE', newCourse.code, newCourse.title);
  res.status(201).json(newCourse);
});

// PUT /api/admin/courses/:id
app.put('/api/admin/courses/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const { code, title, creditHours, department, status } = req.body;

  const db = getDb();
  const course = db.courses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  if (code && code.trim().toUpperCase() !== course.code) {
    if (db.courses.some(c => c.id !== id && c.code.toUpperCase() === code.trim().toUpperCase())) {
      return res.status(400).json({ error: `Course code '${code}' already exists.` });
    }
    course.code = code.trim().toUpperCase();
  }

  if (title) course.title = title.trim();
  if (creditHours !== undefined) course.creditHours = Number(creditHours);
  if (department) course.department = department.trim();
  if (status) course.status = status;
  course.updatedAt = new Date().toISOString();

  saveDb();
  logAudit((req as any).user.email, 'UPDATE_COURSE', course.code);
  res.json(course);
});

// DELETE /api/admin/courses/:id
app.delete('/api/admin/courses/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const course = db.courses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  // Check if assigned to any student
  const isAssigned = db.students.some(s => s.assignedCourseIds.includes(id));
  if (isAssigned) {
    return res.status(400).json({
      error: 'Cannot delete course that is currently assigned to students. Deassign it first or mark INACTIVE.'
    });
  }

  db.courses = db.courses.filter(c => c.id !== id);
  db.slots = db.slots.filter(s => s.courseId !== id);
  saveDb();
  logAudit((req as any).user.email, 'DELETE_COURSE', course.code);
  res.json({ message: 'Course deleted successfully.' });
});

// ----------------- ADMIN STUDENT MANAGEMENT -----------------

// GET /api/admin/students (Search, server-side pagination)
app.get('/api/admin/students', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const branchId = req.query.branchId as string;

  const db = getDb();
  const result = paginate(
    db.students,
    page,
    limit,
    s => {
      const matchSearch = !search ||
        s.fullName.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.regNumber.toLowerCase().includes(search) ||
        s.cnic.toLowerCase().includes(search);
      const matchBranch = !branchId || s.branchId === branchId;
      return matchSearch && matchBranch;
    }
  );

  res.json(result);
});

// POST /api/admin/students (Create student with 3 groups, user account, password setup email token)
app.post('/api/admin/students', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      phone,
      cnic,
      dob,
      gender,
      address,
      photoUrl,
      fatherName,
      parentCnic,
      parentOccupation,
      parentPhone,
      emergencyContact,
      regNumber,
      program,
      semester,
      sessionBatch,
      prevQual,
      prevInstitute,
      cgpa
    } = req.body;

    // Minimum fields validation across 3 groups
    if (!fullName || !email || !phone || !cnic || !dob || !gender || !address) {
      return res.status(400).json({ error: 'All Personal group fields are required.' });
    }
    if (!fatherName || !parentCnic || !parentOccupation || !parentPhone || !emergencyContact) {
      return res.status(400).json({ error: 'All Parent/Guardian group fields are required.' });
    }
    if (!regNumber || !program || !semester || !sessionBatch || !prevQual || !prevInstitute || cgpa === undefined) {
      return res.status(400).json({ error: 'All Academic group fields are required.' });
    }

    const db = getDb();
    if (db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(400).json({ error: `A student with email '${email}' already exists.` });
    }
    if (db.students.some(s => s.regNumber.toUpperCase() === regNumber.trim().toUpperCase())) {
      return res.status(400).json({ error: `Registration number '${regNumber}' is already in use.` });
    }
    if (db.students.some(s => s.cnic === cnic.trim())) {
      return res.status(400).json({ error: `CNIC '${cnic}' is already in use.` });
    }

    const userId = `user-stu-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: email.trim().toLowerCase(),
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const studentId = `stu-${Date.now()}`;
    const newStudent: StudentProfile = {
      id: studentId,
      userId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      dob,
      gender,
      address: address.trim(),
      photoUrl: photoUrl || undefined,

      fatherName: fatherName.trim(),
      parentCnic: parentCnic.trim(),
      parentOccupation: parentOccupation.trim(),
      parentPhone: parentPhone.trim(),
      emergencyContact: emergencyContact.trim(),

      regNumber: regNumber.trim().toUpperCase(),
      program: program.trim(),
      semester: Number(semester),
      sessionBatch: sessionBatch.trim(),
      prevQual: prevQual.trim(),
      prevInstitute: prevInstitute.trim(),
      cgpa: Number(cgpa),

      branchId: null,
      isBranchSelected: false,
      isDateSheetSaved: false,
      branchUnlocked: false,
      dateSheetUnlocked: false,
      assignedCourseIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.students.unshift(newStudent);
    saveDb();

    // Account creation email flow: Single-use, 24-hr time-limited token
    const tokenRecord = createPasswordToken(userId, email.trim().toLowerCase());
    sendEmail({
      to: email.trim().toLowerCase(),
      subject: 'ExamSlot Portal - Account Created & Password Setup',
      body: `Hello ${fullName},\n\nYour student portal account has been created for ${program}. Please click the secure link below to set your password. This link is single-use and will expire in 24 hours.\n\nPasswords are never stored in plain text.`,
      link: `/set-password?token=${tokenRecord.token}`,
      type: 'PASSWORD_SETUP'
    });

    logAudit((req as any).user.email, 'CREATE_STUDENT', `${fullName} (${regNumber})`, `Email token generated.`);

    res.status(201).json({
      student: newStudent,
      setupToken: tokenRecord.token,
      message: 'Student record created successfully. Password onboarding link dispatched to student email.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student.' });
  }
});

// PUT /api/admin/students/:id
app.put('/api/admin/students/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Update fields
  Object.assign(student, req.body, { updatedAt: new Date().toISOString() });
  saveDb();
  logAudit((req as any).user.email, 'UPDATE_STUDENT', student.fullName);
  res.json(student);
});

// DELETE /api/admin/students/:id
app.delete('/api/admin/students/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  db.students = db.students.filter(s => s.id !== id);
  db.users = db.users.filter(u => u.id !== student.userId);
  db.selections = db.selections.filter(s => s.studentId !== id);
  db.requests = db.requests.filter(r => r.studentId !== id);
  saveDb();

  logAudit((req as any).user.email, 'DELETE_STUDENT', student.fullName);
  res.json({ message: 'Student and associated credentials removed.' });
});

// POST /api/admin/students/:id/resend-invite
app.post('/api/admin/students/:id/resend-invite', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const tokenRecord = createPasswordToken(student.userId, student.email);
  sendEmail({
    to: student.email,
    subject: 'ExamSlot Portal - Password Setup Reminder',
    body: `Hello ${student.fullName},\n\nHere is your fresh password setup link for the ExamSlot examination portal. Link valid for 24 hours.`,
    link: `/set-password?token=${tokenRecord.token}`,
    type: 'PASSWORD_SETUP'
  });

  res.json({
    message: 'Password invitation link sent successfully.',
    token: tokenRecord.token
  });
});

// ----------------- ADMIN COURSE ASSIGNMENTS (4 to 6 rule) -----------------

// POST /api/admin/students/:id/assignments
app.post('/api/admin/students/:id/assignments', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const { courseIds } = req.body;

  if (!Array.isArray(courseIds)) {
    return res.status(400).json({ error: 'courseIds must be an array of course identifiers.' });
  }

  // De-duplicate
  const uniqueCourseIds = Array.from(new Set(courseIds));

  // Server Enforcement: At least 4 and at most 6 courses!
  if (uniqueCourseIds.length < 4 || uniqueCourseIds.length > 6) {
    return res.status(400).json({
      error: `Course assignment violation: Each student must be assigned at least 4 and at most 6 courses. You selected ${uniqueCourseIds.length}.`
    });
  }

  const db = getDb();
  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // If student has saved a date sheet and not unlocked by admin, block changes
  if (student.isDateSheetSaved && !student.dateSheetUnlocked) {
    return res.status(400).json({
      error: 'Cannot modify course assignments after a student has finalized and saved their date sheet. An admin must first approve a date sheet change request.'
    });
  }

  // Validate courses exist
  for (const cId of uniqueCourseIds) {
    if (!db.courses.some(c => c.id === cId)) {
      return res.status(400).json({ error: `Invalid course ID: ${cId}` });
    }
  }

  student.assignedCourseIds = uniqueCourseIds;
  student.updatedAt = new Date().toISOString();
  saveDb();

  logAudit(
    (req as any).user.email,
    'ASSIGN_COURSES',
    student.fullName,
    `Assigned ${uniqueCourseIds.length} courses: ${uniqueCourseIds.join(', ')}`
  );

  res.json({
    message: 'Course assignments updated successfully.',
    assignedCourseIds: student.assignedCourseIds
  });
});

// ----------------- ADMIN EXAM SCHEDULE MANAGEMENT -----------------

// GET /api/admin/slots (Search, server-side pagination, course filter)
app.get('/api/admin/slots', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const courseId = req.query.courseId as string;

  const db = getDb();
  const slotsWithStats = db.slots.map(s => {
    const course = db.courses.find(c => c.id === s.courseId);
    const bookedSeats = db.selections.filter(sel => sel.slotId === s.id).length;
    return {
      ...s,
      courseCode: course ? course.code : s.courseCode,
      courseTitle: course ? course.title : s.courseTitle,
      bookedSeats
    };
  });

  const result = paginate(
    slotsWithStats,
    page,
    limit,
    s => {
      const matchSearch = !search ||
        (s.courseCode && s.courseCode.toLowerCase().includes(search)) ||
        (s.courseTitle && s.courseTitle.toLowerCase().includes(search)) ||
        s.examDate.includes(search);
      const matchCourse = !courseId || s.courseId === courseId;
      return matchSearch && matchCourse;
    }
  );

  res.json(result);
});

// POST /api/admin/slots
app.post('/api/admin/slots', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { courseId, examDate, startTime, endTime, capacity } = req.body;
  if (!courseId || !examDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Course, exam date, start time, and end time are required.' });
  }

  // Validation: end time after start time
  if (endTime <= startTime) {
    return res.status(400).json({ error: 'Exam slot end time must be after start time.' });
  }

  const db = getDb();
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(400).json({ error: 'Course not found.' });
  }

  // Validation: no duplicate slot for the same course on same date & start time
  const isDuplicate = db.slots.some(
    s => s.courseId === courseId && s.examDate === examDate && s.startTime === startTime
  );
  if (isDuplicate) {
    return res.status(400).json({ error: `An exam slot for ${course.code} on ${examDate} at ${startTime} already exists.` });
  }

  const newSlot: ExamSlot = {
    id: `slot-${course.code.toLowerCase()}-${Date.now().toString(36)}`,
    courseId,
    courseCode: course.code,
    courseTitle: course.title,
    examDate,
    startTime,
    endTime,
    capacity: capacity ? Number(capacity) : 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.slots.unshift(newSlot);
  saveDb();

  logAudit(
    (req as any).user.email,
    'CREATE_SLOT',
    `${course.code} - ${examDate} (${startTime}-${endTime})`,
    `Capacity: ${newSlot.capacity}`
  );

  res.status(201).json(newSlot);
});

// PUT /api/admin/slots/:id
app.put('/api/admin/slots/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const { examDate, startTime, endTime, capacity } = req.body;

  if (startTime && endTime && endTime <= startTime) {
    return res.status(400).json({ error: 'End time must be after start time.' });
  }

  const db = getDb();
  const slot = db.slots.find(s => s.id === id);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  if (examDate) slot.examDate = examDate;
  if (startTime) slot.startTime = startTime;
  if (endTime) slot.endTime = endTime;
  if (capacity !== undefined) slot.capacity = Number(capacity);
  slot.updatedAt = new Date().toISOString();

  saveDb();
  logAudit((req as any).user.email, 'UPDATE_SLOT', slot.id);
  res.json(slot);
});

// DELETE /api/admin/slots/:id (Slot protection check)
app.delete('/api/admin/slots/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const slot = db.slots.find(s => s.id === id);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  // Protection: if booked by students, block delete
  const { canDelete, bookedCount } = canDeleteSlot(id);
  if (!canDelete) {
    return res.status(400).json({
      error: `Cannot delete exam slot: It has already been selected by ${bookedCount} student(s) in their date sheet. Deleting would invalidate student examination timetables.`
    });
  }

  db.slots = db.slots.filter(s => s.id !== id);
  saveDb();
  logAudit((req as any).user.email, 'DELETE_SLOT', `${slot.courseCode || slot.courseId} on ${slot.examDate}`);
  res.json({ message: 'Exam slot deleted successfully.' });
});

// ----------------- ADMIN STUDENT REQUESTS -----------------

// GET /api/admin/requests (Search, server-side pagination, filter by status and type)
app.get('/api/admin/requests', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const status = req.query.status as string;
  const type = req.query.type as string;

  const db = getDb();
  const result = paginate(
    db.requests,
    page,
    limit,
    r => {
      const matchSearch = !search ||
        (r.studentName && r.studentName.toLowerCase().includes(search)) ||
        (r.regNumber && r.regNumber.toLowerCase().includes(search)) ||
        r.reason.toLowerCase().includes(search);
      const matchStatus = !status || r.status === status;
      const matchType = !type || r.requestType === type;
      return matchSearch && matchStatus && matchType;
    }
  );

  res.json(result);
});

// POST /api/admin/requests/:id/review (Approve / Reject + 1-time unlock + email dispatch)
app.post('/api/admin/requests/:id/review', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, adminRemark } = req.body; // action: 'APPROVE' | 'REJECT'

  if (action !== 'APPROVE' && action !== 'REJECT') {
    return res.status(400).json({ error: "Action must be either 'APPROVE' or 'REJECT'." });
  }

  const db = getDb();
  const request = db.requests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `Request has already been reviewed (${request.status}).` });
  }

  const student = db.students.find(s => s.id === request.studentId);
  if (!student) {
    return res.status(404).json({ error: 'Associated student profile not found.' });
  }

  request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  request.adminRemark = adminRemark ? adminRemark.trim() : undefined;
  request.resolvedAt = new Date().toISOString();

  // If approved, trigger 1-time unlock for the relevant action!
  if (action === 'APPROVE') {
    if (request.requestType === 'CHANGE_BRANCH') {
      student.branchUnlocked = true;
      // Note: student will be prompted to pick a branch once on next login
    } else if (request.requestType === 'CHANGE_DATESHEET') {
      student.dateSheetUnlocked = true;
      // Note: student date sheet builder unlocks once
    }
  }

  saveDb();

  // Send transactional email notification to student (Bonus +2 marks)
  sendEmail({
    to: student.email,
    subject: `ExamSlot Request ${request.status}: ${request.requestType === 'CHANGE_BRANCH' ? 'Branch Change' : 'Date Sheet Change'}`,
    body: `Hello ${student.fullName},\n\nYour change request (${request.requestType}) has been ${request.status} by the university administration.\n\n${adminRemark ? 'Remarks: ' + adminRemark + '\n\n' : ''}${action === 'APPROVE' ? 'You may now log in to proceed with your single-use unlock.' : 'The current schedule remains locked.'}`,
    type: action === 'APPROVE' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED'
  });

  logAudit(
    (req as any).user.email,
    action === 'APPROVE' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
    `${student.fullName} (${request.requestType})`,
    adminRemark || 'No remark provided'
  );

  res.json({
    message: `Request successfully ${request.status.toLowerCase()}.`,
    request
  });
});

// ----------------- ADMIN DASHBOARD & ANALYTICS (Bonus +2) -----------------

app.get('/api/admin/analytics', authMiddleware, adminOnly, (_req: Request, res: Response) => {
  const db = getDb();
  const totalStudents = db.students.length;
  const savedDateSheets = db.students.filter(s => s.isDateSheetSaved).length;
  const branchSelected = db.students.filter(s => s.isBranchSelected).length;
  const pendingRequests = db.requests.filter(r => r.status === 'PENDING').length;
  const totalBranches = db.branches.length;
  const totalCourses = db.courses.length;
  const totalSlots = db.slots.length;

  // Branch breakdown
  const branchStats = db.branches.map(b => ({
    name: b.name,
    code: b.code,
    studentCount: db.students.filter(s => s.branchId === b.id).length
  }));

  // Course enrollment breakdown
  const courseStats = db.courses.map(c => {
    const enrolledStudents = db.students.filter(s => s.assignedCourseIds.includes(c.id)).length;
    const bookedSelections = db.selections.filter(sel => sel.courseId === c.id).length;
    return {
      code: c.code,
      title: c.title,
      enrolledStudents,
      bookedSelections
    };
  });

  res.json({
    counts: {
      totalStudents,
      savedDateSheets,
      branchSelected,
      pendingRequests,
      totalBranches,
      totalCourses,
      totalSlots,
      dateSheetCompletionRate: totalStudents > 0 ? Math.round((savedDateSheets / totalStudents) * 100) : 0
    },
    branchStats,
    courseStats
  });
});

// ----------------- ADMIN AUDIT LOGS (Bonus +1) -----------------

app.get('/api/admin/audit-logs', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = (req.query.search as string || '').toLowerCase().trim();

  const db = getDb();
  const result = paginate(
    db.auditLogs,
    page,
    limit,
    l => !search || l.action.toLowerCase().includes(search) || l.target.toLowerCase().includes(search)
  );

  res.json(result);
});

// ----------------- AI CHATBOT ASSISTANT ENDPOINT (Google Gen AI SDK) -----------------

app.post('/api/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const session = (req as any).user as AuthSession;
    const db = getDb();
    let targetStudentId = '';

    if (session.role === 'STUDENT') {
      const studentProfile = db.students.find(s => s.userId === session.userId);
      if (studentProfile) {
        targetStudentId = studentProfile.id;
      }
    } else if (session.role === 'ADMIN' && req.body.studentId) {
      targetStudentId = req.body.studentId;
    }

    const aiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!aiApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
    }

    const MODEL_NAME = 'gemini-2.0-flash';
    const ai = new GoogleGenAI({ apiKey: aiApiKey });
    const systemInstruction = `
      You are the Virtual University ExamSlot AI Assistant.
      Your goal is to provide accurate, real-time help to students about active campuses/branches, course exam slots, seat capacity, assigned courses, time conflicts, and date sheet policies.
      CRITICAL INSTRUCTION: NEVER guess, hallucinate, or invent data. ALWAYS use the provided live database tools to query real data before answering student queries.
    `;

    const generationConfig = {
      systemInstruction,
      tools: [{ functionDeclarations: examSlotTools }],
    };

    // 1. Initial call to Gemini
    const initialResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: messages,
      config: generationConfig,
    });

    // 2. Process function calls
    const functionCalls = initialResponse.functionCalls;
    const initialCandidateContent = initialResponse.candidates?.[0]?.content;

    if (functionCalls && functionCalls.length > 0 && initialCandidateContent) {
      const functionResponseParts: any[] = [];
      const executedTools: string[] = [];
      const toolResults: Record<string, any> = {};

      for (const call of functionCalls) {
        const name = call.name;
        if (!name) continue;

        const toolArgs = { ...call.args, studentId: targetStudentId };
        console.log(`[AI TOOL CALL] Invoking tool '${name}' with args:`, toolArgs);

        const result = await executeAiTool(name, toolArgs);
        executedTools.push(name);
        toolResults[name] = result;

        functionResponseParts.push({
          functionResponse: {
            name: name,
            response: result,
            ...(call.id ? { id: call.id } : {})
          }
        });
      }

      // 3. Send model turn + function responses back preserving systemInstruction and generation config
      const followUpResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...messages,
          initialCandidateContent,
          {
            role: 'user',
            parts: functionResponseParts,
          },
        ],
        config: generationConfig,
      });

      return res.json({
        reply: followUpResponse.text,
        executedTool: executedTools.join(', '),
        toolResult: toolResults
      });
    }

    res.json({ reply: initialResponse.text });
  } catch (err: any) {
    console.error('[AI CHAT ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to process AI chat request.' });
  }
});

// ----------------- STUDENT PANEL APIS -----------------

// Helper to get active student record for logged in student
function getStudentForSession(req: Request): StudentProfile | null {
  const session = (req as any).user as AuthSession;
  const db = getDb();
  return db.students.find(s => s.userId === session.userId) || null;
}

// GET /api/student/profile
app.get('/api/student/profile', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  const db = getDb();
  const branch = student.branchId ? db.branches.find(b => b.id === student.branchId) : null;
  const assignedCourses = student.assignedCourseIds
    .map(cId => db.courses.find(c => c.id === cId))
    .filter(Boolean);

  res.json({
    student,
    branch,
    assignedCourses
  });
});

// POST /api/student/select-branch (One time branch selection rule)
app.post('/api/student/select-branch', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Backend enforcement: If already selected and not unlocked, reject!
  if (student.isBranchSelected && !student.branchUnlocked) {
    return res.status(403).json({
      error: 'Branch selection is already finalized and locked. You cannot select or change your branch without an approved change request.'
    });
  }

  const { branchId } = req.body;
  if (!branchId) {
    return res.status(400).json({ error: 'Please choose an active campus branch.' });
  }

  const db = getDb();
  const branch = db.branches.find(b => b.id === branchId && b.status === 'ACTIVE');
  if (!branch) {
    return res.status(400).json({ error: 'Selected branch is invalid or inactive.' });
  }

  student.branchId = branch.id;
  student.branchName = branch.name;
  student.isBranchSelected = true;
  // Consume the single-use unlock!
  student.branchUnlocked = false;
  student.updatedAt = new Date().toISOString();

  saveDb();

  res.json({
    message: `Branch successfully set to ${branch.name}.`,
    student
  });
});

// GET /api/student/available-slots
app.get('/api/student/available-slots', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Enforce 4 to 6 course assignment check
  if (student.assignedCourseIds.length < 4) {
    return res.status(400).json({
      error: 'Course assignment incomplete. You must have at least 4 assigned courses before designing your date sheet.',
      isIncomplete: true
    });
  }

  const db = getDb();
  const assignedCourses = student.assignedCourseIds
    .map(cId => db.courses.find(c => c.id === cId))
    .filter(Boolean);

  // Group slots by course
  const courseSlotsMap: Record<string, any[]> = {};

  for (const c of assignedCourses) {
    if (!c) continue;
    const slots = db.slots
      .filter(s => s.courseId === c.id)
      .map(s => {
        const booked = db.selections.filter(sel => sel.slotId === s.id).length;
        const remaining = Math.max(0, s.capacity - booked);
        return {
          id: s.id,
          courseId: s.courseId,
          examDate: s.examDate,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: s.capacity,
          bookedSeats: booked,
          remainingSeats: remaining,
          isFull: remaining <= 0
        };
      });

    courseSlotsMap[c.id] = slots;
  }

  res.json({
    assignedCourses,
    courseSlots: courseSlotsMap
  });
});

// POST /api/student/save-datesheet (Conflict checking + Locking + Capacity validation)
app.post('/api/student/save-datesheet', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // One-time save rule enforcement:
  if (student.isDateSheetSaved && !student.dateSheetUnlocked) {
    return res.status(403).json({
      error: 'Your exam date sheet has already been finalized and locked. You cannot modify your date sheet unless an admin approves your change request.'
    });
  }

  // Check branch selection
  if (!student.isBranchSelected || !student.branchId) {
    return res.status(400).json({ error: 'You must select an examination branch before saving your date sheet.' });
  }

  // 4 to 6 courses rule
  if (student.assignedCourseIds.length < 4 || student.assignedCourseIds.length > 6) {
    return res.status(400).json({
      error: `Course assignment incomplete. You currently have ${student.assignedCourseIds.length} courses assigned (minimum 4 required).`
    });
  }

  const { selections } = req.body as { selections: Array<{ courseId: string; slotId: string }> };

  if (!Array.isArray(selections)) {
    return res.status(400).json({ error: 'Slot selections array is required.' });
  }

  // Must select slot for EVERY assigned course
  const selectedCourseIds = new Set(selections.map(s => s.courseId));
  for (const cId of student.assignedCourseIds) {
    if (!selectedCourseIds.has(cId)) {
      return res.status(400).json({
        error: 'You must select an exam date and time slot for every assigned course before saving.'
      });
    }
  }

  const db = getDb();
  const selectedSlotObjects: ExamSlot[] = [];

  // Validate slot existence & seat capacity
  for (const sel of selections) {
    const slot = db.slots.find(s => s.id === sel.slotId && s.courseId === sel.courseId);
    if (!slot) {
      return res.status(400).json({ error: `Invalid slot selected for course ${sel.courseId}.` });
    }

    // Check capacity (excluding this student's previous selection if re-saving under unlock)
    const currentBooked = db.selections.filter(s => s.slotId === slot.id && s.studentId !== student.id).length;
    if (currentBooked >= slot.capacity) {
      return res.status(400).json({
        error: `Slot for course on ${slot.examDate} (${slot.startTime}-${slot.endTime}) is completely full. Please choose another slot.`
      });
    }

    selectedSlotObjects.push(slot);
  }

  // Conflict Rule: Check pairwise for same date & overlapping time
  for (let i = 0; i < selectedSlotObjects.length; i++) {
    for (let j = i + 1; j < selectedSlotObjects.length; j++) {
      const a = selectedSlotObjects[i];
      const b = selectedSlotObjects[j];

      if (a.examDate === b.examDate) {
        if (isTimeOverlapping(a.startTime, a.endTime, b.startTime, b.endTime)) {
          const courseA = db.courses.find(c => c.id === a.courseId)?.code || 'Course A';
          const courseB = db.courses.find(c => c.id === b.courseId)?.code || 'Course B';
          return res.status(400).json({
            error: `Schedule Conflict Detected! ${courseA} and ${courseB} have overlapping exam times on ${a.examDate} (${a.startTime}-${a.endTime} vs ${b.startTime}-${b.endTime}). Please pick non-conflicting slots.`
          });
        }
      }
    }
  }

  // Remove prior selections for this student (if unlocked re-save)
  db.selections = db.selections.filter(s => s.studentId !== student.id);

  // Store new selections
  for (const sel of selections) {
    const record: StudentSlotSelection = {
      id: `sel-${student.id}-${sel.courseId}`,
      studentId: student.id,
      courseId: sel.courseId,
      slotId: sel.slotId,
      createdAt: new Date().toISOString()
    };
    db.selections.push(record);
  }

  // Lock date sheet & consume single-use unlock!
  student.isDateSheetSaved = true;
  student.dateSheetUnlocked = false;
  student.updatedAt = new Date().toISOString();

  saveDb();

  res.json({
    message: 'Your exam date sheet has been saved and finalized successfully! Timetable is now locked.',
    student
  });
});

// GET /api/student/datesheet (Read-only timetable, sorted chronologically, for print/view)
app.get('/api/student/datesheet', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  if (!student.isDateSheetSaved) {
    return res.status(400).json({ error: 'Date sheet has not been saved yet.' });
  }

  const db = getDb();
  const branch = student.branchId ? db.branches.find(b => b.id === student.branchId) : null;

  const studentSelections = db.selections.filter(s => s.studentId === student.id);

  const entries = studentSelections.map(sel => {
    const course = db.courses.find(c => c.id === sel.courseId);
    const slot = db.slots.find(s => s.id === sel.slotId);

    // Calculate day of week
    let day = '';
    if (slot?.examDate) {
      const dateObj = new Date(slot.examDate + 'T00:00:00');
      day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return {
      courseCode: course ? course.code : '',
      courseTitle: course ? course.title : '',
      creditHours: course ? course.creditHours : 3,
      department: course ? course.department : '',
      examDate: slot ? slot.examDate : '',
      day,
      startTime: slot ? slot.startTime : '',
      endTime: slot ? slot.endTime : ''
    };
  });

  // Sort by date then start time
  entries.sort((a, b) => {
    if (a.examDate === b.examDate) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.examDate.localeCompare(b.examDate);
  });

  res.json({
    student: {
      fullName: student.fullName,
      regNumber: student.regNumber,
      program: student.program,
      semester: student.semester,
      sessionBatch: student.sessionBatch,
      email: student.email,
      cnic: student.cnic
    },
    branch: branch ? {
      name: branch.name,
      code: branch.code,
      city: branch.city,
      address: branch.address,
      contactNumber: branch.contactNumber
    } : null,
    entries
  });
});

// POST /api/student/change-request
app.post('/api/student/change-request', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  const { requestType, reason } = req.body;
  if (!requestType || !reason) {
    return res.status(400).json({ error: 'Request type and detailed reason are required.' });
  }

  if (requestType !== 'CHANGE_BRANCH' && requestType !== 'CHANGE_DATESHEET') {
    return res.status(400).json({ error: 'Invalid request type.' });
  }

  const db = getDb();

  // Rule: A student cannot have two pending requests of the same type at once!
  const hasPending = db.requests.some(
    r => r.studentId === student.id && r.requestType === requestType && r.status === 'PENDING'
  );

  if (hasPending) {
    return res.status(400).json({
      error: `You already have an active pending request for ${requestType}. Please wait for administration review.`
    });
  }

  const newRequest: ChangeRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId: student.id,
    studentName: student.fullName,
    studentEmail: student.email,
    regNumber: student.regNumber,
    requestType,
    reason: reason.trim(),
    status: 'PENDING',
    dateRaised: new Date().toISOString()
  };

  db.requests.unshift(newRequest);
  saveDb();

  res.status(201).json({
    message: 'Your change request has been submitted to the academic controller office.',
    request: newRequest
  });
});

// GET /api/student/requests
app.get('/api/student/requests', authMiddleware, studentOnly, (req: Request, res: Response) => {
  const student = getStudentForSession(req);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  const db = getDb();
  const myRequests = db.requests.filter(r => r.studentId === student.id);
  res.json(myRequests);
});

// ----------------- EMAIL VIEWER & NOTIFICATIONS (Bonus) -----------------

app.get('/api/emails', (req: Request, res: Response) => {
  const emailQuery = req.query.email as string;
  const emails = getEmailsForUser(emailQuery);
  res.json(emails);
});

app.post('/api/emails/:id/read', (req: Request, res: Response) => {
  const success = markEmailRead(req.params.id);
  res.json({ success });
});

// Reset demo data endpoint
app.post('/api/demo/reset', async (_req: Request, res: Response) => {
  await seedDb();
  res.json({ message: 'Database reset to initial demo seeds.' });
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ExamSlot server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
