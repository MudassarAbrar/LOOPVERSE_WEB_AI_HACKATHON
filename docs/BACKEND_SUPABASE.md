# Supabase Backend Architecture & Database Documentation
# ExamSlot: Multi-Branch Virtual University System

---

## 1. Overview & Supabase Architecture

This document defines the complete backend infrastructure using **Supabase** (Managed PostgreSQL, Auth, Row Level Security, Storage, and Database Functions).

```
+-----------------------------------------------------------------------------------+
|                               NEXT.JS / CLIENT LAYER                              |
|                    Supabase JS Client (@supabase/supabase-js)                    |
+-----------------------------------------------------------------------------------+
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
        +--------------------+ +--------------------+ +--------------------+
        |   SUPABASE AUTH    | |  POSTGRES DB & RLS | |  SUPABASE STORAGE  |
        |  GoTrue JWT Auth   | |  Schema & Policies | |  Profile Photos    |
        +--------------------+ +--------------------+ +--------------------+
```

---

## 2. PostgreSQL DDL Schema (`schema.sql`)

Execute this script in the Supabase SQL Editor to set up all tables and constraints:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Roles Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE request_type AS ENUM ('CHANGE_BRANCH', 'CHANGE_DATESHEET');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 1. Users Table (Extends auth.users or custom user table)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role DEFAULT 'STUDENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Single-Use Password Setup Tokens
CREATE TABLE public.password_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Branches Table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  status entity_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses Table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  credit_hours INT NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
  department VARCHAR(100) NOT NULL,
  status entity_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Student Profiles Table (Personal, Parent, Academic Groups)
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Personal Group
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  cnic VARCHAR(50) UNIQUE NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  photo_url TEXT,

  -- Parent / Guardian Group
  father_name VARCHAR(150) NOT NULL,
  parent_cnic VARCHAR(50) NOT NULL,
  parent_occupation VARCHAR(100) NOT NULL,
  parent_phone VARCHAR(50) NOT NULL,
  emergency_contact VARCHAR(50) NOT NULL,

  -- Academic Group
  reg_number VARCHAR(50) UNIQUE NOT NULL,
  program VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  session_batch VARCHAR(50) NOT NULL,
  prev_qual VARCHAR(100) NOT NULL,
  prev_institute VARCHAR(150) NOT NULL,
  cgpa NUMERIC(3,2) NOT NULL,

  -- State Flags
  branch_id UUID REFERENCES public.branches(id),
  is_branch_selected BOOLEAN DEFAULT FALSE,
  is_datesheet_saved BOOLEAN DEFAULT FALSE,
  
  -- Single-Use Admin Unlock Flags
  branch_unlocked BOOLEAN DEFAULT FALSE,
  datesheet_unlocked BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Course Assignments (Enforcing 4 to 6 rule)
CREATE TABLE public.student_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 7. Exam Slots Table
CREATE TABLE public.exam_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT DEFAULT 50, -- Bonus seat limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time),
  UNIQUE(course_id, exam_date, start_time)
);

-- 8. Student Slot Selections
CREATE TABLE public.student_slot_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 9. Change Requests Queue
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  request_type request_type NOT NULL,
  reason TEXT NOT NULL,
  status request_status DEFAULT 'PENDING',
  admin_remark TEXT,
  date_raised TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 10. Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Database Indexes for Server-Side Pagination

```sql
CREATE INDEX idx_branches_status ON public.branches(status);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_students_reg ON public.student_profiles(reg_number);
CREATE INDEX idx_students_cnic ON public.student_profiles(cnic);
CREATE INDEX idx_assignments_student ON public.student_course_assignments(student_id);
CREATE INDEX idx_slots_course_date ON public.exam_slots(course_id, exam_date);
CREATE INDEX idx_requests_status_type ON public.change_requests(status, request_type);
```

---

## 4. Stored Procedures & Transactional RPC Functions

### Transactional Date Sheet Save (`save_student_datesheet`)
This Supabase RPC function guarantees atomic date sheet validation and slot selection:

