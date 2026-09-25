const API_BASE = 'http://localhost:5000/api';

async function request(url: string, options: any = {}) {
  const res = await fetch(`${API_BASE}${url}`, options);
  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else if (contentType.includes('application/pdf')) {
    const ab = await res.arrayBuffer();
    body = Buffer.from(ab);
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function login(email: string, role: string) {
  const passwords = ['Password@123', 'password123', `${role.charAt(0).toUpperCase() + role.slice(1)}@123`];
  let lastErr = '';
  for (const pwd of passwords) {
    const res = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd })
    });
    if (res.status === 200 && res.body?.token) {
      console.log(`[AUTH] Logged in as ${email} (${role})`);
      return { token: res.body.token, user: res.body.user };
    }
    lastErr = JSON.stringify(res.body);
  }
  throw new Error(`Failed to login as ${email}: ${lastErr}`);
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`, detail !== undefined ? detail : '');
    failed++;
  }
}

async function runTests() {
  console.log('=== STARTING RBAC & PDF STUDY MATERIAL TEST SUITE ===\n');

  // 1. Authenticate users
  const learner = await login('learner1@vantage.gov.in', 'learner');
  const trainer = await login('trainer@vantage.gov.in', 'trainer');
  const admin = await login('admin@vantage.gov.in', 'admin');

  // Fetch courses to get IDs
  const coursesRes = await request('/courses', { headers: authHeader(learner.token) });
  assert(coursesRes.status === 200 && coursesRes.body.length >= 2, 'Fetch public course catalog');
  const pythonCourse = coursesRes.body.find((c: any) => c.slug?.includes('python') || c.title?.toLowerCase().includes('python'));
  const sqlCourse = coursesRes.body.find((c: any) => c.slug?.includes('sql') || c.title?.toLowerCase().includes('sql'));

  assert(!!pythonCourse, 'Found Python course');
  assert(!!sqlCourse, 'Found SQL course');

  // Check materials exist in seeded courses
  const pyMaterialsRes = await request(`/courses/${pythonCourse.id}/materials`, { headers: authHeader(learner.token) });
  const pyMaterials = Array.isArray(pyMaterialsRes.body) ? pyMaterialsRes.body : (pyMaterialsRes.body?.materials || []);
  assert(pyMaterialsRes.status === 200 && pyMaterials.length >= 1, 'Python course has seeded study materials', pyMaterialsRes.body);
  const samplePyMat = pyMaterials[0];

  const sqlMaterialsRes = await request(`/courses/${sqlCourse.id}/materials`, { headers: authHeader(learner.token) });
  const sqlMaterials = Array.isArray(sqlMaterialsRes.body) ? sqlMaterialsRes.body : (sqlMaterialsRes.body?.materials || []);
  assert(sqlMaterialsRes.status === 200 && sqlMaterials.length >= 1, 'SQL course has seeded study materials', sqlMaterialsRes.body);
  const sampleSqlMat = sqlMaterials[0];

  console.log('\n--- TEST SUITE 1: LEARNER ROLE RESTRICTIONS & MATERIAL ACCESS ---');

  // 1.1 Learner accessing enrolled Python course material (learner1 is seeded with active enrollment)
  const learnerPyMatRes = await request(`/courses/${pythonCourse.id}/materials/${samplePyMat.id}/download`, {
    headers: authHeader(learner.token)
  });
  assert(learnerPyMatRes.status === 200, 'Learner CAN download material from enrolled Python course', learnerPyMatRes.status);
  assert(Boolean(learnerPyMatRes.headers.get('content-type')?.includes('application/pdf')), 'Learner material download has application/pdf content type');

  // 1.2 Learner accessing unenrolled SQL course material BEFORE enrollment -> Expect 403 Forbidden
  const learnerPreSqlMatRes = await request(`/courses/${sqlCourse.id}/materials/${sampleSqlMat.id}/download`, {
    headers: authHeader(learner.token)
  });
  assert(learnerPreSqlMatRes.status === 403, 'Learner CANNOT access materials for unenrolled SQL course (HTTP 403 Forbidden)', learnerPreSqlMatRes.status);

  // 1.3 Learner enrolls in SQL course
  const enrollRes = await request('/enrollments', {
    method: 'POST',
    headers: { ...authHeader(learner.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: sqlCourse.id })
  });
  assert(enrollRes.status === 201 || enrollRes.status === 200, 'Learner enrolls in SQL course successfully', enrollRes.status);

  // 1.4 Learner accessing SQL course material AFTER enrollment -> Expect 200 OK & PDF
  const learnerPostSqlMatRes = await request(`/courses/${sqlCourse.id}/materials/${sampleSqlMat.id}/download`, {
    headers: authHeader(learner.token)
  });
  assert(learnerPostSqlMatRes.status === 200, 'Learner CAN download material from SQL course after enrolling', learnerPostSqlMatRes.status);

  // 1.5 Learner forbidden from uploading material
  const learnerUploadRes = await request(`/courses/${pythonCourse.id}/materials`, {
    method: 'POST',
    headers: authHeader(learner.token)
  });
  assert(learnerUploadRes.status === 403, 'Learner CANNOT upload course material (HTTP 403)', learnerUploadRes.status);

  // 1.6 Learner forbidden from deleting material
  const learnerDeleteRes = await request(`/courses/${pythonCourse.id}/materials/${samplePyMat.id}`, {
    method: 'DELETE',
    headers: authHeader(learner.token)
  });
  assert(learnerDeleteRes.status === 403, 'Learner CANNOT delete course material (HTTP 403)', learnerDeleteRes.status);

  // 1.7 Learner forbidden from accessing user management
  const learnerUsersRes = await request('/users', { headers: authHeader(learner.token) });
  assert(learnerUsersRes.status === 403, 'Learner CANNOT access /api/users (HTTP 403)', learnerUsersRes.status);

  // 1.8 Learner forbidden from accessing admin aggregated progress
  const learnerAdminRes = await request('/admin/learners-progress', { headers: authHeader(learner.token) });
  assert(learnerAdminRes.status === 403, 'Learner CANNOT access /api/admin/learners-progress (HTTP 403)', learnerAdminRes.status);

  // 1.9 Learner forbidden from creating courses
  const learnerCreateCourseRes = await request('/courses', {
    method: 'POST',
    headers: { ...authHeader(learner.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hacked Course', description: 'desc' })
  });
  assert(learnerCreateCourseRes.status === 403, 'Learner CANNOT create a course (HTTP 403)', learnerCreateCourseRes.status);


  console.log('\n--- TEST SUITE 2: TRAINER ROLE PERMISSIONS & BOUNDARIES ---');

  // 2.1 Trainer can access materials of their course
  const trainerPyMatRes = await request(`/courses/${pythonCourse.id}/materials/${samplePyMat.id}/download`, {
    headers: authHeader(trainer.token)
  });
  assert(trainerPyMatRes.status === 200, 'Trainer can download materials for course they authored without learner enrollment', trainerPyMatRes.status);

  // 2.2 Trainer uploading a valid PDF to their course
  const boundary = '----WebKitFormBoundaryTest12345';
  const dummyPdfContent = '%PDF-1.4\n%EOF\n';
  const postData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="title"',
    '',
    'Trainer Automated Test PDF',
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="trainer_test.pdf"',
    'Content-Type: application/pdf',
    '',
    dummyPdfContent,
    `--${boundary}--`
  ].join('\r\n');

  const trainerUploadRes = await request(`/courses/${pythonCourse.id}/materials`, {
    method: 'POST',
    headers: {
      ...authHeader(trainer.token),
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: postData
  });
  assert(trainerUploadRes.status === 201 && trainerUploadRes.body?.material?.id, 'Trainer CAN upload PDF to own course (HTTP 201 Created)', trainerUploadRes.status);
  const newMatId = trainerUploadRes.body?.material?.id;

  // 2.3 Trainer can delete the material they just uploaded
  if (newMatId) {
    const trainerDelRes = await request(`/courses/${pythonCourse.id}/materials/${newMatId}`, {
      method: 'DELETE',
      headers: authHeader(trainer.token)
    });
    assert(trainerDelRes.status === 200, 'Trainer CAN delete material from own course (HTTP 200)', trainerDelRes.status);
  }

  // 2.4 Trainer CANNOT access admin user list
  const trainerUsersRes = await request('/users', { headers: authHeader(trainer.token) });
  assert(trainerUsersRes.status === 403, 'Trainer CANNOT access /api/users (HTTP 403)', trainerUsersRes.status);

  // 2.5 Trainer CANNOT access admin learner progress
  const trainerAdminRes = await request('/admin/learners-progress', { headers: authHeader(trainer.token) });
  assert(trainerAdminRes.status === 403, 'Trainer CANNOT access /api/admin/learners-progress (HTTP 403)', trainerAdminRes.status);

  // 2.6 Trainer requesting myCourses=true only gets their authored courses
  const trainerCoursesRes = await request('/courses?myCourses=true', { headers: authHeader(trainer.token) });
  assert(
    trainerCoursesRes.status === 200 && trainerCoursesRes.body.every((c: any) => c.trainerId === trainer.user.id),
    'Trainer myCourses query strictly scopes to trainerId === user.id'
  );


  console.log('\n--- TEST SUITE 3: ADMIN ROLE GLOBAL ACCESS ---');

  // 3.1 Admin can access admin learners-progress endpoint with correct schema
  const adminProgRes = await request('/admin/learners-progress', { headers: authHeader(admin.token) });
  assert(adminProgRes.status === 200, 'Admin CAN access /api/admin/learners-progress (HTTP 200)', adminProgRes.status);
  assert(
    adminProgRes.body?.summary && typeof adminProgRes.body.summary.totalUniqueLearners === 'number',
    'Admin progress summary returns totalUniqueLearners, totalEnrollments, etc.'
  );
  assert(Array.isArray(adminProgRes.body?.progress), 'Admin progress returns array of learner progress records');

  // 3.2 Admin can view user list
  const adminUsersRes = await request('/users', { headers: authHeader(admin.token) });
  assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.body), 'Admin CAN access /api/users (HTTP 200)', adminUsersRes.status);

  // 3.3 Admin can download any course material without enrollment
  const adminPyMatRes = await request(`/courses/${pythonCourse.id}/materials/${samplePyMat.id}/download`, {
    headers: authHeader(admin.token)
  });
  assert(adminPyMatRes.status === 200, 'Admin can download any course material without being enrolled', adminPyMatRes.status);

  // 3.4 Admin can upload and delete material on any course
  const adminUploadRes = await request(`/courses/${sqlCourse.id}/materials`, {
    method: 'POST',
    headers: {
      ...authHeader(admin.token),
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: postData
  });
  assert(adminUploadRes.status === 201 && adminUploadRes.body?.material?.id, 'Admin CAN upload material to any course (HTTP 201)', adminUploadRes.status);
  if (adminUploadRes.body?.material?.id) {
    const adminDelRes = await request(`/courses/${sqlCourse.id}/materials/${adminUploadRes.body.material.id}`, {
      method: 'DELETE',
      headers: authHeader(admin.token)
    });
    assert(adminDelRes.status === 200, 'Admin CAN delete material from any course (HTTP 200)', adminDelRes.status);
  }

  console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
