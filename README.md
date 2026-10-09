# ExamSlot: Self-Service Exam Date Sheet System for a Multi-Branch Virtual University

ExamSlot is an end-to-end full-stack web application built for the **Loopverse 3.0 Hackathon**. It solves the multi-campus examination scheduling problem for a nationwide Virtual University where students sit papers in person, choosing their preferred exam branch and designing their own examination timetable within administrative rules and constraints.

---

## 1. Demo Credentials & Quick Switcher

ExamSlot includes a persistent **Demo Switcher Bar** at the top of the header for instant one-click evaluator testing across all core personas and edge states:

| Role | Email | Password | Persona State / Key Feature Under Test |
| :--- | :--- | :--- | :--- |
| **Admin Controller** | `admin@examslot.edu` | `Admin@123` | Full CRUD over branches, courses, slots, 4-6 course rule, safe-delete, and request review queue |
| **Student 1 (Ali Khan)** | `ali.khan@student.examslot.edu` | `Student@123` | Branch selected (`LHR-01`), 5 courses assigned, **Ready to assemble date sheet & test conflict engine** |
| **Student 2 (Fatima Noor)** | `fatima.noor@student.examslot.edu` | `Student@123` | Date sheet already saved & locked, approved for **Branch Change (demonstrates 1-time unlock)** |
| **Student 3 (Bilal Ahmed)** | `bilal.ahmed@student.examslot.edu` | `Student@123` | New student: **Needs one-time branch selection** (tests backend lock prevention) |
| **Student 4 (Zainab Tariq)** | `zainab.tariq@student.examslot.edu` | `Student@123` | Incomplete assignment (2 courses assigned; **tests 4-to-6 mandatory course enforcement**) |
| **Student 5 (Hamza Malik)** | `hamza.malik@student.examslot.edu` | `Student@123` | Saved date sheet with **active PENDING date sheet change request** |

---

## 2. System Architecture & Entity Relationship Diagram (ERD)

ExamSlot is implemented as a full-stack Node.js / Express application with TypeScript and React 19, utilizing atomic JSON persistence with full relational modeling.

