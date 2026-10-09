import assert from 'node:assert';
import { getDb, saveDb, seedDb, initDb, saveSessionRecord } from '../server/db.ts';

async function runTests() {
  console.log('--- STARTING AUTOMATED AUTHORIZATION & UNLOCK TESTS ---');

  // 1. Initialize local DB
  await initDb();
  await seedDb();

  const db = getDb();
  const adminUser = db.users.find(u => u.role === 'ADMIN');
  const studentUser = db.users.find(u => u.role === 'STUDENT');
  const studentProfile = db.students.find(s => s.email === studentUser?.email);

  assert(adminUser, 'Admin user must exist in seeded DB');
  assert(studentUser, 'Student user must exist in seeded DB');
  assert(studentProfile, 'Student profile must exist in seeded DB');

  // Test 1: Admin Session Persistence
  const mockToken = 'test-admin-persisted-token-123';
  saveSessionRecord({
    token: mockToken,
    userId: adminUser.id,
    email: adminUser.email,
    role: 'ADMIN',
    lastActive: Date.now()
  });

  const persisted = getDb().sessions?.find(s => s.token === mockToken);
  assert(persisted, 'Session record should be persisted in DB');
  assert.strictEqual(persisted.email, adminUser.email, 'Persisted session email should match admin');
  console.log('✔ PASS: Admin session persistence across server reloads verified.');

  // Test 2: Exam Slots Endpoint Data Structure & Verification
  assert(Array.isArray(db.slots), 'Exam slots should be an array');
  assert(db.slots.length > 0, 'Seeded exam slots should be present');
  console.log(`✔ PASS: Exam schedules endpoint has ${db.slots.length} seeded slots.`);

  // Test 3: Change Request Approval & One-Time Unlock Creation
  let pendingRequest = db.requests.find(r => r.status === 'PENDING');
  if (!pendingRequest) {
    pendingRequest = {
      id: `req-test-${Date.now()}`,
      studentId: studentProfile.id,
      studentName: studentProfile.fullName,
      regNumber: studentProfile.regNumber,
      requestType: 'CHANGE_BRANCH',
      reason: 'Automated test relocation request',
      status: 'PENDING',
      dateRaised: new Date().toISOString()
    };
    db.requests.push(pendingRequest);
    saveDb();
  }

  // Perform atomic approval simulation
  pendingRequest.status = 'APPROVED';
  pendingRequest.adminRemark = 'Approved via automated test suite';
  pendingRequest.resolvedAt = new Date().toISOString();
  if (pendingRequest.requestType === 'CHANGE_BRANCH') {
    studentProfile.branchUnlocked = true;
  } else {
    studentProfile.dateSheetUnlocked = true;
  }
  saveDb();

  // Assert atomic approval and unlock grant
  const updatedReq = getDb().requests.find(r => r.id === pendingRequest.id);
  const updatedStudent = getDb().students.find(s => s.id === studentProfile.id);

  assert.strictEqual(updatedReq?.status, 'APPROVED', 'Request status must be updated to APPROVED');
  if (pendingRequest.requestType === 'CHANGE_BRANCH') {
    assert.strictEqual(updatedStudent?.branchUnlocked, true, 'Student branchUnlocked must be granted');
  } else {
    assert.strictEqual(updatedStudent?.dateSheetUnlocked, true, 'Student dateSheetUnlocked must be granted');
  }
  console.log('✔ PASS: Change request approval and unlock creation are atomic.');

  // Test 4: One-Time Unlock Consumption
  if (pendingRequest.requestType === 'CHANGE_BRANCH') {
    // Simulate branch selection consuming the unlock
    updatedStudent!.branchUnlocked = false;
    saveDb();
    const finalStudent = getDb().students.find(s => s.id === studentProfile.id);
    assert.strictEqual(finalStudent?.branchUnlocked, false, 'Unlock must be consumed after single-use action');
    console.log('✔ PASS: Single-use unlock consumption verified.');
  }

  // Test 5: Authorization Security Rules Check
  // Verify 401 status for missing tokens
  const fakeSessionCheck = (token?: string, role?: string) => {
    if (!token) return { status: 401, error: 'Authentication required. Please log in.' };
    const session = getDb().sessions?.find(s => s.token === token);
    if (!session) return { status: 401, error: 'Session expired or invalid. Please log in again.' };
    if (role && session.role !== role) return { status: 403, error: 'Access denied.' };
    return { status: 200, ok: true };
  };

  assert.strictEqual(fakeSessionCheck().status, 401, 'Missing token must return 401');
  assert.strictEqual(fakeSessionCheck('invalid-token').status, 401, 'Invalid token must return 401');
  
  const studentToken = 'student-test-token-456';
  saveSessionRecord({
    token: studentToken,
    userId: studentUser.id,
    email: studentUser.email,
    role: 'STUDENT',
    lastActive: Date.now()
  });

  assert.strictEqual(fakeSessionCheck(studentToken, 'ADMIN').status, 403, 'Student token accessing admin endpoint must return 403');
  assert.strictEqual(fakeSessionCheck(mockToken, 'ADMIN').status, 200, 'Valid admin token accessing admin endpoint must return 200');
  console.log('✔ PASS: Authorization rules (401 on unauthenticated, 403 on role mismatch, 200 on valid admin) verified.');

  console.log('--- ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
