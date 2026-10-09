# Functional Requirements Document (FRD)
# ExamSlot: Self-Service Exam Date Sheet System

---

## 1. Overview & System Scope

This document specifies the comprehensive functional requirements for **ExamSlot**. The system supports two primary user roles—**Administrator** and **Student**—and governs the complete lifecycle of virtual university exam scheduling.

---

## 2. Admin Panel Functional Requirements

### 2.1 Branch Management (FR-ADM-01)
- **FR-ADM-01.1**: The system shall provide full CRUD operations for exam branches (campuses).
- **FR-ADM-01.2**: Branch attributes must include:
  - `name` (String, Required)
  - `code` (String, Unique, Required)
  - `city` (String, Required)
  - `address` (String, Required)
  - `contact_number` (String, Required)
  - `status` (Enum: `ACTIVE`, `INACTIVE`)
- **FR-ADM-01.3 (Safe-Delete Rule)**: The system MUST block hard deletion of any branch that has registered students attached to it (`student_count > 0`). The system shall return a user-friendly error message advising the admin to mark the branch as `INACTIVE` instead.

### 2.2 Course Management (FR-ADM-02)
- **FR-ADM-02.1**: The system shall provide full CRUD operations for academic courses.
- **FR-ADM-02.2**: Course attributes must include:
  - `course_code` (String, Unique, Required)
  - `title` (String, Required)
  - `credit_hours` (Integer, Min: 1, Max: 6)
  - `department` (String, Required)
  - `status` (Enum: `ACTIVE`, `INACTIVE`)

### 2.3 Student Management & Onboarding (FR-ADM-03)
- **FR-ADM-03.1**: Each student record MUST capture information across three mandatory groups:
  1. **Personal**: Full Name, Email (Unique), Phone, CNIC/B-Form Number (Unique), Date of Birth, Gender, Address, Profile Photo URL (Optional).
  2. **Parent/Guardian**: Father/Guardian Name, Parent CNIC, Occupation, Contact Number, Emergency Contact.
  3. **Academic**: Registration Number (Unique), Program/Degree, Semester, Session/Batch, Previous Qualification, Previous Institute, CGPA/Marks.
- **FR-ADM-03.2 (Automated Onboarding Email)**: Immediately upon student creation, the system MUST generate a cryptographically secure, single-use password setup token valid for 24 hours and dispatch a welcome email containing the setup URL (`/set-password?token=XYZ`).
- **FR-ADM-03.3**: Plaintext passwords MUST NEVER be sent via email or stored in the database.

### 2.4 Course Assignment (FR-ADM-04)
- **FR-ADM-04.1 (4 to 6 Course Rule)**: The admin shall assign courses to students. The system MUST enforce on both the backend API and database constraints that every student has **at least 4 and at most 6 assigned courses** before they can select an exam schedule.
- **FR-ADM-04.2**: The same course cannot be assigned to the same student twice.
- **FR-ADM-04.3**: Course assignments CANNOT be modified by the admin if the student has saved a date sheet (`is_datesheet_saved = true`), unless a Date Sheet Change Request has been approved.

### 2.5 Exam Schedule Management (FR-ADM-05)
- **FR-ADM-05.1**: The admin shall create one or more exam slots per course. Attributes: `course_id`, `exam_date`, `start_time`, `end_time`, and optional `capacity`.
- **FR-ADM-05.2 (Slot Validation)**:
  - `exam_date` must not be in the past.
  - `end_time` must be after `start_time`.
  - Duplicate slots for the exact same course, date, and start time must be rejected.
- **FR-ADM-05.3 (Slot Deletion Protection)**: If a slot has already been selected by any student, the system MUST block hard deletion or display a warning prompt.

### 2.6 Student Request Queue & Approval Engine (FR-ADM-06)
- **FR-ADM-06.1**: The system shall present a centralized queue of student change requests showing Student Name, Registration Number, Request Type (`CHANGE_BRANCH` or `CHANGE_DATESHEET`), Reason, Date Raised, and Status (`PENDING`, `APPROVED`, `REJECTED`).
- **FR-ADM-06.2**: Admin can Approve or Reject each request with an optional remark.
- **FR-ADM-06.3 (Single-Use Unlock Logic)**:
  - Approving `CHANGE_BRANCH` sets `branch_unlocked = true` on the student record.
  - Approving `CHANGE_DATESHEET` sets `datesheet_unlocked = true` on the student record.
  - Rejecting a request maintains locked state and records the admin remark.