```
+-----------------------------------------------------------------------------------------+
|                                    ENTITY RELATIONSHIP                                  |
|                                                                                         |
|  +--------------------+        1:1        +------------------------------------------+  |
|  |       User         |<----------------->|              StudentProfile              |  |
|  | - id (PK)          |                   | - id (PK), userId (FK)                   |  |
|  | - email (Unique)   |                   | - Personal: fullName, phone, cnic, dob...|  |
|  | - passwordHash     |                   | - Parent: fatherName, parentCnic...      |  |
|  | - role: ADMIN/STU  |                   | - Academic: regNumber (Unique), cgpa...  |  |
|  +--------------------+                   | - State Flags:                           |  |
|          | 1:N                            |     isBranchSelected, isDateSheetSaved   |  |
|          v                                | - Single-Use Unlock Flags:               |  |
|  +--------------------+                   |     branchUnlocked, dateSheetUnlocked    |  |
|  |   PasswordToken    |                   +------------------------------------------+  |
|  | - token (Unique)   |                        | 1:N          | 1:N         | N:1       |
|  | - expiresAt (24h)  |                        |              |             v           |
|  | - isUsed (Boolean) |                        |              |      +---------------+  |
|  +--------------------+                        |              |      |    Branch     |  |
|                                                |              |      | - id (PK)     |  |
|                                                v              |      | - code (UQ)   |  |
|                                     +--------------------+    |      | - name, city  |  |
|                                     |   ChangeRequest    |    |      | - safe-delete |  |
|                                     | - studentId (FK)   |    |      +---------------+  |
|                                     | - type (BRANCH/DS) |    |                         |
|                                     | - status: PEND/APP |    |                         |
|                                     | - adminRemark      |    |                         |
|                                     +--------------------+    |                         |
|                                                               v                         |
|                                     +-------------------------------+                   |
|                                     |     StudentSlotSelection      |                   |
|                                     | - studentId (FK)              |                   |
|                                     | - courseId (FK)               |                   |
|                                     | - slotId (FK)                 |                   |
|                                     +-------------------------------+                   |
|                                             | N:1                                       |
|                                             v                                           |
|   +-------------------+            +--------------------+                               |
|   |      Course       | 1:N        |      ExamSlot      |                               |
|   | - id (PK)         |----------->| - id (PK)          |                               |
|   | - code (Unique)   |            | - courseId (FK)    |                               |
|   | - title, creditHrs|            | - examDate, time   |                               |
|   | - department      |            | - capacity (Bonus) |                               |
|   +-------------------+            +--------------------+                               |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Business Rules Implementation

| Business Rule | Specification | Where Enforced | Implementation Detail |
| :--- | :--- | :--- | :--- |
| **4 to 6 Courses per Student** | Every student must take between 4 and 6 courses. | Backend & UI | `/api/admin/students/:id/assignments` validates `courseIds.length >= 4 && <= 6`. Students with < 4 courses are displayed as "Assignment Incomplete" and blocked from building date sheets. |
| **One-Time Branch Selection** | Selected only once; never shown again on subsequent logins. | Backend & UI | `isBranchSelected: true`. Calling `/api/student/select-branch` a second time is rejected with HTTP 403 Forbidden unless `branchUnlocked: true`. |
| **Date Sheet Saved Once** | Timetable locked upon submission. | Backend & UI | `isDateSheetSaved: true`. Re-saving without an approved request is rejected with HTTP 403 Forbidden. |
| **Exam Slot Conflict Engine** | No two courses on same date and overlapping time shift. | Backend & UI | Evaluates interval overlap: `(startA < endB) && (startB < endA)`. Highlights conflict in Red and blocks saving. |
| **Single-Use Admin Unlock** | Approval re-opens branch or date sheet builder exactly once. | Backend | When student saves the unlocked action, the respective flag (`branchUnlocked = false` or `dateSheetUnlocked = false`) is consumed immediately. |
| **Safe-Delete Rule for Branches** | A branch chosen by students cannot be hard-deleted. | Backend & UI | `canDeleteBranch()` verifies if student enrollment count > 0. If enrolled, hard delete is blocked and branch status is set to `INACTIVE` with a clear explanation banner. |
| **Slot Protection** | Exam slots chosen by students cannot be deleted. | Backend | `canDeleteSlot()` verifies `db.selections.count == 0` before allowing deletion. |
| **Account Creation Email** | Onboarding link sent on student creation. | Backend & In-App Mailbox | 24-hour cryptographic hex token generated; Bcrypt salted hashing; no plain-text passwords. Includes live **Virtual Mailbox** modal to inspect and test dispatched links in 1 click. |
| **Server-Side Pagination & Search** | All admin listings must paginate on the server. | Backend & UI | `paginate<T>()` accepts `page`, `limit`, and `search`. Filtered totals and current slices are returned by the API. |

---

## 4. Bonus Features Implemented (+10 Marks)

1. **Branch Seat Capacity per Slot (+3 Marks)**:
   - Every `ExamSlot` tracks `capacity` (e.g. 30 seats) and real-time booked counts.
   - Student portal indicates `X / Y seats left`. Full slots are disabled and highlighted.
2. **Downloadable PDF Date Sheet (+2 Marks)**:
   - High-fidelity PDF generation using `jspdf` formatted as an official University Roll Number Slip with watermarked letterhead.
3. **Email Status Notifications (+2 Marks)**:
   - Dispatches transactional notifications to the student's inbox whenever an admin approves or rejects their change request.
4. **Admin Dashboard with Charts & Metrics (+2 Marks)**:
   - Interactive analytics dashboard showing total enrolled students, completion percentages, pending request counts, and branch enrollment distribution charts.
5. **Dark Mode & Audit Trail (+1 Mark)**:
   - Both implemented: Tailwind dark mode toggle + server-paginated admin audit log tracking all changes.

---

## 5. Assumptions Made

1. **Academic Shifts**: Exam time slots are configured in 3-hour blocks (e.g. Morning `09:00 - 12:00`, Afternoon `14:00 - 17:00`) with multiple dates offered per course to give students choice.
2. **Safe Delete Rationale**: Hard deleting an active exam center would invalidate student admittance slips. Thus, soft-deactivating to `INACTIVE` preserves data integrity.
3. **Virtual Mailbox**: To ensure evaluators can test the email onboarding flow without requiring external SMTP credentials or third-party email API keys, an in-app **Virtual Mailbox** viewer is included in the header to inspect emails and click password links instantly.
