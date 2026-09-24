import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sqlCourseModules, sqlAssessments } from './sqlCourseData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vantage (Python for Beginners - 10 Modules, 10-Question Quizzes)...');

  // Clear existing records
  await prisma.forumPost.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseCompetencyTag.deleteMany();
  await prisma.course.deleteMany();
  await prisma.competencyProfile.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Competencies
  console.log('Creating Competency: Python Programming...');
  const compPython = await prisma.competency.create({
    data: {
      name: 'Python Programming',
      category: 'Software Development',
      description: 'Foundational programming in Python: development environment setup, variables, data types, operators, conditionals, loops, functions, and hands-on application projects.',
    },
  });

  console.log('Creating Competency: SQL / Database Fundamentals...');
  const compSql = await prisma.competency.create({
    data: {
      name: 'SQL / Database Fundamentals',
      category: 'Data Engineering & Databases',
      description: 'Foundational relational database concepts using MySQL: server and Workbench installation, schema design, SELECT queries, row filtering with WHERE and pattern matching, aggregate filtering with HAVING, and result set pagination with LIMIT and Aliasing.',
    },
  });

  // 2. Create Platform Users (Admin, Trainers, Learners)
  console.log('Creating Platform Users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@vantage.gov.in',
      passwordHash,
      role: 'admin',
      department: 'Administration',
      jobRole: 'Platform Administrator',
      gender: 'male',
      avatar: JSON.stringify({ type: 'preset', presetId: 'm3', bgColor: '#312E81' }),
      phone: '+919999900000',
      phoneVerified: true,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: admin.id,
      fullName: admin.name,
      country: 'India',
      city: 'New Delhi',
      profession: 'WORKING_PROFESSIONAL',
      jobTitle: 'Platform Administrator',
      company: 'Vantage HQ',
      showcaseVisible: true,
      linkedinVisible: true,
      profileCompleted: true,
      profileCompletedAt: new Date(),
    },
  });

  const trainer = await prisma.user.create({
    data: {
      name: 'Alex The Analyst',
      email: 'trainer@vantage.gov.in',
      passwordHash,
      role: 'trainer',
      department: 'Data Analytics & Programming',
      jobRole: 'Lead Instructor',
      gender: 'female',
      avatar: JSON.stringify({ type: 'preset', presetId: 'f3', bgColor: '#1E293B' }),
      phone: '+919999900003',
      phoneVerified: true,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: trainer.id,
      fullName: trainer.name,
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      profession: 'WORKING_PROFESSIONAL',
      highestDegree: 'MASTERS',
      fieldOfStudy: 'Computer Science & Engineering',
      institution: 'IISc Bengaluru',
      jobTitle: 'Lead Instructor',
      company: 'Vantage Academy',
      yearsOfExperience: '8',
      bio: 'Senior Software Instructor & Curriculum Author. Passionate about teaching modern Python, web architecture, and clean coding practices.',
      linkedinUrl: 'https://www.linkedin.com/in/sarah-jenkins-vantage',
      showcaseVisible: true,
      linkedinVisible: true,
      profileCompleted: true,
      profileCompletedAt: new Date(),
    },
  });

  const trainerMet = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sen',
      email: 'trainer.met@vantage.gov.in',
      passwordHash,
      role: 'trainer',
      department: 'Computer Science',
      jobRole: 'Senior Instructor',
      gender: 'female',
      avatar: JSON.stringify({ type: 'preset', presetId: 'f2', bgColor: '#1E293B' }),
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: trainerMet.id,
      fullName: trainerMet.name,
      country: 'India',
      city: 'Kolkata',
      profession: 'WORKING_PROFESSIONAL',
      jobTitle: 'Senior Instructor',
      company: 'Vantage Academy',
      showcaseVisible: true,
      linkedinVisible: true,
      profileCompleted: true,
      profileCompletedAt: new Date(),
    },
  });

  const learner1 = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      email: 'learner1@vantage.gov.in',
      passwordHash,
      role: 'learner',
      department: 'General',
      jobRole: 'Software Learner',
      gender: 'other',
      avatar: JSON.stringify({ type: 'preset', presetId: 'm1', bgColor: '#163016' }),
      phone: '+919999900001',
      phoneVerified: true,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: learner1.id,
      fullName: learner1.name,
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Erode',
      profession: 'STUDENT',
      highestDegree: 'BACHELORS',
      fieldOfStudy: 'Computer Science & Engineering',
      institution: 'Anna University',
      graduationYear: 2026,
      bio: 'Passionate Computer Science student building full-stack applications and mastering Python on Vantage.',
      linkedinUrl: 'https://www.linkedin.com/in/alex-morgan-vantage',
      showcaseVisible: true,
      linkedinVisible: true,
      profileCompleted: true,
      profileCompletedAt: new Date(),
    },
  });

  await prisma.userSkill.createMany({
    data: [
      { userId: learner1.id, name: 'Python Programming', level: 'ADVANCED', source: 'VANTAGE' },
      { userId: learner1.id, name: 'React.js', level: 'INTERMEDIATE', source: 'SELF' },
      { userId: learner1.id, name: 'TypeScript', level: 'INTERMEDIATE', source: 'SELF' },
      { userId: learner1.id, name: 'SQL Databases', level: 'BEGINNER', source: 'SELF' },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      {
        userId: learner1.id,
        title: 'National Hackathon Finalist',
        organization: 'Tech-Fest 2025',
        type: 'HACKATHON',
        description: 'Built a real-time smart queue management system for campus services using Python and React.',
        date: new Date('2025-11-15'),
      },
      {
        userId: learner1.id,
        title: 'Vantage Certified Python Developer',
        organization: 'Vantage Platform',
        type: 'CERTIFICATION',
        description: 'Successfully completed the comprehensive Introduction to Python course with 100% progress.',
        date: new Date('2026-02-10'),
      },
    ],
  });

  await prisma.experience.createMany({
    data: [
      {
        userId: learner1.id,
        jobTitle: 'Web Developer Intern',
        company: 'InnovateTech Solutions',
        employmentType: 'Internship',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        description: 'Assisted in building responsive frontend components in React and optimizing API endpoints.',
      },
    ],
  });

  // Learner 2: INCOMPLETE PROFILE (For testing onboarding)
  const learner2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'learner@vantage.gov.in',
      passwordHash,
      role: 'learner',
      department: 'General',
      jobRole: 'Student',
      gender: 'female',
      avatar: JSON.stringify({ type: 'preset', presetId: 'f1', bgColor: '#163016' }),
      phone: '+919999900002',
      phoneVerified: false,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: learner2.id,
      fullName: learner2.name,
      country: 'India',
      city: '',
      profession: 'OTHER',
      profileCompleted: false,
    },
  });

  // Competency profiles
  await prisma.competencyProfile.create({
    data: {
      userId: learner1.id,
      skills: JSON.stringify([
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 1 },
        { competencyId: compSql.id, competencyName: compSql.name, currentLevel: 1 },
      ]),
    },
  });

  await prisma.competencyProfile.create({
    data: {
      userId: learner2.id,
      skills: JSON.stringify([
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 1 },
      ]),
    },
  });

  // 3. Create Course: Python for Beginners
  console.log('Creating Course: Python for Beginners (10 Modules)...');
  const pythonCourse = await prisma.course.create({
    data: {
      title: 'Python for Beginners',
      description: 'A comprehensive, beginner-friendly video course covering fundamental Python programming concepts — environment setup with Jupyter Notebooks, variables, data types, operators, conditionals, loops, functions, and a hands-on project building a BMI Calculator. Built from Alex The Analyst’s curated educational series.',
      difficultyLevel: 'Beginner',
      status: 'published',
      trainerId: trainer.id,
      contentUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod-py-1',
          title: 'Installing Jupyter Notebooks/Anaconda | Python for Beginners',
          durationMinutes: 10,
          order: 1,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=WUeBzT43JyY',
          contentMarkdown: `# Module 1: Installing Jupyter Notebooks/Anaconda

Welcome to **Python for Beginners**! In this module, you will learn how to set up your Python development environment using Anaconda Distribution and Jupyter Notebooks.

### Key Learning Objectives:
- Downloading and installing Anaconda for your operating system
- Navigating the Anaconda Navigator interface
- Launching and understanding the Jupyter Notebook web environment
- Creating new notebooks, running code cells with \`Shift + Enter\`, and utilizing Markdown cells for documentation

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-2',
          title: 'Variables in Python | Python for Beginners',
          durationMinutes: 13,
          order: 2,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=pHOH7UfOhbE',
          contentMarkdown: `# Module 2: Variables in Python

Variables serve as named storage locations in memory for holding data. Learn how Python dynamically assigns types to variables and follows standard identifier rules.

### Key Learning Objectives:
- Assigning values using the assignment operator (\`=\`)
- Python variable naming rules and conventions (letters, numbers, underscores; cannot begin with digits)
- Case sensitivity in variable identifiers (\`Value\` vs \`value\`)
- Multi-variable assignment in a single line (\`x, y, z = 10, 20, 30\`)
- Reassigning variables and dynamic type reassignment

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-3',
          title: 'Data Types in Python | Python for Beginners',
          durationMinutes: 22,
          order: 3,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=ppsCxnNm-JI',
          contentMarkdown: `# Module 3: Data Types in Python

Python features versatile built-in data types categorized into numeric, text, boolean, sequence, and mapping collections.

### Key Learning Objectives:
- Numeric types: Integers (\`int\`), Floats (\`float\`), Complex numbers
- Text type: Strings (\`str\`) with single, double, or triple quotes
- Boolean type: \`True\` and \`False\` truth values
- Sequence types: Ordered mutable Lists (\`[]\`) and ordered immutable Tuples (\`()\`)
- Mapping and Set types: Key-value Dictionaries (\`{}\`) and unique Sets (\`set()\`)
- Inspecting types using the built-in \`type()\` function

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-4',
          title: 'Comparison, Logical, and Membership Operators in Python | Python for Beginners',
          durationMinutes: 7,
          order: 4,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=lPVke-p4S7s',
          contentMarkdown: `# Module 4: Comparison, Logical, and Membership Operators

Operators empower programs to evaluate expressions, compare quantities, and test collection membership.

### Key Learning Objectives:
- Comparison operators: Equality (\`==\`), Inequality (\`!=\`), Greater/Less than (\`>\`, \`<\`, \`>=\`, \`<=\`)
- Logical operators: \`and\` (both true), \`or\` (at least one true), \`not\` (inverts truth value)
- Membership operators: \`in\` and \`not in\` for testing element presence within sequences and containers
- Combining complex compound boolean expressions

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-5',
          title: 'If Else Statements in Python | Python for Beginners',
          durationMinutes: 7,
          order: 5,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=-BOBedcjySI',
          contentMarkdown: `# Module 5: If Else Statements in Python

Control flow allows programs to execute distinct code paths based on dynamic runtime conditions.

### Key Learning Objectives:
- Structuring conditional blocks with \`if\`, \`elif\` (else-if), and \`else\`
- The critical role of whitespace indentation in Python code blocks
- Syntax rules including the terminating colon (\`:\`) on headers
- Evaluating truthy and falsy values in branching logic
- Writing nested conditional structures

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-6',
          title: 'For Loops in Python | Python for Beginners',
          durationMinutes: 9,
          order: 6,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=zmIdC0_0BgY',
          contentMarkdown: `# Module 6: For Loops in Python

For loops provide definite iteration over sequential collections such as lists, strings, and numerical ranges.

### Key Learning Objectives:
- Iterating across list items and string characters sequentially
- Utilizing the \`range(start, stop, step)\` function for counter-based loops
- Iterating through dictionaries using \`.keys()\`, \`.values()\`, and \`.items()\`
- Implementing nested for loops for multi-dimensional data traversal

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-7',
          title: 'While Loops in Python | Python for Beginners',
          durationMinutes: 6,
          order: 7,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=ECduJk00mUU',
          contentMarkdown: `# Module 7: While Loops in Python

While loops execute statements repeatedly as long as a boolean test condition remains true.

### Key Learning Objectives:
- Writing condition-driven loops with counter variables
- Managing loop termination and avoiding accidental infinite loops
- Using the \`break\` statement to exit loops immediately upon specific triggers
- Using the \`continue\` statement to skip the current iteration and proceed to the next cycle

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-8',
          title: 'Functions in Python | Python for Beginners',
          durationMinutes: 13,
          order: 8,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=zvzjaqMBEso',
          contentMarkdown: `# Module 8: Functions in Python

Functions encapsulate modular, reusable blocks of code that can be invoked across your application.

### Key Learning Objectives:
- Defining functions with the \`def\` keyword and naming guidelines
- Declaring parameters and passing arguments during invocation
- Positional arguments vs keyword arguments
- Specifying default parameter values for flexible function signatures
- Returning computed values with \`return\`
- Understanding local variable scope inside functions

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-9',
          title: 'Converting Data Types in Python | Python for Beginners',
          durationMinutes: 7,
          order: 9,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=B63bN2cLVLM',
          contentMarkdown: `# Module 9: Converting Data Types in Python

Type casting and conversion allow seamless data transformation between strings, numbers, and collections.

### Key Learning Objectives:
- Explicit conversion functions: \`int()\`, \`float()\`, \`str()\`
- Converting string inputs into numeric types for mathematical calculations
- Converting between collections: \`list()\`, \`tuple()\`, and \`set()\`
- Deduplicating list elements by casting through \`set()\`
- Handling common type conversion errors such as \`ValueError\`

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
        {
          id: 'mod-py-10',
          title: 'Building a BMI Calculator with Python | Python Projects for Beginners',
          durationMinutes: 14,
          order: 10,
          attribution: 'Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).',
          videoUrl: 'https://www.youtube.com/watch?v=ey1VNjU0YbM',
          contentMarkdown: `# Module 10: Hands-on Project: Building a BMI Calculator

Apply everything learned throughout the course to create a complete, interactive Body Mass Index (BMI) calculator application.

### Key Learning Objectives:
- Capturing user input using \`input()\`
- Casting string inputs to numeric floats for height and weight
- Implementing the mathematical BMI calculation formula: \`BMI = weight / (height ** 2)\`
- Using \`if-elif-else\` conditional branching to classify BMI ranges (Underweight, Normal weight, Overweight, Obese)
- Formatting and displaying clean diagnostic feedback to the user

---
*Attribution: Video: Alex The Analyst — Python for Beginners, used under CC BY (reuse allowed).*`,
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compPython.id, targetLevel: 2 },
        ],
      },
    },
  });

  // 4. Create 10 Module Assessments (10 questions each = 100 questions total, passThreshold: 70)
  console.log('Creating 10 Module Quizzes (10 questions each, 100 questions total)...');

  // Module 1 Quiz: Installing Jupyter Notebooks/Anaconda (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-1',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py1-q1',
          question: 'What is Anaconda primarily used for in Python development?',
          options: [
            'A package manager and distribution platform for Python & data science libraries',
            'A text editor plugin for compiling C++ code',
            'A database server for hosting SQL databases',
            'An operating system replacement for running Python kernels',
          ],
          correctIndex: 0,
          explanation: 'Anaconda is an open-source distribution that bundles Python, package management (conda), and popular data science tools.',
        },
        {
          id: 'py1-q2',
          question: 'Which web-based interactive computational environment is launched from Anaconda Navigator?',
          options: ['Jupyter Notebook', 'Eclipse IDE', 'Adobe Dreamweaver', 'MySQL Workbench'],
          correctIndex: 0,
          explanation: 'Jupyter Notebook is the browser-based notebook interface included in Anaconda for writing and running interactive Python code.',
        },
        {
          id: 'py1-q3',
          question: 'What keyboard shortcut executes the current cell in Jupyter Notebook and creates/advances to the next cell?',
          options: ['Shift + Enter', 'Alt + Backspace', 'Ctrl + Z', 'Tab + Space'],
          correctIndex: 0,
          explanation: 'Pressing Shift + Enter executes the active cell and moves focus to the subsequent cell.',
        },
        {
          id: 'py1-q4',
          question: 'What standard file extension is used for Jupyter Notebook files?',
          options: ['.ipynb', '.pybook', '.jpt', '.pynb'],
          correctIndex: 0,
          explanation: 'Jupyter Notebook files use the `.ipynb` (Interactive Python Notebook) extension.',
        },
        {
          id: 'py1-q5',
          question: 'In Jupyter Notebooks, which cell type is used to write formatted text, headers, and explanations rather than executable code?',
          options: ['Markdown cell', 'Code cell', 'Raw NBConvert cell', 'Binary cell'],
          correctIndex: 0,
          explanation: 'Markdown cells allow you to render formatted headings, bullet lists, and documentation alongside code.',
        },
        {
          id: 'py1-q6',
          question: 'What keyboard shortcut runs the selected cell in Jupyter Notebook without advancing focus to the next cell?',
          options: ['Ctrl + Enter', 'Shift + Tab', 'Alt + F4', 'Ctrl + W'],
          correctIndex: 0,
          explanation: 'Ctrl + Enter executes the currently selected cell and stays on the same cell.',
        },
        {
          id: 'py1-q7',
          question: 'In Jupyter Command Mode (blue border), which single key converts a Code cell into a Markdown cell?',
          options: ['M', 'Y', 'D', 'C'],
          correctIndex: 0,
          explanation: 'Pressing M in Command Mode transforms the active cell to Markdown format.',
        },
        {
          id: 'py1-q8',
          question: 'In Anaconda Navigator, what is an "Environment"?',
          options: [
            'An isolated workspace directory containing specific versions of Python and installed packages',
            'A cloud server hosted on AWS',
            'A visual theme setting for the editor',
            'The operating system user account',
          ],
          correctIndex: 0,
          explanation: 'Conda environments allow you to isolate project dependencies and Python versions.',
        },
        {
          id: 'py1-q9',
          question: 'In Jupyter Notebook, what indicator appears next to a cell while it is actively executing code?',
          options: ['In [*]', 'In [Done]', 'In [Running]', 'In [0]'],
          correctIndex: 0,
          explanation: 'The asterisk `In [*]` designates that the kernel is currently processing and executing that cell.',
        },
        {
          id: 'py1-q10',
          question: 'In Jupyter Command Mode, which key inserts a new blank cell ABOVE the currently highlighted cell?',
          options: ['A', 'B', 'I', 'N'],
          correctIndex: 0,
          explanation: 'Pressing A (Above) creates a new cell above; pressing B (Below) creates one below.',
        },
      ]),
    },
  });

  // Module 2 Quiz: Variables in Python (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-2',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py2-q1',
          question: 'How do you assign the integer value 25 to a variable named `age` in Python?',
          options: ['age = 25', 'var age := 25', 'let age == 25', 'int age -> 25'],
          correctIndex: 0,
          explanation: 'In Python, variable assignment uses a single equals sign (`age = 25`).',
        },
        {
          id: 'py2-q2',
          question: 'Which of the following is an INVALID variable name in Python?',
          options: ['3rd_score', 'first_name', '_tempValue', 'total_count_2026'],
          correctIndex: 0,
          explanation: 'Python variable names cannot start with a numeric digit (`3rd_score` is invalid).',
        },
        {
          id: 'py2-q3',
          question: 'Are variable names in Python case-sensitive?',
          options: [
            'Yes, `Score` and `score` are treated as two distinct variables',
            'No, Python ignores capitalization in variable identifiers',
            'Only inside class definitions',
            'Only when imported from external modules',
          ],
          correctIndex: 0,
          explanation: 'Python is strictly case-sensitive: `Score`, `score`, and `SCORE` refer to separate variables.',
        },
        {
          id: 'py2-q4',
          question: "What does the statement `x, y, z = 'Apple', 'Banana', 'Cherry'` accomplish in Python?",
          options: [
            "Assigns 'Apple' to x, 'Banana' to y, and 'Cherry' to z simultaneously",
            'Creates a tuple named x containing y and z',
            'Throws a SyntaxError because multiple assignment is illegal',
            'Combines all three strings into x only',
          ],
          correctIndex: 0,
          explanation: 'Python supports simultaneous assignment of multiple variables in a single statement.',
        },
        {
          id: 'py2-q5',
          question: "What happens when you reassign an existing variable `x = 10` to `x = 'Hello'` in Python?",
          options: [
            'The variable is dynamically updated to hold the string value and string data type',
            'Python throws a TypeError because data types cannot change',
            'The original integer 10 is converted to ASCII characters',
            'The program halts with a ReassignmentError',
          ],
          correctIndex: 0,
          explanation: 'Python is dynamically typed; reassigning a variable updates its value and data type automatically.',
        },
        {
          id: 'py2-q6',
          question: 'Which variable naming style is recommended by Python standard style guide (PEP 8) for normal variables?',
          options: ['snake_case (e.g. user_account_id)', 'camelCase (e.g. userAccountId)', 'PascalCase (e.g. UserAccountId)', 'kebab-case (e.g. user-account-id)'],
          correctIndex: 0,
          explanation: 'PEP 8 recommends snake_case (lowercase letters with underscores) for variable and function names.',
        },
        {
          id: 'py2-q7',
          question: 'What error is raised if you attempt to use a reserved Python keyword (such as `for = 10`) as a variable identifier?',
          options: ['SyntaxError', 'NameError', 'KeywordError', 'TypeError'],
          correctIndex: 0,
          explanation: 'Keywords like `for`, `if`, `class`, and `def` are reserved by the language syntax and raise a SyntaxError.',
        },
        {
          id: 'py2-q8',
          question: 'What is the result of executing `a = b = c = 100` in Python?',
          options: [
            'Variables a, b, and c are all assigned the integer value 100',
            'Only variable a gets 100; b and c remain undefined',
            'Throws a MultipleAssignmentError',
            'Creates a list `[100, 100, 100]` assigned to a',
          ],
          correctIndex: 0,
          explanation: 'Chained assignment sets all listed variables to the same right-hand value.',
        },
        {
          id: 'py2-q9',
          question: 'What happens if you reference a variable name `total_price` before assigning any value to it?',
          options: [
            'Python raises a `NameError: name \'total_price\' is not defined`',
            'Python assigns `None` automatically',
            'Python initializes it to 0',
            'The code continues with empty string `""`',
          ],
          correctIndex: 0,
          explanation: 'Accessing uninitialized variable names triggers a NameError at runtime.',
        },
        {
          id: 'py2-q10',
          question: 'Which of the following characters can legally appear inside a Python variable name?',
          options: ['Underscore `_`', 'Dollar sign `$`', 'Hyphen `-`', 'At symbol `@`'],
          correctIndex: 0,
          explanation: 'Variable names can only contain letters, numbers, and underscores (`_`).',
        },
      ]),
    },
  });

  // Module 3 Quiz: Data Types in Python (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-3',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py3-q1',
          question: 'Which built-in Python function returns the data type of an object or variable?',
          options: ['type()', 'typeof()', 'datatype()', 'inspect.type()'],
          correctIndex: 0,
          explanation: 'The built-in `type()` function (e.g. `type(42)`) returns `<class \'int\'>`.',
        },
        {
          id: 'py3-q2',
          question: "What data type is represented by text enclosed in quotation marks, such as `city = 'New York'`?",
          options: ['str (String)', 'char (Character)', 'text (TextBlock)', 'varchar (VarChar)'],
          correctIndex: 0,
          explanation: 'Text sequences in Python are instances of the `str` (string) class.',
        },
        {
          id: 'py3-q3',
          question: 'What is the primary difference between a Python list `[1, 2, 3]` and a tuple `(1, 2, 3)`?',
          options: [
            'Lists are mutable (can be changed in-place), whereas tuples are immutable (cannot be altered after creation)',
            'Tuples can hold numbers while lists can only hold text strings',
            'Lists use round parentheses while tuples use square brackets',
            'Tuples execute slower than lists for data lookups',
          ],
          correctIndex: 0,
          explanation: 'Lists are mutable sequences defined with square brackets `[]`, while tuples are immutable sequences defined with parentheses `()`.',
        },
        {
          id: 'py3-q4',
          question: 'Which data type stores information in key-value pairs using curly braces `{}`?',
          options: ['dict (Dictionary)', 'list (List)', 'tuple (Tuple)', 'bool (Boolean)'],
          correctIndex: 0,
          explanation: 'Dictionaries (`dict`) store associations between unique keys and corresponding values.',
        },
        {
          id: 'py3-q5',
          question: 'What boolean value does `bool(0)` evaluate to in Python?',
          options: ['False', 'True', 'None', 'ZeroError'],
          correctIndex: 0,
          explanation: 'In Python boolean evaluation, numeric zero `0` evaluates to `False`, while non-zero numbers evaluate to `True`.',
        },
        {
          id: 'py3-q6',
          question: 'How do you instantiate a truly empty `set` in Python without creating a dictionary?',
          options: ['set()', '{}', '[]', '()'],
          correctIndex: 0,
          explanation: '`{}` defaults to creating an empty `dict`; creating an empty set requires `set()`.',
        },
        {
          id: 'py3-q7',
          question: 'What is the data type returned by `type(3.14159)` in Python?',
          options: ["<class 'float'>", "<class 'int'>", "<class 'decimal'>", "<class 'double'>"],
          correctIndex: 0,
          explanation: 'Numbers containing decimal points are instances of the `float` class.',
        },
        {
          id: 'py3-q8',
          question: 'How are multi-line string blocks defined in Python?',
          options: [
            'Enclosing text in triple quotes `\'\'\'` or `"""`',
            'Using backticks `` ` ``',
            'Adding `//` at each line start',
            'Ending each line with `&&`',
          ],
          correctIndex: 0,
          explanation: 'Triple single or triple double quotes define multi-line string literals.',
        },
        {
          id: 'py3-q9',
          question: 'What is the index of the first item in any Python list or sequence?',
          options: ['0 (zero-based indexing)', '1 (one-based indexing)', '-1', 'null'],
          correctIndex: 0,
          explanation: 'Python sequences utilize zero-based indexing.',
        },
        {
          id: 'py3-q10',
          question: "Given `languages = ['Python', 'SQL', 'R']`, what does `languages[-1]` evaluate to?",
          options: ["'R'", "'Python'", "'SQL'", 'IndexError'],
          correctIndex: 0,
          explanation: 'Negative indexing in Python counts from the end: `-1` refers to the last element.',
        },
      ]),
    },
  });

  // Module 4 Quiz: Operators in Python (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-4',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py4-q1',
          question: 'Which operator tests whether two values are equal in Python?',
          options: ['==', '=', '===', 'equals()'],
          correctIndex: 0,
          explanation: '`==` is the equality comparison operator; `=` is reserved for variable assignment.',
        },
        {
          id: 'py4-q2',
          question: 'What is the result of the expression `(10 > 5) and (3 > 7)` in Python?',
          options: ['False', 'True', 'None', 'SyntaxError'],
          correctIndex: 0,
          explanation: '`10 > 5` is True, but `3 > 7` is False. The `and` operator requires both operands to be True, yielding False.',
        },
        {
          id: 'py4-q3',
          question: "What does the membership operator evaluate to in: `'cat' in ['dog', 'cat', 'bird']`?",
          options: ['True', 'False', '1', 'None'],
          correctIndex: 0,
          explanation: "The `in` operator checks whether `'cat'` exists in the list, returning `True`.",
        },
        {
          id: 'py4-q4',
          question: 'Which operator checks whether two values are NOT equal in Python?',
          options: ['!=', '<>', '!==', 'NOT ='],
          correctIndex: 0,
          explanation: '`!=` is the inequality operator in Python.',
        },
        {
          id: 'py4-q5',
          question: 'What is the effect of the `not` logical operator on a boolean expression?',
          options: [
            'Inverts the boolean value, changing True to False and False to True',
            'Sets the expression permanently to None',
            'Raises a boolean exception if the value is False',
            'Converts strings into boolean objects',
          ],
          correctIndex: 0,
          explanation: '`not` is a unary operator that negates the boolean value of its operand.',
        },
        {
          id: 'py4-q6',
          question: 'What is the result of the expression `(10 == 10) or (5 > 50)` in Python?',
          options: ['True', 'False', 'None', 'TypeError'],
          correctIndex: 0,
          explanation: 'The `or` operator returns True if at least one operand is True (`10 == 10` is True).',
        },
        {
          id: 'py4-q7',
          question: 'What does the comparison `15 >= 15` evaluate to in Python?',
          options: ['True', 'False', 'None', 'SyntaxError'],
          correctIndex: 0,
          explanation: 'The greater-than-or-equal operator returns True because 15 is equal to 15.',
        },
        {
          id: 'py4-q8',
          question: "What does `'apple' not in ['banana', 'cherry', 'grape']` evaluate to?",
          options: ['True', 'False', 'None', 'KeyError'],
          correctIndex: 0,
          explanation: 'The `not in` operator returns True because \'apple\' is not contained in the list.',
        },
        {
          id: 'py4-q9',
          question: 'What is the key difference between `==` and the `is` keyword in Python?',
          options: [
            '`==` checks value equality; `is` checks whether two variables refer to the identical object in memory',
            '`is` is for mathematical calculations while `==` is for strings',
            '`==` is deprecated in Python 3',
            'There is no difference; they are exact aliases',
          ],
          correctIndex: 0,
          explanation: '`==` compares values, whereas `is` tests identity (same memory address).',
        },
        {
          id: 'py4-q10',
          question: 'How does Python evaluate chained comparisons such as `1 < 5 < 10`?',
          options: [
            'As `(1 < 5) and (5 < 10)`, returning True',
            'Evaluates `(1 < 5)` as True, then checks `True < 10`',
            'Throws a SyntaxError for chaining comparisons',
            'Always returns False',
          ],
          correctIndex: 0,
          explanation: 'Python chains relational operators as a logical `and` between pairs.',
        },
      ]),
    },
  });

  // Module 5 Quiz: If Else Statements (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-5',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py5-q1',
          question: 'What keyword is used in Python to test multiple sequential conditions after an initial `if` statement?',
          options: ['elif', 'else if', 'elseif', 'then'],
          correctIndex: 0,
          explanation: 'Python uses `elif` (short for else if) for sequential branching.',
        },
        {
          id: 'py5-q2',
          question: 'How does Python delineate code blocks under an `if` statement?',
          options: [
            'Through consistent whitespace indentation',
            'Enclosing code blocks in curly braces `{}`',
            'Using `begin` and `end` keywords',
            'Ending each block statement with semicolons `;`',
          ],
          correctIndex: 0,
          explanation: 'Python uses indentation (typically 4 spaces) to define execution blocks.',
        },
        {
          id: 'py5-q3',
          question: 'When does the `else` block execute in an if-elif-else conditional structure?',
          options: [
            'Only when all preceding `if` and `elif` conditions evaluate to False',
            'Always, regardless of preceding conditions',
            'Only when the first `if` statement evaluates to True',
            'Immediately before the `if` block executes',
          ],
          correctIndex: 0,
          explanation: 'The `else` branch serves as the fallback, executing only when all previous conditions are False.',
        },
        {
          id: 'py5-q4',
          question: "What will be printed: `x = 15; if x < 10: print('A'); elif x < 20: print('B'); else: print('C')`?",
          options: ['B', 'A', 'C', 'A and B'],
          correctIndex: 0,
          explanation: '`15 < 10` is False, but `15 < 20` is True, so `print(\'B\')` executes and the chain terminates.',
        },
        {
          id: 'py5-q5',
          question: 'What punctuation character must follow an `if`, `elif`, or `else` statement header line?',
          options: [': (colon)', '; (semicolon)', '{ (open brace)', '-> (arrow)'],
          correctIndex: 0,
          explanation: 'Header statements in Python (`if`, `elif`, `else`, `for`, `while`, `def`) must conclude with a colon `:`.',
        },
        {
          id: 'py5-q6',
          question: 'What is a nested `if` statement in Python?',
          options: [
            'An `if` statement placed inside the code block of another `if` statement',
            'An `if` statement that repeats itself in a loop',
            'An `if` statement that cannot have an `else` branch',
            'A conditional expression with no condition',
          ],
          correctIndex: 0,
          explanation: 'Nesting allows evaluating secondary conditions inside an existing branch.',
        },
        {
          id: 'py5-q7',
          question: 'What happens if an `if` condition evaluates to False and there are no `elif` or `else` clauses attached?',
          options: [
            'Python skips the indented code block and continues execution of following statements',
            'Python raises a ConditionFailedError',
            'The program halts immediately',
            'Python retries evaluating the condition',
          ],
          correctIndex: 0,
          explanation: 'When a standalone `if` evaluates to False, its body is skipped and execution proceeds.',
        },
        {
          id: 'py5-q8',
          question: 'Which syntax correctly writes a one-line ternary conditional expression in Python?',
          options: [
            "result = 'Pass' if score >= 70 else 'Fail'",
            "result = score >= 70 ? 'Pass' : 'Fail'",
            "result = if score >= 70: 'Pass' else: 'Fail'",
            "result = ternary(score >= 70, 'Pass', 'Fail')",
          ],
          correctIndex: 0,
          explanation: 'Python conditional expressions use the format `x if condition else y`.',
        },
        {
          id: 'py5-q9',
          question: 'Which statement acts as a valid empty placeholder in an `if` block where code is planned for later?',
          options: ['pass', 'skip', 'null', 'continue'],
          correctIndex: 0,
          explanation: 'The `pass` keyword acts as a null operation to satisfy syntactic indentation requirements.',
        },
        {
          id: 'py5-q10',
          question: 'Which of the following values will evaluate to True in an `if` condition in Python?',
          options: ["'False' (non-empty string)", "'' (empty string)", '0 (integer zero)', 'None'],
          correctIndex: 0,
          explanation: 'Any non-empty string in Python evaluates to True in a boolean context.',
        },
      ]),
    },
  });

  // Module 6 Quiz: For Loops (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-6',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py6-q1',
          question: 'Which built-in function generates a sequence of numbers frequently used in `for` loops?',
          options: ['range()', 'sequence()', 'count()', 'iterate()'],
          correctIndex: 0,
          explanation: '`range()` creates an immutable sequence of integers over a specified interval.',
        },
        {
          id: 'py6-q2',
          question: 'What numbers are produced by `list(range(1, 6))`?',
          options: ['[1, 2, 3, 4, 5]', '[1, 2, 3, 4, 5, 6]', '[0, 1, 2, 3, 4, 5]', '[2, 3, 4, 5, 6]'],
          correctIndex: 0,
          explanation: '`range(start, stop)` starts at 1 and stops before 6: `[1, 2, 3, 4, 5]`.',
        },
        {
          id: 'py6-q3',
          question: 'How do you iterate through both keys and values of a dictionary `data` in a `for` loop?',
          options: [
            'for key, value in data.items():',
            'for key, value in data.both():',
            'for key, value in data.pairs():',
            'for item in data.iterate_all():',
          ],
          correctIndex: 0,
          explanation: 'The `.items()` method yields key-value tuples that can be unpacked into `key, value`.',
        },
        {
          id: 'py6-q4',
          question: "What occurs during execution of `for char in 'Python':`?",
          options: [
            'The loop executes 6 times, binding each character of the string to `char` sequentially',
            'The loop throws a TypeError because strings cannot be iterated',
            'The loop executes only once for the whole word',
            'The loop reverses the letters of the string',
          ],
          correctIndex: 0,
          explanation: 'Strings in Python are iterable sequences of characters.',
        },
        {
          id: 'py6-q5',
          question: 'If an outer for loop runs 3 times and an inner nested for loop runs 4 times, how many total inner loop body executions occur?',
          options: ['12', '7', '4', '81'],
          correctIndex: 0,
          explanation: 'For each of the 3 outer iterations, the inner loop executes 4 times: 3 * 4 = 12 total iterations.',
        },
        {
          id: 'py6-q6',
          question: 'What does the third argument in `range(2, 10, 2)` specify?',
          options: [
            'The step (increment) between consecutive numbers',
            'The number of decimal places',
            'The maximum loop execution timeout in seconds',
            'The starting offset',
          ],
          correctIndex: 0,
          explanation: 'In `range(start, stop, step)`, the 3rd parameter determines the step size.',
        },
        {
          id: 'py6-q7',
          question: 'What sequence of integers is generated by `list(range(4))`?',
          options: ['[0, 1, 2, 3]', '[1, 2, 3, 4]', '[0, 1, 2, 3, 4]', '[1, 2, 3]'],
          correctIndex: 0,
          explanation: '`range(n)` defaults to starting at index 0 and stopping before n.',
        },
        {
          id: 'py6-q8',
          question: 'Which built-in function allows retrieving both the current loop index and item during a `for` loop iteration?',
          options: ['enumerate()', 'zip()', 'counter()', 'indexed()'],
          correctIndex: 0,
          explanation: '`enumerate(iterable)` returns an iterator yielding `(index, item)` pairs.',
        },
        {
          id: 'py6-q9',
          question: 'When is the `else` block attached to a `for` loop executed in Python?',
          options: [
            'When the loop exhausts all elements normally without encountering a `break` statement',
            'Only if the iterable collection was empty',
            'Before the first loop iteration starts',
            'Every time an iteration finishes',
          ],
          correctIndex: 0,
          explanation: 'A loop `else` block runs only upon uninterrupted completion of the loop.',
        },
        {
          id: 'py6-q10',
          question: 'How do you generate a decreasing sequence of numbers from 5 down to 1 using `range()`?',
          options: ['range(5, 0, -1)', 'range(5, 1, 1)', 'range(1, 5, -1)', 'range(5, -1, 0)'],
          correctIndex: 0,
          explanation: '`range(5, 0, -1)` starts at 5, decrements by 1, and stops before 0.',
        },
      ]),
    },
  });

  // Module 7 Quiz: While Loops (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-7',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py7-q1',
          question: 'Under what condition does a `while` loop continue executing its body statements?',
          options: [
            'As long as its boolean test condition evaluates to True',
            'Until it has executed exactly 100 iterations',
            'Only while all variables in the scope are positive',
            'As long as the CPU has idle memory',
          ],
          correctIndex: 0,
          explanation: 'A `while` loop checks its condition prior to each iteration and continues while True.',
        },
        {
          id: 'py7-q2',
          question: 'What occurs if the test condition of a `while` loop never becomes False and contains no `break`?',
          options: [
            'It creates an infinite loop that runs continuously until stopped',
            'Python automatically terminates the loop after 10 seconds',
            'It throws an InfiniteLoopException immediately',
            'The computer operating system restarts',
          ],
          correctIndex: 0,
          explanation: 'A while loop with an invariant True condition results in an infinite loop.',
        },
        {
          id: 'py7-q3',
          question: 'Which keyword immediately exits and terminates a `while` loop regardless of condition status?',
          options: ['break', 'continue', 'stop', 'pass'],
          correctIndex: 0,
          explanation: '`break` immediately terminates loop execution and transfers control to the next statement outside the loop.',
        },
        {
          id: 'py7-q4',
          question: 'What is the purpose of the `continue` statement inside a loop?',
          options: [
            'Skips remaining statements in the current iteration and jumps directly to the next loop evaluation',
            'Restarts the program from line 1',
            'Terminates the loop completely',
            'Pauses loop execution for 5 seconds',
          ],
          correctIndex: 0,
          explanation: '`continue` aborts the active cycle and immediately starts the subsequent iteration.',
        },
        {
          id: 'py7-q5',
          question: 'Given `num = 0; while num < 4: num += 1`, what is the value of `num` after the loop exits?',
          options: ['4', '3', '5', '0'],
          correctIndex: 0,
          explanation: 'The loop increments `num` through 1, 2, 3, and 4. When `num == 4`, the condition `4 < 4` becomes False and the loop exits.',
        },
        {
          id: 'py7-q6',
          question: 'What does the assignment operator `x += 1` accomplish in a while loop?',
          options: [
            'Increments the value of x by 1 in-place (equivalent to `x = x + 1`)',
            'Checks if x is equal to 1',
            'Multiplies x by 1',
            'Resets x to 1',
          ],
          correctIndex: 0,
          explanation: '`+=` is the addition assignment operator that adds the right operand to the variable.',
        },
        {
          id: 'py7-q7',
          question: 'What is the output of: `i = 1; while i < 5: print(i); break`?',
          options: ['Prints 1 once and stops', 'Prints 1, 2, 3, 4', 'Runs infinitely', 'Prints nothing'],
          correctIndex: 0,
          explanation: 'The `break` statement executes during the very first iteration, exiting the loop after printing 1.',
        },
        {
          id: 'py7-q8',
          question: 'What does the header `while True:` commonly represent in Python applications?',
          options: [
            'An intentional infinite loop that continues until an internal `break` condition is met',
            'A loop that executes only once',
            'A deprecated loop format',
            'A loop that only runs during unit tests',
          ],
          correctIndex: 0,
          explanation: '`while True:` runs indefinitely until explicitly broken with `break` or `return`.',
        },
        {
          id: 'py7-q9',
          question: 'In a `while...else` loop, when is the `else` block NOT executed?',
          options: [
            'When the loop is exited via a `break` statement',
            'When the loop finishes with condition False',
            'When the loop executes zero times',
            'When no error occurs',
          ],
          correctIndex: 0,
          explanation: 'Hitting a `break` statement bypasses any loop `else` block.',
        },
        {
          id: 'py7-q10',
          question: 'If `x = 5; while x > 0: x -= 2`, what is the final value of `x` when the while loop finishes?',
          options: ['-1', '0', '1', '2'],
          correctIndex: 0,
          explanation: 'x starts at 5, becomes 3, becomes 1, then becomes -1 (which fails `x > 0`), ending with `x = -1`.',
        },
      ]),
    },
  });

  // Module 8 Quiz: Functions in Python (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-8',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py8-q1',
          question: 'Which keyword is used to declare and define a custom function in Python?',
          options: ['def', 'func', 'function', 'fn'],
          correctIndex: 0,
          explanation: 'The `def` keyword (short for define) is used to create functions in Python.',
        },
        {
          id: 'py8-q2',
          question: 'What is the role of the `return` statement in a Python function?',
          options: [
            'Exits the function and passes a result value back to the function caller',
            'Restarts the function execution from the beginning',
            'Prints text to the standard console output',
            'Deletes the function from memory',
          ],
          correctIndex: 0,
          explanation: '`return` ends function execution and sends the specified expression value back to the caller.',
        },
        {
          id: 'py8-q3',
          question: "In the signature `def greet(name='Friend'):`, what value will `name` hold if you invoke `greet()` without arguments?",
          options: ["'Friend'", 'None', "'' (empty string)", 'Throws a TypeError'],
          correctIndex: 0,
          explanation: 'Parameters with assigned default values take that default if omitted during the call.',
        },
        {
          id: 'py8-q4',
          question: 'What is the distinction between parameters and arguments in Python?',
          options: [
            'Parameters are variables listed in the function definition; arguments are values passed when calling the function',
            'Arguments are defined in `def`; parameters are passed during runtime',
            'Parameters must be numbers; arguments must be strings',
            'There is no difference; they are interchangeable exact synonyms',
          ],
          correctIndex: 0,
          explanation: 'Parameters appear in function headers; arguments are the concrete values provided upon invocation.',
        },
        {
          id: 'py8-q5',
          question: 'What is the scope of a variable created inside a function body?',
          options: [
            'Local scope (accessible only within that function)',
            'Global scope (accessible anywhere in the module)',
            'System scope (accessible across separate Python processes)',
            'Universal scope (saved permanently to disk)',
          ],
          correctIndex: 0,
          explanation: 'Variables initialized within a function exist strictly within its local namespace.',
        },
        {
          id: 'py8-q6',
          question: 'What value is returned by a Python function that executes without reaching an explicit `return` statement?',
          options: ['None', '0', 'False', 'undefined'],
          correctIndex: 0,
          explanation: 'Functions without a return statement implicitly return `None`.',
        },
        {
          id: 'py8-q7',
          question: 'What are keyword arguments (kwargs) in Python function calls?',
          options: [
            'Arguments passed by explicitly specifying the parameter name and value (e.g. `fn(age=25)`)',
            'Arguments that must be Python keywords',
            'Arguments that cannot be numbers',
            'Arguments that are encrypted in memory',
          ],
          correctIndex: 0,
          explanation: 'Keyword arguments pass values associated with their designated parameter names.',
        },
        {
          id: 'py8-q8',
          question: 'What syntax allows a function definition to accept any arbitrary number of positional arguments as a tuple?',
          options: ['*args', '**kwargs', '&args', '...args'],
          correctIndex: 0,
          explanation: 'The single asterisk `*args` collects extra positional arguments into an immutable tuple.',
        },
        {
          id: 'py8-q9',
          question: 'What syntax allows a function definition to accept any arbitrary number of keyword arguments as a dictionary?',
          options: ['**kwargs', '*args', '$$kwargs', 'params[]'],
          correctIndex: 0,
          explanation: 'The double asterisk `**kwargs` collects extra named arguments into a dictionary.',
        },
        {
          id: 'py8-q10',
          question: 'How does Python handle returning multiple values from a function (e.g. `return x, y`)?',
          options: [
            'Packs them into a tuple and returns the tuple to the caller',
            'Throws a MultipleReturnError',
            'Only returns the first value x',
            'Combines them into a single string',
          ],
          correctIndex: 0,
          explanation: 'Multiple comma-separated values in a return statement are packed into a tuple.',
        },
      ]),
    },
  });

  // Module 9 Quiz: Converting Data Types in Python (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-9',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py9-q1',
          question: "How do you convert the numeric string `'150'` into an integer in Python?",
          options: ["int('150')", "to_integer('150')", "Number('150')", "parse_int('150')"],
          correctIndex: 0,
          explanation: '`int()` is the standard constructor function for converting compatible strings and floats to integers.',
        },
        {
          id: 'py9-q2',
          question: 'What is the result of executing `float(10)` in Python?',
          options: ['10.0', '10', "'10.0'", '10.00'],
          correctIndex: 0,
          explanation: '`float(10)` converts the integer 10 into its floating-point representation `10.0`.',
        },
        {
          id: 'py9-q3',
          question: 'How can you quickly remove duplicate elements from a list `items = [1, 2, 2, 3, 3]` in Python?',
          options: [
            'Convert it to a set and back to a list: `list(set(items))`',
            '`items.remove_duplicates()`',
            '`items.filter(unique=True)`',
            '`set.list(items)`',
          ],
          correctIndex: 0,
          explanation: 'Sets enforce uniqueness of elements; passing a list to `set()` strips duplicates automatically.',
        },
        {
          id: 'py9-q4',
          question: "What occurs if you attempt to execute `int('banana')`?",
          options: [
            'Python raises a `ValueError`',
            'It returns 0',
            'It returns NaN',
            'It converts the letters into their ASCII character sum',
          ],
          correctIndex: 0,
          explanation: 'Strings that cannot be parsed as valid numeric literals cause `int()` to raise a `ValueError`.',
        },
        {
          id: 'py9-q5',
          question: "How do you convert an integer `score = 98` into a string to concatenate with `'Score: '`?",
          options: ["'Score: ' + str(score)", "'Score: ' + string(score)", "'Score: ' + score.to_s()", "'Score: ' + (str)score"],
          correctIndex: 0,
          explanation: '`str(score)` converts the integer into its string equivalent for safe concatenation.',
        },
        {
          id: 'py9-q6',
          question: "What is the result of `bool('')` (evaluating an empty string) in Python?",
          options: ['False', 'True', 'None', 'TypeError'],
          correctIndex: 0,
          explanation: 'Empty strings `""` evaluate to False in boolean conversions.',
        },
        {
          id: 'py9-q7',
          question: "How do you convert a list of two-element key-value tuples `[('a', 1), ('b', 2)]` into a dictionary?",
          options: ["dict([('a', 1), ('b', 2)])", "to_dict([('a', 1), ('b', 2)])", "{[('a', 1), ('b', 2)]}", "map([('a', 1), ('b', 2)])"],
          correctIndex: 0,
          explanation: 'The `dict()` constructor accepts lists of (key, value) pairs to construct dictionaries.',
        },
        {
          id: 'py9-q8',
          question: 'What is the output of `str(3.14)` in Python?',
          options: ["'3.14'", '3.14', '"3"', '<string: 3.14>'],
          correctIndex: 0,
          explanation: '`str(3.14)` returns the string literal representation `\'3.14\'`.',
        },
        {
          id: 'py9-q9',
          question: "What does `list('Data')` produce in Python?",
          options: ["['D', 'a', 't', 'a']", "['Data']", "'D, a, t, a'", 'TypeError'],
          correctIndex: 0,
          explanation: 'Converting a string to a list breaks the string into a list of individual characters.',
        },
        {
          id: 'py9-q10',
          question: 'What occurs when converting a floating-point number `int(9.99)` to an integer in Python?',
          options: [
            'Truncates the decimal digits towards zero, producing `9`',
            'Rounds up to `10`',
            'Throws a PrecisionError',
            'Leaves the value as `9.0`',
          ],
          correctIndex: 0,
          explanation: '`int()` on a float truncates toward zero without rounding.',
        },
      ]),
    },
  });

  // Module 10 Quiz: Building a BMI Calculator (10 Questions)
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-10',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py10-q1',
          question: "Why must the return value of `input('Enter your weight in kg: ')` be converted with `float()` before calculating BMI?",
          options: [
            '`input()` returns user input as a string (`str`), and mathematical operators require numeric types',
            '`input()` returns a boolean by default',
            'Unconverted inputs cause the computer screen to freeze',
            'Python requires all variables to be floats',
          ],
          correctIndex: 0,
          explanation: 'The `input()` function always returns strings; explicit conversion to `float` or `int` is necessary for mathematical calculations.',
        },
        {
          id: 'py10-q2',
          question: 'What is the standard metric formula for Body Mass Index (BMI)?',
          options: [
            'weight_in_kg / (height_in_meters ** 2)',
            'weight_in_kg * height_in_meters',
            '(weight_in_kg ** 2) / height_in_meters',
            'height_in_meters / (weight_in_kg ** 2)',
          ],
          correctIndex: 0,
          explanation: 'BMI is calculated as weight in kilograms divided by the square of height in meters: `weight / (height ** 2)`.',
        },
        {
          id: 'py10-q3',
          question: 'Which Python operator is used to raise height to the power of 2 (squaring) in the BMI calculation?',
          options: ['**', '^', '^^', 'pow='],
          correctIndex: 0,
          explanation: 'In Python, `**` is the exponentiation operator (e.g. `height ** 2`).',
        },
        {
          id: 'py10-q4',
          question: 'If a user calculates a BMI value of 22.4, which standard BMI category does this fall under?',
          options: [
            'Normal weight (18.5 – 24.9)',
            'Underweight (< 18.5)',
            'Overweight (25 – 29.9)',
            'Obese (>= 30)',
          ],
          correctIndex: 0,
          explanation: 'A BMI between 18.5 and 24.9 is categorized as Normal weight.',
        },
        {
          id: 'py10-q5',
          question: "In Alex's BMI Calculator project, what programming construct is used to categorize and output whether someone is Underweight, Normal, Overweight, or Obese?",
          options: [
            '`if...elif...else` conditional branching',
            'A `while` loop running 100 iterations',
            'A try-except block',
            'A list comprehension',
          ],
          correctIndex: 0,
          explanation: '`if-elif-else` conditional structures evaluate the calculated BMI number against categorical thresholds.',
        },
        {
          id: 'py10-q6',
          question: 'What is the imperial calculation formula for BMI when weight is in pounds (lbs) and height is in inches?',
          options: [
            '(weight_in_lbs * 703) / (height_in_inches ** 2)',
            '(weight_in_lbs / height_in_inches) * 100',
            'weight_in_lbs / (height_in_inches ** 2)',
            '(weight_in_lbs * 2.2) / height_in_inches',
          ],
          correctIndex: 0,
          explanation: 'Imperial BMI multiplies weight in pounds by 703 and divides by height in inches squared.',
        },
        {
          id: 'py10-q7',
          question: 'If a user calculated BMI evaluates to 28.1, which standard category does Alex\'s BMI code classify them as?',
          options: [
            'Overweight (25.0 – 29.9)',
            'Normal weight (18.5 – 24.9)',
            'Underweight (< 18.5)',
            'Severe Obesity (>= 40)',
          ],
          correctIndex: 0,
          explanation: 'A BMI from 25.0 up to 29.9 is classified as Overweight.',
        },
        {
          id: 'py10-q8',
          question: 'If a user calculates a BMI of 17.5, which category does the calculation logic report?',
          options: [
            'Underweight (< 18.5)',
            'Normal weight (18.5 – 24.9)',
            'Overweight (25 – 29.9)',
            'Optimal weight',
          ],
          correctIndex: 0,
          explanation: 'A BMI below 18.5 is classified as Underweight.',
        },
        {
          id: 'py10-q9',
          question: 'How do you round a calculated BMI float variable `bmi = 24.5678` to 2 decimal places in Python?',
          options: ['round(bmi, 2)', 'bmi.round(2)', 'float.round(bmi, 2)', 'Math.round(bmi, 2)'],
          correctIndex: 0,
          explanation: 'The built-in `round(number, digits)` function rounds floats to the designated decimal places.',
        },
        {
          id: 'py10-q10',
          question: 'Which modern Python syntax formats user output such as `name = "Alex"` and `bmi = 23.5` into a clear greeting string?',
          options: [
            'f"{name}, your BMI is {round(bmi, 2)}"',
            '"%name%, your BMI is %bmi%"',
            '"$name, your BMI is $bmi"',
            'template("{name}, your BMI is {bmi}")',
          ],
          correctIndex: 0,
          explanation: 'f-strings (`f"..."`) allow direct embedded expression interpolation in Python 3.6+.',
        },
      ]),
    },
  });

  // 5. Create Course: SQL for Beginners (5 Modules)
  console.log('Creating Course: SQL for Beginners (5 Modules)...');
  const sqlCourse = await prisma.course.create({
    data: {
      title: 'SQL for Beginners',
      description: 'A hands-on, beginner-friendly video course covering fundamental relational database concepts with MySQL — environment setup with MySQL Workbench, crafting basic SELECT statements, row filtering with WHERE and pattern matching, aggregate filtering with HAVING, and result pagination with LIMIT and Aliasing. Built from Alex The Analyst’s curated MySQL Beginner Series.',
      difficultyLevel: 'Beginner',
      status: 'published',
      trainerId: trainer.id,
      contentUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify(sqlCourseModules),
      competencyTags: {
        create: [
          { competencyId: compSql.id, targetLevel: 2 },
        ],
      },
    },
  });

  console.log('Creating 5 SQL Module Quizzes (10 questions each, 50 questions total)...');
  for (const a of sqlAssessments) {
    await prisma.assessment.create({
      data: {
        courseId: sqlCourse.id,
        moduleId: a.moduleId,
        passThreshold: a.passThreshold,
        questions: JSON.stringify(a.questions),
      },
    });
  }

  // 6. Seed Discussion Forum Posts
  console.log('Seeding Discussion Forum Posts...');
  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Welcome to Python for Beginners with Alex The Analyst!',
      body: 'Welcome to the complete Python for Beginners course series! This 10-module curriculum is designed to take you from initial environment setup through core programming fundamentals to a real-world BMI Calculator project. Each module features a comprehensive 10-question evaluation quiz to test your mastery.',
      authorId: trainer.id,
      courseId: pythonCourse.id,
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Excited to dive in! The 10-question quizzes per module provide fantastic practice to reinforce each video lesson.',
      authorId: learner1.id,
      courseId: pythonCourse.id,
      parentPostId: post1.id,
    },
  });

  const postSql = await prisma.forumPost.create({
    data: {
      title: 'Welcome to SQL for Beginners (MySQL Fundamentals)!',
      body: 'Welcome to the SQL for Beginners series! This 5-module curriculum covers installing MySQL Server and Workbench, mastering SELECT queries, row filtering with WHERE, aggregate filtering with HAVING, and pagination with LIMIT and Aliasing. Each module includes a dedicated 10-question evaluation quiz to test your mastery.',
      authorId: trainer.id,
      courseId: sqlCourse.id,
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Looking forward to learning MySQL database design and querying alongside the Python course!',
      authorId: learner1.id,
      courseId: sqlCourse.id,
      parentPostId: postSql.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('Courses created:');
  console.log('  1. "Python for Beginners": 10 modules & 10 quizzes (100 questions total)');
  console.log('  2. "SQL for Beginners": 5 modules & 5 quizzes (50 questions total)');
  console.log('Default credentials for testing:');
  console.log('  Admin:   admin@vantage.gov.in   / Password@123');
  console.log('  Trainer: trainer@vantage.gov.in / Password@123');
  console.log('  Learner: learner1@vantage.gov.in / Password@123');
  console.log('  Learner: learner@vantage.gov.in  / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
