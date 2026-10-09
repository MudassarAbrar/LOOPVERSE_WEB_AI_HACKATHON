# Non-Functional Requirements Document (NFRD)
# ExamSlot: Self-Service Exam Date Sheet System

---

## 1. Responsiveness & UI/UX Standards (NFR-01)

- **NFR-01.1 (Mobile Width Compliance)**: The application MUST be fully functional and visually responsive across mobile, tablet, and desktop viewports. Minimum target screen width is **360px**.
- **NFR-01.2 (Responsive Data Tables)**: Data tables on small screens (<640px) MUST either enable horizontal touch scrolling or gracefully collapse into responsive card layouts.
- **NFR-01.3 (Usability & Feedback)**: 
  - Loading states (skeletons or spinners) MUST display during asynchronous network requests.
  - Confirmation modal dialogs MUST be required prior to destructive actions (e.g. deactivating a branch or deleting a course/slot).
  - Success toast notifications MUST provide immediate visual feedback upon action completion.
  - Error messages MUST be clear, actionable, and user-friendly without exposing internal stack traces.

---

## 2. Performance & Latency (NFR-02)

- **NFR-02.1 (API Response Time)**: 95% of standard CRUD API endpoints MUST return responses within **<200ms**.
- **NFR-02.2 (Server-Side Pagination)**: Database queries for list endpoints MUST use `LIMIT` and `OFFSET` (or cursor-based pagination) on the server. Returning unbounded full table datasets to the client is prohibited.
- **NFR-02.3 (Indexing)**: Foreign keys, unique fields (`email`, `reg_number`, `code`, `cnic`), and query parameters (`status`, `request_type`) MUST be indexed in the database to maintain sub-50ms query latency.

---

## 3. Data Integrity & Concurrency (NFR-03)

- **NFR-03.1 (Transactional Atomicity)**: Date sheet save operations and slot seat updates MUST execute within a database transaction. Partial updates are prohibited.
- **NFR-03.2 (Seat Overbooking Prevention)**: Slot capacity checks during date sheet saving MUST prevent race conditions (e.g. using database row locking `SELECT ... FOR UPDATE` or Supabase RPC stored procedures).
- **NFR-03.3 (Relational Constraints)**: Foreign keys MUST enforce cascade rules correctly (e.g., deleting a student cascades to profile data, but branch deletion is blocked when referenced).

---

## 4. Security & Access Control (NFR-04)

- **NFR-04.1 (Password Cryptography)**: Passwords MUST be hashed using `bcrypt` (work factor $\ge 10$) or Argon2. Plaintext passwords MUST NEVER be logged or stored.
- **NFR-04.2 (Role-Based Access Control - RBAC)**:
  - Admin routes (`/admin/*`, `/api/admin/*`) MUST strictly restrict access to users with `role == ADMIN`.
  - Student routes (`/student/*`, `/api/student/*`) MUST restrict access to authenticated student users and prevent students from accessing other students' records.
- **NFR-04.3 (Input Validation & Sanitization)**: All incoming API payload fields MUST be validated against strict schemas (e.g. Zod) to prevent SQL Injection and Cross-Site Scripting (XSS).
- **NFR-04.4 (Token Security)**: Account setup and password reset tokens MUST be cryptographically random (minimum 32 bytes hex), single-use, and expire after 24 hours.

---

## 5. Reliability & Error Recovery (NFR-05)

- **NFR-05.1 (Graceful Degradation)**: External third-party API failures (e.g., Resend email dispatch failure) MUST NOT cause database transaction rollbacks or crash the core user request. The system shall log the email error while completing account/request updates.
- **NFR-05.2 (Audit Logging)**: All administrative state changes (creating/updating records, approving requests) MUST be recorded in an `AuditLog` table capturing Admin ID, Target, Action, and Timestamp (+1 Bonus Mark).

---

## 6. Code Quality & Standards (NFR-06)

- **NFR-06.1 (Environment Secrets)**: Secrets, API keys, and database connection strings MUST be loaded exclusively from environment variables (`.env`). Hardcoded credentials in source code are strictly forbidden.
- **NFR-06.2 (Type Safety)**: The codebase MUST use TypeScript with strict mode enabled (`strict: true` in `tsconfig.json`) to prevent runtime type errors.
