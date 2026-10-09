import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase.ts';

export async function seedSupabase() {
  console.log('[SUPABASE SEED] Starting Supabase database seeding...');

  try {
    const adminSalt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123', adminSalt);
    const studentSalt = await bcrypt.genSalt(10);
    const studentHash = await bcrypt.hash('Student@123', studentSalt);

    // 1. Seed Users
    const users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@examslot.edu',
        password_hash: adminHash,
        role: 'ADMIN'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'student1@examslot.edu',
        password_hash: studentHash,
        role: 'STUDENT'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'student2@examslot.edu',
        password_hash: studentHash,
        role: 'STUDENT'
      }
    ];

    for (const u of users) {
      await supabaseAdmin.from('users').upsert(u, { onConflict: 'email' });
    }

    // 2. Seed Branches
    const branches = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'LHR-01',
        name: 'Lahore Central Campus',
        city: 'Lahore',
        address: 'Plot 54, Block C, Canal Bank Road, Lahore',
        contact_number: '+92-42-111-887-887',
        status: 'ACTIVE'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        code: 'ISB-02',
        name: 'Islamabad Capital Campus',
        city: 'Islamabad',
        address: 'Sector H-9/1, Kashmir Highway, Islamabad',
        contact_number: '+92-51-111-887-888',
        status: 'ACTIVE'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        code: 'KHI-03',
        name: 'Karachi City Campus',
        city: 'Karachi',
        address: 'Gulshan-e-Iqbal Block 7, Main University Road, Karachi',
        contact_number: '+92-21-111-887-889',
        status: 'ACTIVE'
      }
    ];

    for (const b of branches) {
      await supabaseAdmin.from('branches').upsert(b, { onConflict: 'code' });
    }

    // 3. Seed Courses
    const courses = [
      {
        id: 'c1010000-0000-0000-0000-000000000001',
        course_code: 'CS101',
        title: 'Introduction to Computing',
        credit_hours: 3,
        department: 'Computer Science',
        status: 'ACTIVE'
      },
      {
        id: 'c1020000-0000-0000-0000-000000000002',
        course_code: 'CS201',
        title: 'Data Structures & Algorithms',
        credit_hours: 4,
        department: 'Computer Science',
        status: 'ACTIVE'
      },
      {
        id: 'c1030000-0000-0000-0000-000000000003',
        course_code: 'CS301',
        title: 'Database Management Systems',
        credit_hours: 3,
        department: 'Computer Science',
        status: 'ACTIVE'
      },
      {
        id: 'c1040000-0000-0000-0000-000000000004',
        course_code: 'CS401',
        title: 'Web Application Development',
        credit_hours: 3,
        department: 'Computer Science',
        status: 'ACTIVE'
      },
      {
        id: 'c1050000-0000-0000-0000-000000000005',
        course_code: 'SE101',
        title: 'Software Engineering Principles',
        credit_hours: 3,
        department: 'Software Engineering',
        status: 'ACTIVE'
      },
      {
        id: 'c1060000-0000-0000-0000-000000000006',
        course_code: 'MATH101',
        title: 'Calculus & Analytical Geometry',
        credit_hours: 3,
        department: 'Mathematics',
        status: 'ACTIVE'
      },
      {
        id: 'c1070000-0000-0000-0000-000000000007',
        course_code: 'ENG101',
        title: 'English Comprehension',
        credit_hours: 2,
        department: 'Humanities',
        status: 'ACTIVE'
      },
      {
        id: 'c1080000-0000-0000-0000-000000000008',
        course_code: 'PHY101',
        title: 'Physics Fundamentals',
        credit_hours: 3,
        department: 'Physics',
        status: 'ACTIVE'
      }
    ];

    for (const c of courses) {
      await supabaseAdmin.from('courses').upsert(c, { onConflict: 'course_code' });
    }

    // 4. Seed Student Profiles
    const students = [
      {
        id: 's1000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000002',
        full_name: 'Mudassir Baig',
        phone: '+92-300-1234567',
        cnic: '35202-1234567-1',
        dob: '2001-05-14',
        gender: 'Male',
        address: 'House #12, St 4, Johar Town, Lahore',
        father_name: 'Tariq Baig',
        parent_cnic: '35202-7654321-3',
        parent_occupation: 'Senior Engineer',
        parent_phone: '+92-300-7654321',
        emergency_contact: '+92-321-9876543',
        reg_number: 'BC200401234',
        program: 'BS Computer Science',
        semester: 6,
        session_batch: 'Fall 2022',
        prev_qual: 'FSc Pre-Engineering',
        prev_institute: 'Government College University Lahore',
        cgpa: 3.65,
        is_branch_selected: false,
        is_datesheet_saved: false,
        branch_unlocked: false,
        datesheet_unlocked: false
      },
      {
        id: 's2000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000003',
        full_name: 'Ayesha Khan',
        phone: '+92-301-9876543',
        cnic: '61101-9876543-2',
        dob: '2002-09-21',
        gender: 'Female',
        address: 'Sector F-8/2, Islamabad',
        father_name: 'Aslam Khan',
        parent_cnic: '61101-1234567-4',
        parent_occupation: 'Business Owner',
        parent_phone: '+92-301-1234567',
        emergency_contact: '+92-333-1122334',
        reg_number: 'BC200405678',
        program: 'BS Software Engineering',
        semester: 4,
        session_batch: 'Spring 2023',
        prev_qual: 'ICS Computer Science',
        prev_institute: 'Army Public College Islamabad',
        cgpa: 3.82,
        is_branch_selected: false,
        is_datesheet_saved: false,
        branch_unlocked: false,
        datesheet_unlocked: false
      }
    ];

    for (const st of students) {
      await supabaseAdmin.from('student_profiles').upsert(st, { onConflict: 'reg_number' });
    }

    // 5. Seed Student Assignments (4-6 per student)
    const assignments = [
      { student_id: 's1000000-0000-0000-0000-000000000001', course_id: 'c1010000-0000-0000-0000-000000000001' },
      { student_id: 's1000000-0000-0000-0000-000000000001', course_id: 'c1020000-0000-0000-0000-000000000002' },
      { student_id: 's1000000-0000-0000-0000-000000000001', course_id: 'c1030000-0000-0000-0000-000000000003' },
      { student_id: 's1000000-0000-0000-0000-000000000001', course_id: 'c1040000-0000-0000-0000-000000000004' },
      { student_id: 's2000000-0000-0000-0000-000000000002', course_id: 'c1010000-0000-0000-0000-000000000001' },
      { student_id: 's2000000-0000-0000-0000-000000000002', course_id: 'c1030000-0000-0000-0000-000000000003' },
      { student_id: 's2000000-0000-0000-0000-000000000002', course_id: 'c1050000-0000-0000-0000-000000000005' },
      { student_id: 's2000000-0000-0000-0000-000000000002', course_id: 'c1060000-0000-0000-0000-000000000006' }
    ];

    for (const a of assignments) {
      await supabaseAdmin.from('student_course_assignments').upsert(a, { onConflict: 'student_id,course_id' });
    }

    // 6. Seed Exam Slots
    const slots = [
      {
        course_id: 'c1010000-0000-0000-0000-000000000001',
        exam_date: '2026-11-10',
        start_time: '09:00:00',
        end_time: '12:00:00',
        capacity: 50
      },
      {
        course_id: 'c1010000-0000-0000-0000-000000000001',
        exam_date: '2026-11-11',
        start_time: '14:00:00',
        end_time: '17:00:00',
        capacity: 50
      },
      {
        course_id: 'c1020000-0000-0000-0000-000000000002',
        exam_date: '2026-11-12',
        start_time: '09:00:00',
        end_time: '12:00:00',
        capacity: 50
      },
      {
        course_id: 'c1030000-0000-0000-0000-000000000003',
        exam_date: '2026-11-14',
        start_time: '09:00:00',
        end_time: '12:00:00',
        capacity: 50
      },
      {
        course_id: 'c1040000-0000-0000-0000-000000000004',
        exam_date: '2026-11-15',
        start_time: '14:00:00',
        end_time: '17:00:00',
        capacity: 50
      }
    ];

    for (const sl of slots) {
      await supabaseAdmin.from('exam_slots').upsert(sl, { onConflict: 'course_id,exam_date,start_time' });
    }

    console.log('[SUPABASE SEED] Database successfully populated with initial data!');
    return { success: true };
  } catch (err) {
    console.error('[SUPABASE SEED ERROR]', err);
    return { success: false, error: err };
  }
}
