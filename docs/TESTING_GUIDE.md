# Comprehensive Testing Guide & Judging Rubric
# ExamSlot: Self-Service Exam Date Sheet System

---

## 1. Overview & Evaluation Goals

This document provides a systematic testing suite for **ExamSlot**, structured specifically around the **100 Base Marks + 10 Bonus Marks** evaluation rubric used by hackathon judges.

---

## 2. Evaluation Rubric & Test Coverage Matrix

| Judging Criteria | Marks | Target Test Cases | Status |
| :--- | :---: | :--- | :---: |
| **Admin: Branch, Course & Student CRUD** | 15 | TC-ADM-01, TC-ADM-02, TC-ADM-03 | PASS |
| **Email Based Password Setup & Login** | 10 | TC-STU-01, TC-ADM-03 | PASS |
| **Course Assignment (4 to 6 Rule)** | 8 | TC-ADM-04, TC-STU-03 | PASS |
| **Exam Schedule Slot CRUD & Validation** | 10 | TC-ADM-05 | PASS |
| **Search & Server-Side Pagination** | 7 | TC-ADM-07 | PASS |
| **Student: One-Time Branch Selection** | 8 | TC-STU-02 | PASS |
| **Student: Slot Selection & Conflict Engine** | 10 | TC-STU-03 | PASS |
| **Date Sheet View & Print** | 5 | TC-STU-04 | PASS |
| **Need Help Requests & 1-Time Unlock** | 10 | TC-ADM-06, TC-STU-05 | PASS |
| **Responsive Design (360px Mobile)** | 7 | TC-NFR-01 | PASS |
| **Security, Validation & Code Quality** | 5 | TC-SEC-01, TC-SEC-02 | PASS |
| **Presentation & Documentation** | 5 | Setup README & Live Demo | PASS |
| **BASE TOTAL** | **100** | | |
| **Bonus 1: Branch Seat Capacity Limit** | +3 | TC-BON-01 | PASS |
| **Bonus 2: Downloadable PDF Date Sheet** | +2 | TC-BON-02 | PASS |
| **Bonus 3: Email Status Notifications** | +2 | TC-BON-03 | PASS |
| **Bonus 4: Admin Analytics Dashboard** | +2 | TC-BON-04 | PASS |
| **Bonus 5: Dark Mode & Audit Logging** | +1 | TC-BON-05 | PASS |
| **MAX TOTAL SCORE** | **110** | | |

---

## 3. Test Suite 1: Admin Panel Verification

### TC-ADM-01: Branch Management & Safe-Delete Rule (15 Marks Group)
- **Pre-condition**: Admin is logged in.
- **Step 1**: Create a new branch (e.g. `Multan Campus`, Code: `MUX-01`, City: `Multan`).
- **Step 2**: Edit branch details and change status to `ACTIVE`.
- **Step 3 (Safe Delete Protection)**: Attempt to delete a branch that has registered students assigned (e.g. `Lahore Main Campus`).
- **Expected Outcome**: The system MUST block hard deletion, returning a user-friendly modal error: *"Branch cannot be hard deleted because students have already registered under it. Mark as INACTIVE instead."*

### TC-ADM-02: Course Management (15 Marks Group)
- **Step 1**: Create course `CS101 - Introduction to Computing` (Credit Hours: 3, Dept: Computer Science).
- **Step 2**: Attempt to create another course with duplicate code `CS101`.
- **Expected Outcome**: System MUST reject duplicate code with database unique constraint validation error.

### TC-ADM-03: Student Management & Onboarding Email (10 Marks Group)
- **Step 1**: Fill out new student registration form across 3 required groups:
  - **Personal**: Name, Email, Phone, CNIC, DOB, Gender, Address.
  - **Parent**: Father Name, Parent CNIC, Occupation, Contact, Emergency Phone.
  - **Academic**: Reg Number, Program, Semester, Session/Batch, Previous Qualification, Marks/CGPA.
- **Step 2**: Save student record.
- **Expected Outcome**: Student record saved AND an automated email containing a single-use setup URL (`/set-password?token=XYZ`) is dispatched via Resend.

### TC-ADM-04: Course Assignment (4 to 6 Rule) (8 Marks)
- **Step 1**: Open course assignment modal for a student.
- **Test Case 4A**: Select 3 courses and save. $\rightarrow$ **System MUST reject** with error: *"A student must be assigned at least 4 courses."*
- **Test Case 4B**: Select 7 courses and save. $\rightarrow$ **System MUST reject** with error: *"A student cannot be assigned more than 6 courses."*
- **Test Case 4C**: Select 4, 5, or 6 courses and save. $\rightarrow$ **System MUST accept** and clear "Assignment Incomplete" banner.

### TC-ADM-05: Exam Schedule Management (10 Marks)
- **Step 1**: Create exam slot for `CS101` on `2026-11-10` from `09:00` to `12:00`.
- **Step 2 (Validation)**: Attempt to create slot with end time `08:00` (before start time) or date in past. $\rightarrow$ System MUST reject.
- **Step 3 (Slot Deletion Protection)**: Attempt to delete a slot already chosen by a student. $\rightarrow$ System MUST block delete or display warning prompt.

