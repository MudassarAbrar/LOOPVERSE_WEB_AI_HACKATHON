# Security Architecture & Compliance Document
# ExamSlot: Multi-Branch Virtual University System

---

## 1. Security Overview

Security is a foundational pillar of **ExamSlot**. The system enforces defense-in-depth across authentication, authorization, data transport, database row-level access control, and input validation.

```
+-------------------------------------------------------------------------------+
|                             CLIENT / BROWSER LAYER                            |
|     - TLS 1.3 Encryption                                                      |
|     - Content Security Policy (CSP) & XSS Protection                          |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                           NEXT.JS MIDDLEWARE / RBAC                           |
|     - JWT Verification (HttpOnly Cookies)                                     |
|     - Role Check (ADMIN vs STUDENT)                                           |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                       API ROUTE HANDLERS / SERVER ACTIONS                     |
|     - Zod Input Schema Validation                                             |
|     - Single-Use State Machine Enforcement                                    |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                       SUPABASE DATABASE / RLS POLICIES                        |
|     - Row Level Security (RLS) Isolation                                      |
|     - Parameterized SQL (SQL Injection Immunity)                              |
+-------------------------------------------------------------------------------+
```

---

## 2. Authentication & Credential Security

### 2.1 Password Hashing & Storage
- Passwords MUST be hashed using **bcrypt** (work factor $\ge 10$) or Supabase Auth's native Argon2/bcrypt implementation.
- Plaintext passwords are NEVER stored in the database, logged in application trace files, or sent over email.

### 2.2 Account Setup Token Security
- When an admin creates a student record, a single-use setup token is generated:
  ```ts
  import { randomBytes, createHash } from 'crypto';

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  ```
- The raw token is emailed to the student (`/set-password?token=${rawToken}`).
- The database stores only the `tokenHash`.
- Upon submission, the token is verified against expiration and marked `is_used = true` immediately.

---

## 3. Role-Based Access Control (RBAC) Architecture

The application enforces strict separation between **Admin** and **Student** roles.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const path = req.nextUrl.pathname;

  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    const payload = await verifyJwt(token);
    if (payload.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path.startsWith('/student') || path.startsWith('/api/student')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    const payload = await verifyJwt(token);
    if (payload.role !== 'STUDENT') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: Student access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return NextResponse.next();
}
```

---

## 4. Supabase Row Level Security (RLS) Policies

To ensure total isolation at the database layer, Supabase Row Level Security (RLS) is enabled on all tables.

### 4.1 Student Profiles RLS
```sql
-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY admin_student_profiles_all ON student_profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Policy: Student can read ONLY their own profile
CREATE POLICY student_read_own_profile ON student_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Student CANNOT update profile directly (only via specific RPC actions)
```

### 4.2 Student Slot Selections RLS
```sql
ALTER TABLE student_slot_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_selections_all ON student_slot_selections
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY student_read_own_selections ON student_slot_selections
  FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT id FROM student_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY student_insert_own_selections ON student_slot_selections
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM student_profiles 
      WHERE user_id = auth.uid() 
      AND (is_datesheet_saved = false OR datesheet_unlocked = true)
    )
  );
```

---

## 5. Defense Against OWASP Top 10 Vulnerabilities

| Vulnerability | Mitigation Strategy in ExamSlot |
| :--- | :--- |
| **SQL Injection (SQLi)** | All database queries use parameterized SQL via Supabase JS Client / Prisma ORM. Raw string concatenation in SQL queries is strictly prohibited. |
| **Cross-Site Scripting (XSS)** | React JSX auto-escapes rendered text. User input strings are sanitized before rendering. |
| **Broken Access Control** | Enforced at Next.js Middleware layer, API Handler layer, and Database RLS layer (Triple-Layer Defense). |
| **Cross-Site Request Forgery (CSRF)** | Authentication tokens are stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies. |
| **Security Misconfiguration** | All sensitive secrets are stored in `.env.local`. Debug stack traces are hidden in production build responses. |
| **Mass Assignment** | Zod schemas strictly parse only permitted payload attributes, discarding extraneous request body properties. |

---

## 6. Audit Logging System

All administrative operations trigger an entry in the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

*Logged Actions*: `CREATE_BRANCH`, `DEACTIVATE_BRANCH`, `ASSIGN_COURSES`, `CREATE_EXAM_SLOT`, `APPROVE_REQUEST`, `REJECT_REQUEST`.