- **FR-ADM-06.4**: The system shall send an email notification to the student upon request approval/rejection (+2 Bonus Marks).

### 2.7 Server-Side Search & Pagination Engine (FR-ADM-07)
- **FR-ADM-07.1**: All Admin Panel table listings (Branches, Courses, Students, Assignments, Schedules, Requests) MUST implement **server-side pagination**.
- **FR-ADM-07.2**: Search queries MUST filter records on the database server before returning the target page. Browser-side slicing of full datasets is strictly prohibited.

---

## 3. Student Panel Functional Requirements

### 3.1 Account Setup & Login (FR-STU-01)
- **FR-STU-01.1**: Self-registration is disabled. Students authenticate using Email and Password set via the email setup token.
- **FR-STU-01.2**: Password setup screen validates token expiry (24h) and single-use status.
- **FR-STU-01.3**: Provide a "Forgot Password" flow utilizing the same single-use token mailer mechanism.

### 3.2 One-Time Branch Selection (FR-STU-02)
- **FR-STU-02.1**: Upon first login, the student MUST select an exam branch from active campuses.
- **FR-STU-02.2 (Single-Use Enforcement)**: Once saved, `is_branch_selected` becomes `true`. The branch selection page is hidden on future logins. Backend APIs MUST reject direct HTTP POST attempts to change branch unless `branch_unlocked == true`.
- **FR-STU-02.3**: Upon re-selection after admin approval, `branch_unlocked` resets to `false` (single-use unlock).

### 3.3 Dashboard & Date Sheet Builder (FR-STU-03)
- **FR-STU-03.1**: Display student profile info (Personal, Parent, Academic) in read-only format alongside selected branch name.
- **FR-STU-03.2**: If assigned courses < 4, render banner: *"Assignment Incomplete: Admin must assign at least 4 courses."* and block date sheet design.
- **FR-STU-03.3**: List assigned courses with dropdowns showing valid exam slots created by admin.
- **FR-STU-03.4 (Time Overlap Conflict Engine)**:
  - System MUST prevent picking two slots on the same date with overlapping times.
  - Overlap condition: `(SlotA.start < SlotB.end) AND (SlotB.start < SlotA.end)` for `SlotA.date == SlotB.date`.
  - Frontend dynamically highlights conflicting selections and disables save button. Backend validates on submit.

### 3.4 Save, View & Print Date Sheet (FR-STU-04)
- **FR-STU-04.1**: Saving date sheet creates selection records and sets `is_datesheet_saved = true`.
- **FR-STU-04.2**: Once saved, date sheet enters locked read-only state.
- **FR-STU-04.3**: Render formatted printable date sheet containing Student Name, Reg Number, Program, Branch, and sorted course timetable.
- **FR-STU-04.4**: Provide a "Print Date Sheet" button triggering printable CSS `@media print` / PDF export (+2 Bonus Marks).

### 3.5 Change Requests (FR-STU-05)
- **FR-STU-05.1**: Provide a "Need Help" interface allowing students to raise:
  1. Request to Change Branch
  2. Request to Change Date Sheet
- **FR-STU-05.2**: Require mandatory reason text.
- **FR-STU-05.3**: System MUST block raising a new request if a pending request of the same type already exists for that student.

---

## 4. Bonus Functional Requirements (+10 Marks)

1. **Branch Seat Capacity per Slot (+3 Marks)**: Admin sets `capacity` per slot. System computes `remaining_seats = capacity - count(selections)`. Slots with 0 remaining seats disappear/disable.
2. **Downloadable PDF Date Sheet (+2 Marks)**: PDF generation button allowing instant offline download.
3. **Email Notification Engine (+2 Marks)**: Automatic email dispatch on request approval/rejection.
4. **Admin Analytics Dashboard (+2 Marks)**: Charts displaying total students, saved date sheet ratio, branch distribution.
5. **Dark Mode & Audit Logging (+1 Mark)**: UI theme switcher and Admin action audit table.
