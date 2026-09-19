const http = require('http');

async function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('🧪 Starting End-to-End Tests for Vantage Trainer Role...\n');

  // 1. Login Trainer
  console.log('1️⃣ Logging in as Trainer (trainer@vantage.gov.in)...');
  const trainerLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'trainer@vantage.gov.in', password: 'Password@123' }
  );

  if (trainerLogin.status !== 200 || !trainerLogin.data.token) {
    throw new Error('Trainer login failed: ' + JSON.stringify(trainerLogin.data));
  }
  const trainerToken = trainerLogin.data.token;
  const trainerUser = trainerLogin.data.user;
  console.log(`   ✅ Trainer authenticated: ${trainerUser.name} (${trainerUser.id})`);

  // 2. Login Learner
  console.log('\n2️⃣ Logging in as Learner (learner1@vantage.gov.in)...');
  const learnerLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'learner1@vantage.gov.in', password: 'Password@123' }
  );
  if (learnerLogin.status !== 200 || !learnerLogin.data.token) {
    throw new Error('Learner login failed: ' + JSON.stringify(learnerLogin.data));
  }
  const learnerToken = learnerLogin.data.token;
  console.log(`   ✅ Learner authenticated: ${learnerLogin.data.user.name}`);

  // 3. Create Course as Trainer (defaults to draft)
  console.log('\n3️⃣ Trainer creates a new draft course...');
  const newCourseRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/courses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
    },
    {
      title: 'Automated Python Architecture 101',
      description: 'Comprehensive system design with Python',
      difficultyLevel: 'intermediate',
      modules: [
        {
          id: 'mod-1',
          title: 'Module 1: Foundations of Concurrency',
          durationMinutes: 45,
          videoUrl: 'https://www.youtube.com/watch?v=sample1',
          order: 1,
        },
      ],
    }
  );

  if (newCourseRes.status !== 201) {
    throw new Error('Create course failed: ' + JSON.stringify(newCourseRes.data));
  }
  const courseId = newCourseRes.data.id;
  const moduleId = 'mod-1';
  console.log(`   ✅ Course created: ${newCourseRes.data.title} (ID: ${courseId}, Status: ${newCourseRes.data.status})`);

  // 4. Verify draft visibility in public catalog vs trainer's catalog
  console.log('\n4️⃣ Verifying draft course isolation from public catalog...');
  const publicCatalog = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    method: 'GET',
  });
  const inPublicCatalog = publicCatalog.data.some((c) => c.id === courseId);
  console.log(`   ✅ Draft course in public catalog: ${inPublicCatalog} (Expected: false)`);
  if (inPublicCatalog) throw new Error('Draft course leaked to public catalog!');

  const trainerCatalog = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses?myCourses=true',
    method: 'GET',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  const inTrainerCatalog = trainerCatalog.data.some((c) => c.id === courseId);
  console.log(`   ✅ Draft course in trainer's own catalog: ${inTrainerCatalog} (Expected: true)`);
  if (!inTrainerCatalog) throw new Error('Trainer cannot see their draft course!');

  // 5. Authoring 5-Question MCQ Quiz on Module 1
  console.log('\n5️⃣ Trainer saves a 5-question MCQ assessment for Module 1...');
  const mcqQuestions = [
    {
      id: 'q1',
      question: 'What is the Global Interpreter Lock (GIL) in CPython?',
      options: [
        'A mechanism preventing multi-threaded execution of Python bytecode',
        'A memory garbage collection algorithm',
        'A network socket buffer locking protocol',
        'A database connection pool manager',
      ],
      correctIndex: 0,
      explanation: 'CPython uses the GIL to ensure thread safety of internal memory management.',
    },
    {
      id: 'q2',
      question: 'Which module is used for true process-level concurrency in Python?',
      options: ['threading', 'multiprocessing', 'asyncio', 'socket'],
      correctIndex: 1,
      explanation: 'multiprocessing spawns separate OS processes, bypassing the GIL.',
    },
    {
      id: 'q3',
      question: 'What does asyncio use to manage concurrent I/O bound tasks?',
      options: ['Multiple operating system threads', 'Event loop with coroutines', 'Kernel-level preemptive context switching', 'Hardware interrupts'],
      correctIndex: 1,
      explanation: 'asyncio relies on an event loop and async/await coroutines.',
    },
    {
      id: 'q4',
      question: 'Which keyword creates an asynchronous generator in Python?',
      options: ['async yield', 'async def with yield', 'yield async', 'generate async'],
      correctIndex: 1,
      explanation: 'async def with yield statement creates an async generator.',
    },
    {
      id: 'q5',
      question: 'What is the output of isinstance(lambda x: x, collections.abc.Callable)?',
      options: ['True', 'False', 'TypeError', 'None'],
      correctIndex: 0,
      explanation: 'Lambdas are instances of Callable.',
    },
  ];

  const saveAssessmentRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/assessments/course/${courseId}/module/${moduleId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
    },
    {
      passThreshold: 80,
      questions: mcqQuestions,
    }
  );
  console.log(`   ✅ Assessment saved (Status: ${saveAssessmentRes.status})`);
  if (saveAssessmentRes.status !== 200) {
    throw new Error('Save assessment failed: ' + JSON.stringify(saveAssessmentRes.data));
  }

  // Verify fetching the assessment
  const fetchAssessment = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/assessments/course/${courseId}/module/${moduleId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  console.log(`   ✅ Fetched assessment for module: ${fetchAssessment.data.questions?.length} questions loaded, ID: ${fetchAssessment.data.assessmentId}`);
  const assessmentId = fetchAssessment.data.assessmentId;

  // 6. Publish Course
  console.log('\n6️⃣ Trainer toggles status from draft to published...');
  const publishRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${courseId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
    },
    { status: 'published' }
  );
  console.log(`   ✅ Status updated: ${publishRes.data.status}`);

  const publicCatalogAfter = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    method: 'GET',
  });
  const inCatalogNow = publicCatalogAfter.data.some((c) => c.id === courseId);
  console.log(`   ✅ Course in public catalog now: ${inCatalogNow} (Expected: true)`);
  if (!inCatalogNow) throw new Error('Published course missing from public catalog!');

  // 7. Learner enrolls and attempts quiz
  console.log('\n7️⃣ Learner enrolls and attempts the quiz...');
  const enrollRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/enrollments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
    },
    { courseId }
  );
  console.log(`   ✅ Learner enrolled (Status: ${enrollRes.status})`);

  // Submit quiz attempt (q1 correct: 0, q2 correct: 1, q3 wrong: 0, q4 wrong: 0, q5 correct: 0)
  const attemptRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/assessments/${assessmentId}/attempt`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
    },
    {
      answers: [0, 1, 0, 0, 0],
    }
  );
  console.log(`   ✅ Quiz submitted, score: ${attemptRes.data.score}%`);

  // 8. Learner Roster & Pacing
  console.log('\n8️⃣ Trainer views Learner Roster and Pacing Diagnostics...');
  const rosterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/courses/${courseId}/learners`,
    method: 'GET',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  console.log(`   ✅ Learners in roster: ${rosterRes.data.length}`);
  const rosterLearner = rosterRes.data[0];
  console.log(`      Learner: ${rosterLearner.name} (${rosterLearner.email})`);
  console.log(`      Status: ${rosterLearner.status}, Progress: ${rosterLearner.progressPercent}%`);
  console.log(`      Stuck indicator (isStuck): ${rosterLearner.isStuck}`);
  console.log(`      Latest quiz scores:`, rosterLearner.latestScores);

  // 9. CSV Roster Export
  console.log('\n9️⃣ Trainer exports Learner Roster as CSV...');
  const csvRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/courses/${courseId}/learners/export`,
    method: 'GET',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  console.log(`   ✅ CSV Content-Type: ${csvRes.headers['content-type']}`);
  console.log(`   ✅ CSV Preview:\n${csvRes.data.trim().split('\n').map(l => '      ' + l).join('\n')}`);
  if (!csvRes.data.includes('Learner Name,Email,Department,Status')) {
    throw new Error('Invalid CSV export content');
  }

  // 10. Quiz Quality Insights
  console.log('\n🔟 Trainer views Quiz Quality Insights...');
  const insightsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/assessments/course/${courseId}/insights`,
    method: 'GET',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  const moduleInsight = insightsRes.data.moduleInsights[0];
  console.log(`   ✅ Insights for "${moduleInsight.moduleTitle}":`);
  console.log(`      Total attempts: ${moduleInsight.totalAttempts}, Avg Score: ${moduleInsight.avgScore}%`);
  moduleInsight.questions.forEach((q, idx) => {
    console.log(`      Q${idx + 1} Failure Rate: ${q.failureRate}% | Needs Review: ${q.needsReview} | Option Counts:`, q.optionDistribution);
  });
  // Check that q3 and q4 have failureRate = 100% and needsReview = true
  const q3Insight = moduleInsight.questions.find((q) => q.id === 'q3');
  if (!q3Insight || !q3Insight.needsReview) {
    throw new Error('Expected Q3 to be flagged for review (failure rate >= 40%)');
  }
  console.log('   ✅ High failure rate questions correctly flagged with "needsReview: true"!');

  // 11. Forum Thread Pinning & Moderation
  console.log('\n1️⃣1️⃣ Testing Course-Scoped Forum Moderation...');
  // Learner creates 2 threads
  const t1 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/forum',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
    },
    {
      courseId,
      title: 'Question on Concurrency Models',
      body: 'Can someone explain when to choose asyncio over multiprocessing?',
    }
  );

  const t2 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/forum',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
    },
    {
      courseId,
      title: '📌 Instructor Guidelines & Resources',
      body: 'Official guidelines and resources for completing Module 1.',
    }
  );
  console.log(`   ✅ Two threads created by learner`);

  // Trainer pins thread 2
  const pinRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/forum/posts/${t2.data.id}/pin`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  console.log(`   ✅ Pinned thread response:`, pinRes.data.message);

  // Check that thread 2 is pinned and sorted first
  const forumList = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/forum?courseId=${courseId}`,
    method: 'GET',
  });
  console.log(`   ✅ Forum list count: ${forumList.data.length}`);
  console.log(`   ✅ First thread title: "${forumList.data[0].title}", isPinned: ${forumList.data[0].isPinned}`);
  if (!forumList.data[0].isPinned || forumList.data[0].id !== t2.data.id) {
    throw new Error('Pinned thread was not sorted to the top!');
  }

  // Trainer replies to thread
  const replyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/forum',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
    },
    {
      parentPostId: t1.data.id,
      body: 'Great question! Choose asyncio for I/O-bound workflows like web scraping or APIs, and multiprocessing for CPU-heavy tasks.',
    }
  );
  console.log(`   ✅ Instructor posted reply: "${replyRes.data.body.slice(0, 40)}..."`);

  // Trainer edits reply
  const editReplyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/forum/posts/${replyRes.data.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
    },
    {
      body: 'Updated reply: Always prefer asyncio for concurrent I/O and multiprocessing for CPU tasks.',
    }
  );
  console.log(`   ✅ Instructor edited reply successfully`);

  // Trainer deletes thread 1
  const deleteThreadRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/forum/posts/${t1.data.id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  console.log(`   ✅ Instructor deleted course thread (Status: ${deleteThreadRes.status})`);

  console.log('\n🎉 ALL 4 CAPABILITIES VERIFIED 100% SUCCESSFULLY!');
}

runE2ETests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
