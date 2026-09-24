import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vantage (General-Purpose Course Learning Platform)...');

  // Clear existing records to ensure idempotent fresh seed
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

  // 1. Create Core Competencies
  console.log('Creating Competencies...');
  const compPython = await prisma.competency.create({
    data: {
      name: 'Python Programming',
      category: 'Software Development',
      description: 'Foundational programming in Python: syntax, data structures, functional patterns, file I/O, and object-oriented programming.',
    },
  });

  // 2. Create Platform Users (Admin, Trainer, Learners)
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
      username: 'admin.user',
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
      name: 'Sarah Jenkins',
      email: 'trainer@vantage.gov.in',
      passwordHash,
      role: 'trainer',
      department: 'Computer Science',
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
      username: 'sarah.jenkins',
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

  // Secondary trainer alias for demo compatibility
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
      username: 'ananya.sen',
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
      username: 'alex.morgan',
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
      username: 'priya.sharma',
      country: 'India',
      city: '',
      profession: 'OTHER',
      profileCompleted: false,
    },
  });

  await prisma.competencyProfile.create({
    data: {
      userId: learner1.id,
      skills: JSON.stringify([
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 3 },
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

  // 3. Create Course: Introduction to Python
  console.log('Creating Course: Introduction to Python...');
  const pythonCourse = await prisma.course.create({
    data: {
      title: 'Introduction to Python',
      description: 'A beginner-friendly course covering Python fundamentals — syntax, data types, control flow, functions, and basic data structures. Aimed at learners with no prior programming background, providing the coding foundation needed for modern software and data analysis.',
      difficultyLevel: 'Beginner',
      status: 'published',
      trainerId: trainer.id,
      contentUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod-py-1',
          title: 'Python Setup & Basics',
          durationMinutes: 60,
          order: 1,
          videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
          contentMarkdown: '# Module 1: Python Setup & Basics\n\nWelcome to **Introduction to Python**! In this module, you will learn how to install Python 3, configure your development environment, and write your first Python statements.\n\n### Key Topics:\n- Installing Python 3 & VS Code\n- Python Interactive Shell (REPL)\n- Comments, indentation, and code formatting\n- Built-in `print()` and `input()` functions\n- Writing and executing your first `.py` script',
        },
        {
          id: 'mod-py-2',
          title: 'Variables & Data Types',
          durationMinutes: 12,
          order: 2,
          videoUrl: 'https://www.youtube.com/watch?v=khKv-8q7YmY',
          contentMarkdown: '# Module 2: Variables & Data Types\n\nUnderstand how Python stores information in memory. Learn the dynamic typing system, scalar data types, type casting, and string formatting techniques.\n\n### Key Topics:\n- Integers, Floats, Booleans, and Strings\n- Dynamic typing and variable naming conventions\n- Arithmetic, logical, and comparison operators\n- Type conversion functions: `int()`, `float()`, `str()`\n- String concatenation and f-strings (`f"Score: {score}"`)',
        },
        {
          id: 'mod-py-3',
          title: 'Control Flow (Conditionals & Loops)',
          durationMinutes: 10,
          order: 3,
          videoUrl: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ',
          contentMarkdown: '# Module 3: Control Flow (Conditionals & Loops)\n\nLearn how to direct the flow of execution in your programs using decision structures and iteration. Automate repetitive tasks using loops.\n\n### Key Topics:\n- `if`, `elif`, and `else` conditional branching\n- Iteration with `for` loops and `range()`\n- `while` loops and sentinel conditions\n- Loop control: `break`, `continue`, and `pass`\n- Nested control structures and list iterations',
        },
        {
          id: 'mod-py-4',
          title: 'Functions & Scope',
          durationMinutes: 22,
          order: 4,
          videoUrl: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
          contentMarkdown: '# Module 4: Functions & Scope\n\nMaster the creation of modular, reusable code blocks. Functions enable clean separation of concerns and maintainable code architecture.\n\n### Key Topics:\n- Defining functions using `def` and returning values with `return`\n- Positional, keyword, and default parameters\n- Variable length arguments (`*args` and `**kwargs`)\n- Variable scope: Local, Enclosing, Global, and Built-in (LEGB rule)\n- Docstrings and type hinting basics',
        },
        {
          id: 'mod-py-5',
          title: 'Data Structures (Lists, Tuples, Dictionaries, Sets)',
          durationMinutes: 29,
          order: 5,
          videoUrl: 'https://www.youtube.com/watch?v=W8KRzm-HUcc',
          contentMarkdown: '# Module 5: Data Structures\n\nOrganize, store, and manipulate collections of data using Python versatile built-in container types. Learn the differences between mutable and immutable collections.\n\n### Key Topics:\n- Lists: indexing, slicing, methods (`append`, `pop`, `sort`), and list comprehensions\n- Tuples: immutability, tuple packing and unpacking\n- Dictionaries: key-value mapping, dict methods (`.keys()`, `.values()`, `.items()`, `.get()`)\n- Sets: unique membership, mathematical set operations (union, intersection, difference)\n- Time complexity trade-offs for collections',
        },
        {
          id: 'mod-py-6',
          title: 'File Handling & Intro to Object-Oriented Programming',
          durationMinutes: 53,
          order: 6,
          videoUrl: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
          contentMarkdown: '# Module 6: File Handling & Intro to OOP\n\nConclude the foundational course by reading from and writing to disk files (CSV, TXT), managing resources safely with context managers, and getting a hands-on introduction to classes and object-oriented design.\n\n### Key Topics:\n- Safe file handling using `with open(..., mode) as f:`\n- Reading line-by-line, `.read()`, and `.readlines()`\n- Exception handling fundamentals: `try`, `except`, `finally`\n- Defining classes, attributes, and `__init__` constructors\n- Creating objects and invoking instance methods',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compPython.id, targetLevel: 3 },
        ],
      },
    },
  });

  // 4. Per-Module Assessments (6 Quizzes, 5 questions each)
  console.log('Creating Quizzes for Python Course Modules...');

  // Module 1 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-1',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py1-q1',
          question: 'Which terminal command displays the currently installed version of Python 3?',
          options: ['python --version', 'python -getversion', 'py.status()', 'pip check version'],
          correctIndex: 0,
          explanation: 'Running `python --version` (or `python3 --version`) in your terminal prints the installed Python version.',
        },
        {
          id: 'py1-q2',
          question: 'How do you create a single-line comment in a Python script?',
          options: ['// This is a comment', '# This is a comment', '/* This is a comment */', '-- This is a comment'],
          correctIndex: 1,
          explanation: 'In Python, single-line comments begin with the hash character `#`.',
        },
        {
          id: 'py1-q3',
          question: 'Which of the following is an INVALID variable name in Python?',
          options: ['_temperature', 'reading_2026', '2nd_sensor', 'surfacePressure'],
          correctIndex: 2,
          explanation: 'Python variable names cannot begin with a numeric digit (`2nd_sensor` is invalid).',
        },
        {
          id: 'py1-q4',
          question: 'What is the return type of Python built-in input() function by default?',
          options: ['int', 'float', 'str', 'None'],
          correctIndex: 2,
          explanation: 'The `input()` function always reads standard input as a string (`str`).',
        },
        {
          id: 'py1-q5',
          question: 'How does Python denote code blocks instead of curly braces {}?',
          options: ['Parentheses ()', 'Square brackets []', 'Consistent whitespace indentation', 'Semicolons at line ends'],
          correctIndex: 2,
          explanation: 'Python uses consistent whitespace indentation (typically 4 spaces) to define execution blocks.',
        },
      ]),
    },
  });

  // Module 2 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-2',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py2-q1',
          question: 'What will type(42.0) return in Python?',
          options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"],
          correctIndex: 1,
          explanation: 'Floating point numbers with decimal points are instances of `<class \'float\'>`.',
        },
        {
          id: 'py2-q2',
          question: 'What is the output of 17 // 3 in Python?',
          options: ['5.666666666666667', '5', '2', '6'],
          correctIndex: 1,
          explanation: 'The `//` operator performs floor division, truncating to the nearest lower integer (5).',
        },
        {
          id: 'py2-q3',
          question: 'Which expression correctly formats the variable val = 9.80665 to 2 decimal places using an f-string?',
          options: ['f"{val:.2f}"', 'f"{val%2}"', 'f"{round.val(2)}"', 'f"{val->2decimal}"'],
          correctIndex: 0,
          explanation: 'The format specifier `:.2f` inside an f-string rounds and formats floats to 2 decimal places.',
        },
        {
          id: 'py2-q4',
          question: 'What is the result of bool("") (evaluating an empty string)?',
          options: ['True', 'False', 'None', 'TypeError'],
          correctIndex: 1,
          explanation: 'Empty sequences such as empty strings `""` evaluate to `False` in Python boolean context.',
        },
        {
          id: 'py2-q5',
          question: 'If s = "Python", what is s[-1]?',
          options: ["'P'", "'n'", "'o'", 'IndexError'],
          correctIndex: 1,
          explanation: 'Negative indexing in Python indexes from the end; `-1` refers to the last character (`"n"`).',
        },
      ]),
    },
  });

  // Module 3 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-3',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py3-q1',
          question: 'What does the break statement do when encountered inside a loop?',
          options: [
            'Skips the current iteration and jumps to the next iteration',
            'Terminates the loop immediately and transfers control to the statement following the loop',
            'Restarts the loop from the beginning',
            'Causes a program crash with BreakException',
          ],
          correctIndex: 1,
          explanation: '`break` immediately exits the enclosing loop construct.',
        },
        {
          id: 'py3-q2',
          question: 'What values will list(range(2, 10, 3)) produce?',
          options: ['[2, 5, 8]', '[2, 3, 4, 5, 6, 7, 8, 9, 10]', '[3, 6, 9]', '[2, 4, 6, 8]'],
          correctIndex: 0,
          explanation: '`range(start, stop, step)` starts at 2, steps by 3, and stops before 10: `[2, 5, 8]`.',
        },
        {
          id: 'py3-q3',
          question: 'What is the purpose of the continue statement in a loop?',
          options: [
            'Exits the loop permanently',
            'Skips the remaining statements in the current iteration and proceeds to the next iteration',
            'Pauses loop execution for 1 second',
            'Repeats the current statement indefinitely',
          ],
          correctIndex: 1,
          explanation: '`continue` skips the rest of the current loop iteration and advances to the next cycle.',
        },
        {
          id: 'py3-q4',
          question: 'When is the else clause of a for or while loop executed?',
          options: [
            'Only if the loop was terminated by a break statement',
            'Only when the loop condition becomes false and terminates normally without hitting a break',
            'Before the loop starts',
            'Every time an iteration finishes',
          ],
          correctIndex: 1,
          explanation: 'A loop `else` block runs only when the loop completes naturally without being interrupted by a `break`.',
        },
        {
          id: 'py3-q5',
          question: 'What is the output of: x = 10; print("High" if x > 15 else "Normal")?',
          options: ['High', 'Normal', 'True', '10'],
          correctIndex: 1,
          explanation: 'The ternary conditional expression evaluates to "Normal" because `10 > 15` is `False`.',
        },
      ]),
    },
  });

  // Module 4 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-4',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py4-q1',
          question: 'What does a Python function return if it contains no return statement?',
          options: ['0', 'False', "'' (empty string)", 'None'],
          correctIndex: 3,
          explanation: 'Functions that execute without encountering an explicit `return` return `None` by default.',
        },
        {
          id: 'py4-q2',
          question: 'In a function signature `def compute(x, y=10):`, what is `y` called?',
          options: ['A required positional argument', 'A default (or optional) parameter', 'A variadic pointer', 'A global constant'],
          correctIndex: 1,
          explanation: 'Parameters with assigned values in the function definition are default parameters.',
        },
        {
          id: 'py4-q3',
          question: 'What is the purpose of *args in a Python function definition?',
          options: [
            'Allows the function to accept any number of positional arguments as a tuple',
            'Multiplies all incoming numerical arguments',
            'Enforces strict type safety for pointers',
            'Passes keyword arguments as a dictionary',
          ],
          correctIndex: 0,
          explanation: '`*args` gathers extra positional arguments into an immutable tuple.',
        },
        {
          id: 'py4-q4',
          question: 'According to Python LEGB scope resolution, in what order does Python look up variable names?',
          options: [
            'Local -> Enclosing -> Global -> Built-in',
            'Global -> Local -> Enclosing -> Built-in',
            'Built-in -> Global -> Enclosing -> Local',
            'Local -> Global -> Enclosing -> Built-in',
          ],
          correctIndex: 0,
          explanation: 'Python resolves names according to LEGB: Local first, then Enclosing, Global, and finally Built-in.',
        },
        {
          id: 'py4-q5',
          question: 'What keyword allows you to modify a module-level variable from inside a local function?',
          options: ['extern', 'global', 'nonlocal', 'static'],
          correctIndex: 1,
          explanation: 'The `global` keyword declares that a variable refers to the module-level namespace.',
        },
      ]),
    },
  });

  // Module 5 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-5',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py5-q1',
          question: 'What will the list comprehension [x**2 for x in range(5) if x % 2 != 0] produce?',
          options: ['[0, 1, 4, 9, 16]', '[1, 9]', '[1, 4, 9]', '[0, 4, 16]'],
          correctIndex: 1,
          explanation: 'Odd numbers in range 0..4 are 1 and 3. Their squares are 1 and 9: `[1, 9]`.',
        },
        {
          id: 'py5-q2',
          question: 'Which of the following statements about Python tuples is TRUE?',
          options: [
            'Tuples can be modified in-place using .append()',
            'Tuples are immutable sequences whose elements cannot be reassigned after creation',
            'Tuples cannot contain elements of different data types',
            'Tuples are defined exclusively using square brackets []',
          ],
          correctIndex: 1,
          explanation: 'Tuples are immutable; once created, items cannot be added, removed, or reassigned.',
        },
        {
          id: 'py5-q3',
          question: 'How can you retrieve the value of key "status" from dict data without throwing a KeyError if it is missing?',
          options: [
            'data["status"]',
            'data.fetch("status")',
            'data.get("status", None)',
            'data.find("status")',
          ],
          correctIndex: 2,
          explanation: 'The `.get(key, default)` method returns the value if the key exists, or the default value (or `None`) if missing.',
        },
        {
          id: 'py5-q4',
          question: 'Which built-in Python collection stores only unique, unordered elements?',
          options: ['list', 'tuple', 'set', 'dict_values'],
          correctIndex: 2,
          explanation: 'A `set` automatically deduplicates items and provides O(1) average lookup time for membership testing.',
        },
        {
          id: 'py5-q5',
          question: 'Given the list nums = [10, 20, 30, 40, 50], what is the result of nums[1:4]?',
          options: ['[10, 20, 30]', '[20, 30, 40]', '[20, 30, 40, 50]', '[30, 40]'],
          correctIndex: 1,
          explanation: 'Slicing `nums[1:4]` starts at index 1 (20) and stops before index 4 (50), producing `[20, 30, 40]`.',
        },
      ]),
    },
  });

  // Module 6 Quiz
  await prisma.assessment.create({
    data: {
      courseId: pythonCourse.id,
      moduleId: 'mod-py-6',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py6-q1',
          question: 'Why is using "with open(filepath, \'r\') as f:" the recommended way to open files in Python?',
          options: [
            'It accelerates disk read speeds by 50%',
            'It acts as a context manager that guarantees the file is closed automatically, even if exceptions occur',
            'It prevents the file from ever being modified',
            'It automatically parses CSV files into lists',
          ],
          correctIndex: 1,
          explanation: 'The `with` statement utilizes context management to ensure `f.close()` is executed reliably upon exiting the block.',
        },
        {
          id: 'py6-q2',
          question: 'Which file open mode appends new data to the end of a file without overwriting existing content?',
          options: ["'r'", "'w'", "'a'", "'x'"],
          correctIndex: 2,
          explanation: "Mode `'a'` (append) writes data to the end of the file, preserving any prior file contents.",
        },
        {
          id: 'py6-q3',
          question: 'In a Python class, what does the first parameter self represent in an instance method?',
          options: [
            'The class blueprint itself',
            'The specific instance of the class on which the method is called',
            'A global pointer to the Python runtime',
            'A keyword for static memory allocation',
          ],
          correctIndex: 1,
          explanation: '`self` represents the instance of the class, allowing access to instance attributes and methods.',
        },
        {
          id: 'py6-q4',
          question: 'What is the name of the constructor method in a Python class that initializes new object instances?',
          options: ['__construct__', '__new__', '__init__', '__start__'],
          correctIndex: 2,
          explanation: '`__init__` is the initialization method invoked automatically when a new instance of a class is created.',
        },
        {
          id: 'py6-q5',
          question: 'In a try...except...finally block, when does the finally block execute?',
          options: [
            'Only if an exception is successfully caught by an except block',
            'Only if NO exceptions occurred in the try block',
            'Always, regardless of whether an exception was raised or handled',
            'Never, unless explicitly invoked with finally()',
          ],
          correctIndex: 2,
          explanation: 'The `finally` clause always executes before exiting the `try` construct, making it ideal for cleanup actions.',
        },
      ]),
    },
  });

  // 5. Create Second Course: Web Architecture & API Design for demo multi-course testing
  const webCourse = await prisma.course.create({
    data: {
      title: 'Web Architecture & REST API Design',
      description: 'Master full-stack HTTP fundamentals, REST API design, middleware patterns, microservices, and database integration.',
      difficultyLevel: 'Intermediate',
      status: 'published',
      trainerId: trainer.id,
      contentUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        { id: 'mod-web-1', title: 'HTTP Protocol & REST Principles', durationMinutes: 25, order: 1 },
        { id: 'mod-web-2', title: 'Express.js Routing & Middleware', durationMinutes: 35, order: 2 },
      ]),
    },
  });

  // Learner 3: Reminders Turned OFF
  const learner3 = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'learner3@vantage.gov.in',
      passwordHash,
      role: 'learner',
      department: 'General',
      jobRole: 'Student',
      gender: 'male',
      avatar: JSON.stringify({ type: 'preset', presetId: 'm2', bgColor: '#1E293B' }),
      phone: '+919999900004',
      phoneVerified: true,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: learner3.id,
      fullName: learner3.name,
      username: 'rahul.verma',
      country: 'India',
      city: 'Delhi',
      profession: 'STUDENT',
      profileCompleted: true,
    },
  });

  // 6. Notification Preferences for Demo Users
  console.log('Seeding Notification Preferences...');

  // Alex Morgan (learner1): Reminders ON (09:00), 1 in-progress (40%), 1 not-started
  await prisma.notificationPreference.create({
    data: {
      userId: learner1.id,
      inAppEnabled: true,
      smsEnabled: true,
      dailyReminderEnabled: true,
      reminderTime: '09:00',
      timezone: 'Asia/Kolkata',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });

  // Priya Sharma (learner2): Reminders ON, but all courses COMPLETED
  await prisma.notificationPreference.create({
    data: {
      userId: learner2.id,
      inAppEnabled: true,
      smsEnabled: false,
      dailyReminderEnabled: true,
      reminderTime: '09:00',
      timezone: 'Asia/Kolkata',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });

  // Rahul Verma (learner3): Reminders OFF
  await prisma.notificationPreference.create({
    data: {
      userId: learner3.id,
      inAppEnabled: true,
      smsEnabled: false,
      dailyReminderEnabled: false,
      reminderTime: '09:00',
      timezone: 'Asia/Kolkata',
    },
  });

  // Admin & Trainer default prefs
  await prisma.notificationPreference.create({
    data: { userId: admin.id, dailyReminderEnabled: false },
  });
  await prisma.notificationPreference.create({
    data: { userId: trainer.id, dailyReminderEnabled: false },
  });

  // 7. Demo Enrollments
  console.log('Seeding Demo Enrollments and Certificate...');
  
  // Alex Morgan (learner1):
  // Course 1: In-Progress (40%)
  await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: pythonCourse.id,
      status: 'in_progress',
      progressPercent: 40,
      completedModules: JSON.stringify(['mod-py-1', 'mod-py-2']),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // Course 2: Not Started (0%)
  await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: webCourse.id,
      status: 'not_started',
      progressPercent: 0,
      completedModules: JSON.stringify([]),
    },
  });

  // Priya Sharma (learner2): All courses COMPLETED (must get NO reminder)
  await prisma.enrollment.create({
    data: {
      userId: learner2.id,
      courseId: pythonCourse.id,
      status: 'completed',
      progressPercent: 100,
      completedModules: JSON.stringify(['mod-py-1', 'mod-py-2', 'mod-py-3', 'mod-py-4', 'mod-py-5', 'mod-py-6']),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Rahul Verma (learner3): In progress course, but reminders disabled
  await prisma.enrollment.create({
    data: {
      userId: learner3.id,
      courseId: pythonCourse.id,
      status: 'in_progress',
      progressPercent: 50,
      completedModules: JSON.stringify(['mod-py-1', 'mod-py-2', 'mod-py-3']),
    },
  });

  const certNumber = 'VT-2026-PY-100842';
  await prisma.certificate.create({
    data: {
      userId: learner2.id,
      courseId: pythonCourse.id,
      certificateNumber: certNumber,
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      verificationHash: crypto.createHash('sha256').update(`${learner2.id}:${pythonCourse.id}:${certNumber}`).digest('hex'),
      certificateUrl: `/certificates/${certNumber}.pdf`,
    },
  });

  // 8. Seed Discussion Forum Posts
  console.log('Seeding Discussion Forum Threads...');
  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Tips for mastering Python list comprehensions and generator expressions',
      body: 'Hi everyone! When processing large datasets, when do you prefer list comprehensions over generator expressions? I find generator expressions save huge memory for streaming lines.',
      authorId: learner1.id,
      courseId: pythonCourse.id,
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Great point Alex! A good rule of thumb: use a list comprehension if you need to index into the result or iterate multiple times. If you only consume items once in a loop or pipeline, a generator expression is vastly more memory-efficient.',
      authorId: trainer.id,
      courseId: pythonCourse.id,
      parentPostId: post1.id,
    },
  });

  const generalPost = await prisma.forumPost.create({
    data: {
      title: 'Welcome to the Vantage Learning Community!',
      body: 'Welcome everyone to the Vantage platform. Share your questions, tips, study schedules, and project ideas here. Feel free to start a new thread anytime you encounter an interesting coding problem.',
      authorId: trainer.id,
      courseId: null,
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Excited to start the Python course! The modular video lectures and interactive quizzes make it very easy to track progress.',
      authorId: learner2.id,
      courseId: null,
      parentPostId: generalPost.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('Default credentials for testing:');
  console.log('  Admin:     admin@vantage.gov.in / Password@123');
  console.log('  Trainer:   trainer@vantage.gov.in / Password@123');
  console.log('  Learner 1: learner1@vantage.gov.in / Password@123 (Reminders ON, 40% active course)');
  console.log('  Learner 2: learner@vantage.gov.in / Password@123 (All courses COMPLETED)');
  console.log('  Learner 3: learner3@vantage.gov.in / Password@123 (Reminders OFF)');
  console.log('  Admin:   admin@vantage.gov.in / Password@123');
  console.log('  Trainer: trainer@vantage.gov.in / Password@123');
  console.log('  Learner: learner1@vantage.gov.in / Password@123');
  console.log('  Learner: learner@vantage.gov.in / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
