# API Endpoints Specification Document
# ExamSlot: Multi-Branch Virtual University System

---

## 1. Global API Standards

### 1.1 Base URL & Content Negotiation
- Base API Endpoint: `/api/v1`
- Content Type: `application/json`
- Character Set: `UTF-8`

### 1.2 Standard Server-Side Pagination Query Parameters
All list endpoints MUST accept:
- `page`: (Integer, Default: 1) Target page number.
- `limit`: (Integer, Default: 10) Items per page.
- `search`: (String, Optional) Text search query.
- `sortBy`: (String, Optional) Field name to sort by.
- `order`: (Enum: `asc`, `desc`, Default: `asc`).

### 1.3 Standard Paginated Response Structure
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 1.4 Standard Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A student must be assigned between 4 and 6 courses.",
    "details": [ ... ]
  }
}
```

---

## 2. Auth Endpoints

### `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticate Admin or Student.
- **Request Body**:
  ```json
  { "email": "student@example.com", "password": "SecurePassword123!" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { "id": "uuid", "email": "student@example.com", "role": "STUDENT" },
    "token": "jwt_token_string"
  }
  ```

### `POST /api/auth/set-password`
- **Access**: Public (Token Protected)
- **Description**: Verifies single-use onboarding token and sets initial password.
- **Request Body**:
  ```json
  { "token": "32_byte_hex_token", "password": "NewSecurePassword123!" }
  ```

---

## 3. Admin Panel Endpoints

### `GET /api/admin/branches`
- **Access**: Admin Only
- **Query Params**: `page=1&limit=10&search=Lahore`
- **Response**: List of branches with student counts.

### `POST /api/admin/branches`
- **Access**: Admin Only
- **Request Body**:
  ```json
  {
    "code": "LHR-01",
    "name": "Lahore Main Campus",
    "city": "Lahore",
    "address": "123 University Avenue",
    "contactNumber": "+9242111222333",
    "status": "ACTIVE"
  }
  ```

### `DELETE /api/admin/branches/:id`
- **Access**: Admin Only
- **Behavior**: Safe-delete check. If students exist, returns 400 Bad Request explaining branch cannot be deleted.

### `GET /api/admin/students`
- **Access**: Admin Only
- **Query Params**: `page=1&limit=10&search=BCS123`
- **Response**: Paginated list of student profiles (Personal, Parent, Academic).

### `POST /api/admin/students`
- **Access**: Admin Only
- **Description**: Creates student user & profile, dispatches setup email.

### `POST /api/admin/students/:id/assign-courses`
- **Access**: Admin Only
- **Description**: Assigns 4 to 6 courses to student.
- **Request Body**:
  ```json
  { "courseIds": ["course_uuid_1", "course_uuid_2", "course_uuid_3", "course_uuid_4"] }
  ```

### `GET /api/admin/slots`
- **Access**: Admin Only
- **Query Params**: `courseId=uuid&page=1&limit=10`
- **Response**: Exam slots list with remaining seats.

### `POST /api/admin/slots`
- **Access**: Admin Only
- **Request Body**:
  ```json
  {
    "courseId": "course_uuid",
    "examDate": "2026-11-15",
    "startTime": "09:00",
    "endTime": "12:00",
    "capacity": 50
  }
  ```

### `GET /api/admin/requests`
- **Access**: Admin Only
- **Query Params**: `status=PENDING&type=CHANGE_BRANCH&page=1&limit=10`

### `POST /api/admin/requests/:id/review`
- **Access**: Admin Only
- **Request Body**:
  ```json
  { "status": "APPROVED", "adminRemark": "Branch change approved due to relocation." }
  ```

### `GET /api/admin/analytics`
- **Access**: Admin Only
- **Response**: Dashboard statistics (+2 Bonus Marks).

---

## 4. Student Panel Endpoints

### `POST /api/student/select-branch`
- **Access**: Student Only
- **Request Body**: `{ "branchId": "branch_uuid" }`
- **Behavior**: Enforces single-use lock (`is_branch_selected = true`).

### `GET /api/student/available-slots`
- **Access**: Student Only
- **Response**: List of assigned courses with non-conflicting available exam slots.

### `POST /api/student/save-datesheet`
- **Access**: Student Only
- **Request Body**:
  ```json
  {
    "selections": [
      { "courseId": "course_1", "slotId": "slot_1" },
      { "courseId": "course_2", "slotId": "slot_2" },
      { "courseId": "course_3", "slotId": "slot_3" },
      { "courseId": "course_4", "slotId": "slot_4" }
    ]
  }
  ```
- **Behavior**: Runs time-overlap validator & seat capacity check, saves selections, locks date sheet (`is_datesheet_saved = true`).

### `POST /api/student/change-request`
- **Access**: Student Only
- **Request Body**:
  ```json
  { "requestType": "CHANGE_DATESHEET", "reason": "Clash with medical emergency." }
  ```