```sql
CREATE OR REPLACE FUNCTION save_student_datesheet(
  p_student_id UUID,
  p_selections JSONB -- Array of {course_id, slot_id}
) RETURNS JSONB AS $$
DECLARE
  v_assigned_count INT;
  v_selection_count INT;
  v_saved BOOLEAN;
  v_unlocked BOOLEAN;
  item JSONB;
BEGIN
  -- 1. Check if student profile exists and date sheet status
  SELECT is_datesheet_saved, datesheet_unlocked 
  INTO v_saved, v_unlocked 
  FROM student_profiles WHERE id = p_student_id;

  IF v_saved AND NOT v_unlocked THEN
    RAISE EXCEPTION 'Date sheet is already saved and locked.';
  END IF;

  -- 2. Verify assigned course count (must be between 4 and 6)
  SELECT COUNT(*) INTO v_assigned_count 
  FROM student_course_assignments WHERE student_id = p_student_id;

  IF v_assigned_count < 4 OR v_assigned_count > 6 THEN
    RAISE EXCEPTION 'Assignment Incomplete: Student has % assigned courses.', v_assigned_count;
  END IF;

  v_selection_count := jsonb_array_length(p_selections);
  IF v_selection_count <> v_assigned_count THEN
    RAISE EXCEPTION 'Must select exam slots for all % assigned courses.', v_assigned_count;
  END IF;

  -- 3. Clear existing selections if re-selecting after unlock
  DELETE FROM student_slot_selections WHERE student_id = p_student_id;

  -- 4. Insert selections
  FOR item IN SELECT * FROM jsonb_array_elements(p_selections)
  LOOP
    INSERT INTO student_slot_selections (student_id, course_id, slot_id)
    VALUES (p_student_id, (item->>'course_id')::UUID, (item->>'slot_id')::UUID);
  END LOOP;

  -- 5. Lock date sheet and reset unlock token
  UPDATE student_profiles 
  SET is_datesheet_saved = TRUE, datesheet_unlocked = FALSE 
  WHERE id = p_student_id;

  RETURN jsonb_build_object('success', true, 'message', 'Date sheet successfully saved and locked.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Supabase JS Client Integration Helper

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for public / authenticated browser requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client bypassing RLS for server-side admin actions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

---

## 6. Database Seed SQL Script (`seed.sql`)

```sql
-- Seed Admin User
INSERT INTO public.users (id, email, password_hash, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@vu.edu.pk', '$2a$10$YourHashedPasswordHere', 'ADMIN');

-- Seed 3 Branches
INSERT INTO public.branches (id, code, name, city, address, contact_number, status) VALUES
('11111111-1111-1111-1111-111111111111', 'LHR-01', 'Lahore Main Campus', 'Lahore', 'Canal Bank Road, Lahore', '+9242111222333', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'ISB-01', 'Islamabad Campus', 'Islamabad', 'Sector H-8/4, Islamabad', '+9251111222333', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'KHI-01', 'Karachi Campus', 'Karachi', 'Block 6 PECHS, Karachi', '+9221111222333', 'ACTIVE');

-- Seed 8 Courses
INSERT INTO public.courses (id, course_code, title, credit_hours, department, status) VALUES
('c1010000-0000-0000-0000-000000000001', 'CS101', 'Introduction to Computing', 3, 'Computer Science', 'ACTIVE'),
('c1020000-0000-0000-0000-000000000002', 'CS201', 'Data Structures & Algorithms', 4, 'Computer Science', 'ACTIVE'),
('c1030000-0000-0000-0000-000000000003', 'CS301', 'Database Management Systems', 3, 'Computer Science', 'ACTIVE'),
('c1040000-0000-0000-0000-000000000004', 'CS401', 'Web Application Development', 3, 'Computer Science', 'ACTIVE'),
('c1050000-0000-0000-0000-000000000005', 'SE101', 'Software Engineering Principles', 3, 'Software Engineering', 'ACTIVE'),
('c1060000-0000-0000-0000-000000000006', 'MATH101', 'Calculus & Analytical Geometry', 3, 'Mathematics', 'ACTIVE'),
('c1070000-0000-0000-0000-000000000007', 'ENG101', 'English Comprehension', 2, 'Humanities', 'ACTIVE'),
('c1080000-0000-0000-0000-000000000008', 'PHY101', 'Physics Fundamentals', 3, 'Physics', 'ACTIVE');
```