### TC-ADM-06: Request Review Queue & 1-Time Unlock Engine (10 Marks)
- **Step 1**: View pending student requests list.
- **Step 2**: Select a `CHANGE_BRANCH` request and click **Approve** with remark: *"Approved due to relocation."*
- **Expected Outcome**: Request status becomes `APPROVED`, single-use unlock flag `branch_unlocked` is set to `true`, and an email notification is sent to the student (+2 Bonus Marks).

### TC-ADM-07: Server-Side Search & Pagination (7 Marks)
- **Step 1**: Set page limit to 5 on Students list.
- **Step 2**: Type search query `Lahore`.
- **Expected Outcome**: API sends `page=1&limit=5&search=Lahore`. The page counter displays `Showing 1 to 5 of X filtered items` (slicing full data in browser loses marks).

---

## 4. Test Suite 2: Student Panel Verification

### TC-STU-01: Email Token Password Onboarding (10 Marks)
- **Step 1**: Click onboarding link from email `/set-password?token=XYZ`.
- **Step 2**: Enter new password (minimum 8 chars) and submit.
- **Expected Outcome**: Password hashed via bcrypt or Argon2 (stored password is never plaintext), token marked `is_used = true`. Clicking link a 2nd time displays "Token Expired / Invalid".

### TC-STU-02: One-Time Branch Selection (8 Marks)
- **Step 1**: Log in as student for the first time. Branch selection page appears.
- **Step 2**: Select campus branch and save.
- **Step 3**: Log out and log back in.
- **Expected Outcome**: Branch selection page is **never shown again**. Student is directed straight to Date Sheet page. Calling POST `/api/student/select-branch` directly returns HTTP 403 Forbidden.

### TC-STU-03: Date Sheet Builder & Real-Time Conflict Engine (10 Marks)
- **Step 1**: Open Date Sheet Builder for assigned courses (`CS101`, `CS201`, `CS301`, `CS401`).
- **Step 2 (Time Conflict Test)**: Select Slot A for `CS101` (`2026-11-10`, `09:00-12:00`) and Slot B for `CS201` (`2026-11-10`, `11:00-13:00`).
- **Expected Outcome**: System detects overlap $(09:00 < 13:00) \land (11:00 < 12:00)$, highlights conflicting dropdowns in red, shows error toast, and blocks save button.
- **Step 3 (Valid Selection)**: Pick non-overlapping slots for all assigned courses. Save button activates.

### TC-STU-04: Date Sheet Save & Print View (5 Marks)
- **Step 1**: Click "Save Date Sheet".
- **Expected Outcome**: Timetable saved, `is_datesheet_saved` set to `true`. Selection locks.
- **Step 2**: Click "Print Date Sheet".
- **Expected Outcome**: Clean `@media print` printable layout appears without navigation headers/footers.

### TC-STU-05: Need Help Change Requests (10 Marks)
- **Step 1**: Navigate to "Need Help" screen.
- **Step 2**: Submit `CHANGE_DATESHEET` request with reason text.
- **Step 3**: Attempt to submit a second `CHANGE_DATESHEET` request while first is still pending.
- **Expected Outcome**: System blocks duplicate request: *"You already have a pending Date Sheet Change request."*

---

## 5. Test Suite 3: Bonus Features Verification (+10 Bonus Marks)

### TC-BON-01: Branch Seat Capacity Limit (+3 Marks)
- **Test**: Set slot capacity to 2. Have 2 students book the slot.
- **Outcome**: The slot shows `0 seats remaining` and automatically disables/hides for 3rd student.

### TC-BON-02: Downloadable PDF Date Sheet (+2 Marks)
- **Test**: Click "Download PDF" button on date sheet screen.
- **Outcome**: Instant client-side PDF download (`DateSheet_BC200401234.pdf`).

### TC-BON-03: Email Notifications (+2 Marks)
- **Test**: Admin approves student request.
- **Outcome**: Automated email delivered to student inbox via Resend.

### TC-BON-04: Admin Visual Analytics Dashboard (+2 Marks)
- **Test**: Navigate to `/admin/dashboard`.
- **Outcome**: Interactive charts (Recharts) render total students, saved date sheet ratio (%), and branch distribution bar graph.

### TC-BON-05: Dark Mode & Audit Logging (+1 Mark)
- **Test 5A**: Click Sun/Moon icon in Navbar. $\rightarrow$ Entire UI toggles dark mode.
- **Test 5B**: Navigate to `/admin/audit-logs`. $\rightarrow$ Table shows timestamped record of admin actions.

---

## 6. Test Suite 4: Mobile & Responsive Layout (360px Target)

1. Open Chrome DevTools $\rightarrow$ Toggle Device Toolbar $\rightarrow$ Select `Responsive` $\rightarrow$ Set width to **360px**.
2. Verify:
   - Data tables scroll horizontally or collapse into cards.
   - Sidebar converts into responsive top drawer / mobile menu.
   - Text does not overflow or clip off-screen.
