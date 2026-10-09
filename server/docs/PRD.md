# Product Requirements Document (PRD)
# ExamSlot: Multi-Branch Virtual University Exam Date Sheet System

---

## 1. Executive Summary & Vision

**ExamSlot** is a full-stack, responsive web application designed for a virtual university operating across multiple national branches. Unlike traditional static date sheet systems, ExamSlot empowers students to self-design their personalized exam timetables within administrative boundaries. 

The core architectural challenge is managing strict state machines (single-use actions, lock-and-key change requests, server-enforced course counts) alongside real-time time-conflict detection and seat allocation constraints.

---

## 2. Architecture & Technology Stack Selection

Recommended stack: **Next.js 14+ (App Router) with TypeScript, Supabase (PostgreSQL, Auth, RLS, Storage), Tailwind CSS, Shadcn UI, and Resend**.

```
+-----------------------------------------------------------------------------------+
|                                 NEXT.JS 14+ APP ROUTER                            |
|                                                                                   |
|  +----------------------------------+     +------------------------------------+  |
|  |           ADMIN PANEL            |     |           STUDENT PANEL            |  |
|  |  - Branch / Course / Student CRUD|     |  - Set Password via Email Token    |  |
|  |  - Course Assignment (4-6 Rule)  |     |  - Single-Use Branch Selection     |  |
|  |  - Slot Creator & Manager        |     |  - Date Sheet Builder & Conflict   |  |
|  |  - Request Approval / Unlock Queue|     |    Check Engine                    |  |
|  |  - Analytics & Audit Logs        |     |  - Printable / PDF Date Sheet      |  |
|  +----------------------------------+     +------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |               SERVER-SIDE API LAYER / ACTIONS & MIDDLEWARE                  |  |
|  |  - RBAC Middleware (Admin vs Student Route Protection)                       |  |
|  |  - Server-side Search & Pagination Helper                                    |  |
|  |  - Transactional Time Slot Conflict Validator                                |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |                   SUPABASE (POSTGRESQL + AUTH + RLS)                        |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Roles & Capabilities

| Role | Operational Scope & Permissions |
| :--- | :--- |
| **Admin** | Full CRUD over Branches, Courses, Students, Course Assignments, Exam Schedule Slots. Reviews change requests, grants 1-time action unlocks, monitors system analytics. |
| **Student** | Sets password via secure email token, performs 1-time branch selection, builds non-overlapping exam date sheet, views/prints timetable, submits change requests. |

---

## 4. Key Functional Boundaries

1. **Course Assignment Bounds**: Admin must assign between 4 and 6 courses per student. Enforced on API & DB layer.
2. **Single-Use Branch Lock**: Student branch selection page rendered once; subsequent visits or API calls blocked unless admin unlocks.
3. **Single-Use Date Sheet Lock**: Saving timetable finalizes selection; blocked from edits unless admin unlocks.
4. **Time Overlap Engine**: Prevents selecting overlapping slots on the same exam date.
5. **Safe Branch Deletion**: Branches in use by students cannot be hard-deleted.

---

## 5. Deliverables & Evaluation Focus

- 100 Base Marks covering Admin CRUD, Email onboarding, Course assignments, Slot scheduling, Student flow, Date sheet view/print, Change requests, Responsive design (360px), and Security.
- +10 Bonus Marks covering Slot seat capacity limits (+3), Downloadable PDF date sheet (+2), Email status updates (+2), Admin analytics dashboard (+2), and Dark mode / Audit logging (+1).
