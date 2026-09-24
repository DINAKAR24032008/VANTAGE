export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const sqlCourseModules = [
  {
    id: 'mod-sql-1',
    title: 'Installing MySQL and Creating Databases | MySQL for Beginners',
    durationMinutes: 12,
    order: 1,
    videoUrl: 'https://www.youtube.com/watch?v=wgRwITQHszU',
    contentMarkdown: `# Module 1: Installing MySQL and Creating Databases

Welcome to **SQL for Beginners**! In this first module, Alex The Analyst walks you through installing MySQL Community Server and MySQL Workbench on Windows, configuring your administrative account, and creating your very first database schema.

### Key Learning Objectives:
- Downloading and navigating the MySQL Community Installer
- Selecting and installing MySQL Community Server and MySQL Workbench (GUI)
- Setting up the administrative \`root\` password and configuring the default port (3306)
- Connecting to your local MySQL instance via MySQL Workbench
- Executing SQL commands: \`CREATE DATABASE\`, \`USE\`, and navigating the Schemas panel
- Loading and running pre-built SQL scripts to seed tables and sample records

---
*Note: Video sourced from Alex The Analyst (Standard YouTube License).*`,
  },
  {
    id: 'mod-sql-2',
    title: 'Select Statement in MySQL | Beginner MySQL Series',
    durationMinutes: 11,
    order: 2,
    videoUrl: 'https://www.youtube.com/watch?v=HYD8KjPB9F8',
    contentMarkdown: `# Module 2: The SELECT Statement in MySQL

The \`SELECT\` statement is the fundamental building block of SQL querying. In this lesson, learn how to retrieve data from tables, perform mathematical calculations, and eliminate duplicate records.

### Key Learning Objectives:
- Retrieving all columns using the wildcard asterisk (\`SELECT *\`)
- Selecting specific columns to reduce memory overhead and improve query performance
- Performing column arithmetic with mathematical operators (\`+\`, \`-\`, \`*\`, \`/\`)
- Understanding operator precedence (PEMDAS) inside SQL expressions
- Using the \`DISTINCT\` keyword to return only unique values or combinations of values
- Writing single-line (\`--\`, \`#\`) and multi-line (\`/* */\`) comments in MySQL

---
*Note: Video sourced from Alex The Analyst (Standard YouTube License).*`,
  },
  {
    id: 'mod-sql-3',
    title: 'Where Clause in MySQL | Beginner MySQL Series',
    durationMinutes: 12,
    order: 3,
    videoUrl: 'https://www.youtube.com/watch?v=MARn_mssG4A',
    contentMarkdown: `# Module 3: Filtering Data with the WHERE Clause

Learn how to narrow down your queries to return only the rows that satisfy specific criteria using the \`WHERE\` clause, comparison operators, logical operators, and pattern matching.

### Key Learning Objectives:
- Filtering rows using comparison operators: \`=\`, \`!=\` (or \`<>\`), \`<\`, \`>\`, \`<=\`, \`>=\`
- Querying date fields formatted as \`'YYYY-MM-DD'\`
- Combining conditions using logical operators: \`AND\`, \`OR\`, and \`NOT\`
- Mastering operator precedence between \`AND\` and \`OR\`, and using parentheses for explicit logic
- Pattern matching with the \`LIKE\` operator using \`%\` (zero or more characters) and \`_\` (exact single character)
- Utilizing list matching with the \`IN\` operator

---
*Note: Video sourced from Alex The Analyst (Standard YouTube License).*`,
  },
  {
    id: 'mod-sql-4',
    title: 'Having vs Where in MySQL | Beginner MySQL Series',
    durationMinutes: 4,
    order: 4,
    videoUrl: 'https://www.youtube.com/watch?v=dCNjUOc1cBY',
    contentMarkdown: `# Module 4: HAVING vs WHERE in MySQL

One of the most common points of confusion in SQL is knowing when to use \`WHERE\` versus \`HAVING\`. This concise lesson breaks down the exact difference and execution order in MySQL.

### Key Learning Objectives:
- Understanding the difference: \`WHERE\` filters individual rows before grouping, while \`HAVING\` filters aggregated groups after \`GROUP BY\`
- Why aggregate functions like \`AVG()\`, \`COUNT()\`, and \`SUM()\` cannot be used in a \`WHERE\` clause
- Structuring queries that combine both \`WHERE\` (row filter) and \`HAVING\` (aggregate filter)
- The SQL logical query execution order: \`FROM\` -> \`WHERE\` -> \`GROUP BY\` -> \`HAVING\` -> \`SELECT\` -> \`ORDER BY\`
- Applying aggregate thresholds to grouped departments, occupations, and demographic segments

---
*Note: Video sourced from Alex The Analyst (Standard YouTube License).*`,
  },
  {
    id: 'mod-sql-5',
    title: 'Limit + Aliasing in MySQL | MySQL Beginner Series',
    durationMinutes: 4,
    order: 5,
    videoUrl: 'https://www.youtube.com/watch?v=ZnAydTqCtFU',
    contentMarkdown: `# Module 5: LIMIT and Aliasing in MySQL

Wrap up foundational MySQL querying by learning how to paginate output using the \`LIMIT\` clause and improve query readability using column and table aliasing.

### Key Learning Objectives:
- Restricting the number of rows returned by a query using \`LIMIT <count>\`
- Combining \`LIMIT\` with \`ORDER BY\` to predictably retrieve top or bottom performers
- Paginating results with two-parameter syntax (\`LIMIT offset, count\`) or standard \`LIMIT count OFFSET offset\`
- Aliasing column names with the \`AS\` keyword for readable output headers
- Understanding when \`AS\` is optional and how to handle spaces or special characters using quotes/backticks
- Referencing column aliases in \`ORDER BY\` clauses and why they cannot be used in \`WHERE\` clauses

---
*Note: Video sourced from Alex The Analyst (Standard YouTube License).*`,
  },
];

export const sqlAssessments: Array<{
  moduleId: string;
  title: string;
  passThreshold: number;
  questions: AssessmentQuestion[];
}> = [
  // Module 1 Quiz (10 Questions)
  {
    moduleId: 'mod-sql-1',
    title: 'Module 1 Assessment: Installing MySQL and Creating Databases',
    passThreshold: 70,
    questions: [
      {
        id: 'sql1-q1',
        question: 'Which two primary software components does Alex download and install during the MySQL setup in the video?',
        options: [
          'MySQL Community Server and MySQL Workbench',
          'PostgreSQL Server and pgAdmin',
          'MySQL Server and SQLite Studio',
          'Apache Web Server and MySQL Shell',
        ],
        correctIndex: 0,
        explanation: 'Alex installs MySQL Community Server (the database engine) and MySQL Workbench (the visual management tool).',
      },
      {
        id: 'sql1-q2',
        question: 'In the MySQL Community Installer, which setup type allows you to specifically select MySQL Server and MySQL Workbench?',
        options: [
          'Server Only',
          'Custom',
          'Client Only',
          'Developer Default with full cluster tools',
        ],
        correctIndex: 1,
        explanation: 'Selecting the "Custom" installation option allows choosing exactly the components needed (MySQL Server and MySQL Workbench).',
      },
      {
        id: 'sql1-q3',
        question: 'What is the primary role of MySQL Workbench in relation to MySQL Server?',
        options: [
          'It is the underlying database daemon that stores physical files on disk',
          'It is a graphical user interface (GUI) used to write queries, inspect schemas, and manage database objects',
          'It compiles SQL statements into bytecode for the operating system',
          'It acts as an SSL security proxy for web applications',
        ],
        correctIndex: 1,
        explanation: 'MySQL Workbench is the official desktop GUI client for designing, querying, and administering MySQL databases.',
      },
      {
        id: 'sql1-q4',
        question: 'When configuring MySQL Server during initial installation, what essential administrative credential must be created?',
        options: [
          'The root user password',
          'An OAuth 2.0 client secret',
          'A GitHub personal access token',
          'A 2048-bit RSA private key',
        ],
        correctIndex: 0,
        explanation: 'Setting a secure password for the default "root" superuser account is mandatory during MySQL server configuration.',
      },
      {
        id: 'sql1-q5',
        question: 'What is the default TCP/IP port used by MySQL Server for client connections?',
        options: ['5432', '8080', '3306', '1433'],
        correctIndex: 2,
        explanation: 'Port 3306 is the standard default networking port for MySQL database communication.',
      },
      {
        id: 'sql1-q6',
        question: 'In MySQL Workbench, which SQL command creates a new database schema named "parks_and_recreation"?',
        options: [
          'NEW SCHEMA parks_and_recreation;',
          'CREATE DATABASE parks_and_recreation;',
          'MAKE TABLE parks_and_recreation;',
          'INIT DATABASE parks_and_recreation;',
        ],
        correctIndex: 1,
        explanation: '`CREATE DATABASE <name>;` (or `CREATE SCHEMA <name>;`) creates a new database in MySQL.',
      },
      {
        id: 'sql1-q7',
        question: 'In MySQL Workbench, what keyboard shortcut executes the SQL query line where the cursor is currently placed?',
        options: [
          'Ctrl + Enter (or Cmd + Enter on macOS)',
          'Ctrl + S',
          'Alt + F4',
          'Shift + Space',
        ],
        correctIndex: 0,
        explanation: 'Pressing Ctrl + Enter (or clicking the lightning bolt icon) executes the statement at the cursor position.',
      },
      {
        id: 'sql1-q8',
        question: 'Which SQL statement tells MySQL to direct all subsequent queries to a specific database context?',
        options: [
          'USE database_name;',
          'SELECT database_name;',
          'CONNECT database_name;',
          'OPEN database_name;',
        ],
        correctIndex: 0,
        explanation: '`USE database_name;` designates the default active database for subsequent SQL operations.',
      },
      {
        id: 'sql1-q9',
        question: 'Where can you browse existing databases, tables, columns, and stored procedures in the MySQL Workbench interface?',
        options: [
          'Administration tab',
          'Schemas panel in the left sidebar',
          'Query Snippets panel',
          'Output console window at the bottom',
        ],
        correctIndex: 1,
        explanation: 'The Schemas tab in the left sidebar displays the tree of databases, tables, and views.',
      },
      {
        id: 'sql1-q10',
        question: 'Which SQL command permanently removes an entire database and all tables contained within it?',
        options: [
          'REMOVE DATABASE database_name;',
          'DROP DATABASE database_name;',
          'DELETE DATABASE database_name;',
          'TRUNCATE SCHEMA database_name;',
        ],
        correctIndex: 1,
        explanation: '`DROP DATABASE database_name;` permanently deletes the database and all its structures and records.',
      },
    ],
  },

  // Module 2 Quiz (10 Questions)
  {
    moduleId: 'mod-sql-2',
    title: 'Module 2 Assessment: The SELECT Statement in MySQL',
    passThreshold: 70,
    questions: [
      {
        id: 'sql2-q1',
        question: 'What does the asterisk symbol (*) represent in the query "SELECT * FROM employee_demographics;"?',
        options: [
          'Only numerical columns',
          'All columns from the specified table',
          'Only indexed primary key columns',
          'All rows matching NULL values',
        ],
        correctIndex: 1,
        explanation: 'The asterisk (*) wildcard instructs the database engine to retrieve all columns available in the table.',
      },
      {
        id: 'sql2-q2',
        question: 'Why is specifying explicit column names generally preferred over "SELECT *" in production systems?',
        options: [
          'SQL engines throw deprecation warnings if * is used',
          'It reduces unnecessary data transfer over the network and improves query efficiency',
          'SELECT * automatically purges duplicate rows from disk',
          'Tables with more than 5 columns cannot be queried with *',
        ],
        correctIndex: 1,
        explanation: 'Listing explicit columns minimizes bandwidth, memory consumption, and potential issues when schemas change.',
      },
      {
        id: 'sql2-q3',
        question: 'In SQL arithmetic expressions (e.g. "SELECT age, age + 10 FROM employee_demographics;"), what order of operations does MySQL observe?',
        options: [
          'Strict left-to-right evaluation without hierarchy',
          'Standard PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction)',
          'Addition and Subtraction before Multiplication and Division',
          'Reverse Polish evaluation order',
        ],
        correctIndex: 1,
        explanation: 'MySQL follows standard mathematical precedence: Parentheses first, followed by Multiplication/Division, then Addition/Subtraction.',
      },
      {
        id: 'sql2-q4',
        question: 'What does the expression "(age + 10) * 10" evaluate to if an employee\'s age is 30?',
        options: ['130', '400', '310', '300'],
        correctIndex: 1,
        explanation: 'Parentheses calculate first: (30 + 10) = 40. Then 40 * 10 = 400.',
      },
      {
        id: 'sql2-q5',
        question: 'What is the purpose of the DISTINCT keyword in "SELECT DISTINCT gender FROM employee_demographics;"?',
        options: [
          'It sorts the gender column in alphabetical order',
          'It filters out duplicate values, returning only unique occurrences',
          'It replaces empty strings with default values',
          'It calculates the total count of gender records',
        ],
        correctIndex: 1,
        explanation: '`DISTINCT` eliminates duplicate values from the query result set, returning only unique values.',
      },
      {
        id: 'sql2-q6',
        question: 'If you run "SELECT DISTINCT first_name, gender FROM employee_demographics;", how does DISTINCT evaluate uniqueness?',
        options: [
          'Only based on unique first_name values',
          'Only based on unique gender values',
          'Across the combined tuple of both first_name and gender together',
          'It randomly returns one row for each gender',
        ],
        correctIndex: 2,
        explanation: 'When multiple columns follow `DISTINCT`, a row is included if the combination of all specified columns is distinct.',
      },
      {
        id: 'sql2-q7',
        question: 'Which of the following is a valid single-line comment in MySQL?',
        options: [
          '// Comment text',
          '-- Comment text (with a space after the dashes)',
          '<!-- Comment text -->',
          '% Comment text',
        ],
        correctIndex: 1,
        explanation: 'In MySQL, `-- ` (two dashes followed by a space) or `#` initiates a single-line comment.',
      },
      {
        id: 'sql2-q8',
        question: 'How do you create a multi-line comment block in MySQL?',
        options: [
          '/* comment content here */',
          '""" comment content here """',
          '<!-- comment content here -->',
          'BEGIN COMMENT ... END COMMENT',
        ],
        correctIndex: 0,
        explanation: '`/* ... */` designates a C-style multi-line comment block in SQL.',
      },
      {
        id: 'sql2-q9',
        question: 'What is the result of performing arithmetic with a NULL value in MySQL (e.g. "SELECT NULL + 10;")?',
        options: ['10', 'A fatal calculation error', 'NULL', '0'],
        correctIndex: 2,
        explanation: 'Any arithmetic operation involving `NULL` in standard SQL yields `NULL` because the operand is unknown.',
      },
      {
        id: 'sql2-q10',
        question: 'Which SQL clause identifies the database table from which records are to be queried?',
        options: ['WHERE', 'FROM', 'SOURCE', 'TABLE'],
        correctIndex: 1,
        explanation: 'The `FROM` clause specifies the source table or view being queried.',
      },
    ],
  },

  // Module 3 Quiz (10 Questions)
  {
    moduleId: 'mod-sql-3',
    title: 'Module 3 Assessment: Filtering Data with the WHERE Clause',
    passThreshold: 70,
    questions: [
      {
        id: 'sql3-q1',
        question: 'What is the primary role of the WHERE clause in a SQL query?',
        options: [
          'To aggregate and summarize multiple rows into one',
          'To filter rows and return only records that satisfy specified conditions',
          'To sort result records in ascending order',
          'To join foreign keys between relational tables',
        ],
        correctIndex: 1,
        explanation: 'The `WHERE` clause specifies search conditions to filter rows returned by the query.',
      },
      {
        id: 'sql3-q2',
        question: 'Which comparison operator in MySQL checks whether two values are NOT equal?',
        options: ['==', '!= (or <>)', '!', '><'],
        correctIndex: 1,
        explanation: 'Both `!=` and `<>` represent the "not equal to" comparison operator in MySQL.',
      },
      {
        id: 'sql3-q3',
        question: 'In date comparisons like "WHERE birth_date > \'1985-01-01\'", how does MySQL evaluate the condition?',
        options: [
          'Chronologically, where a greater date value represents a date occurring later in time',
          'Alphabetically by the month name in English',
          'By the numeric sum of days and months',
          'It throws an error unless explicit STR_TO_DATE() casting is applied',
        ],
        correctIndex: 0,
        explanation: 'MySQL compares standard ISO date strings (`YYYY-MM-DD`) chronologically; greater dates are later dates.',
      },
      {
        id: 'sql3-q4',
        question: 'When combining conditions using both AND and OR without parentheses, which operator takes precedence?',
        options: [
          'OR has higher precedence than AND',
          'AND has higher precedence than OR',
          'They have identical precedence and evaluate from right to left',
          'MySQL throws a syntax error if parentheses are not supplied',
        ],
        correctIndex: 1,
        explanation: 'Logical `AND` has higher precedence than `OR`, so `AND` conditions are grouped and evaluated before `OR`.',
      },
      {
        id: 'sql3-q5',
        question: 'How do you explicitly override default operator precedence between AND and OR in a WHERE clause?',
        options: [
          'By placing square brackets around conditions',
          'By enclosing the priority condition inside parentheses ()',
          'By writing the word PRIORITY before the condition',
          'By chaining multiple separate WHERE clauses',
        ],
        correctIndex: 1,
        explanation: 'Parentheses `()` explicitly dictate evaluation order, guaranteeing that the enclosed conditions are evaluated first.',
      },
      {
        id: 'sql3-q6',
        question: 'What does the percent symbol (%) represent when used with the LIKE operator in MySQL?',
        options: [
          'Exactly one single character',
          'Zero, one, or any number of characters',
          'Only numerical digits',
          'An escaped punctuation mark',
        ],
        correctIndex: 1,
        explanation: 'In `LIKE` pattern matching, `%` matches any string of zero or more characters.',
      },
      {
        id: 'sql3-q7',
        question: 'What does the underscore symbol (_) represent when used with the LIKE operator in MySQL?',
        options: [
          'Any whitespace character',
          'Exactly one single character',
          'Any sequence of characters ending with a consonant',
          'An optional vowel',
        ],
        correctIndex: 1,
        explanation: 'The underscore `_` wildcard matches exactly one single character.',
      },
      {
        id: 'sql3-q8',
        question: 'Which LIKE pattern matches any first_name that begins with \'a\' and has at least three characters in total?',
        options: ['\'a%\'', '\'a__%\'', '\'%a__\'', '\'_a%\''],
        correctIndex: 1,
        explanation: '`\'a__%\'` matches an \'a\' followed by at least two specific characters (`__`) and zero or more trailing characters (`%`), totaling >= 3 characters.',
      },
      {
        id: 'sql3-q9',
        question: 'Which SQL operator tests whether a column value matches any value within a comma-separated list?',
        options: ['BETWEEN', 'CONTAINS', 'IN', 'MATCHES'],
        correctIndex: 2,
        explanation: 'The `IN` operator (e.g. `WHERE first_name IN (\'Leslie\', \'Ron\', \'Tom\')`) determines if a value matches any literal in a list.',
      },
      {
        id: 'sql3-q10',
        question: 'How can you filter records where an employee\'s salary is between 40000 and 70000 inclusive?',
        options: [
          'WHERE salary WITHIN (40000, 70000)',
          'WHERE salary BETWEEN 40000 AND 70000',
          'WHERE salary FROM 40000 TO 70000',
          'WHERE 40000 <= salary <= 70000',
        ],
        correctIndex: 1,
        explanation: 'The `BETWEEN ... AND ...` operator selects values within an inclusive range.',
      },
    ],
  },

  // Module 4 Quiz (10 Questions)
  {
    moduleId: 'mod-sql-4',
    title: 'Module 4 Assessment: HAVING vs WHERE in MySQL',
    passThreshold: 70,
    questions: [
      {
        id: 'sql4-q1',
        question: 'What is the fundamental difference between the WHERE and HAVING clauses in SQL?',
        options: [
          'WHERE filters individual rows before grouping, while HAVING filters aggregated groups after GROUP BY',
          'WHERE applies only to text columns, while HAVING applies only to numeric columns',
          'HAVING can only be used with window functions',
          'WHERE is evaluated after HAVING in the SQL execution pipeline',
        ],
        correctIndex: 0,
        explanation: '`WHERE` filters base rows before aggregation. `HAVING` filters the aggregate summaries created by `GROUP BY`.',
      },
      {
        id: 'sql4-q2',
        question: 'Why does the query "SELECT occupation, AVG(salary) FROM employee_salary WHERE AVG(salary) > 50000 GROUP BY occupation;" fail with an error?',
        options: [
          'AVG() cannot be calculated on salary columns',
          'Aggregate functions like AVG() are invalid in the WHERE clause because row filtering occurs before aggregation is computed',
          'The occupation column must be converted to lowercase',
          'GROUP BY must come before FROM in SQL syntax',
        ],
        correctIndex: 1,
        explanation: 'Aggregate functions summarize groups of rows and therefore cannot be evaluated in the `WHERE` clause, which processes single rows prior to grouping.',
      },
      {
        id: 'sql4-q3',
        question: 'Which clause should be used to filter grouped results based on an aggregate condition like "AVG(salary) > 50000"?',
        options: ['WHERE', 'HAVING', 'LIMIT', 'QUALIFY'],
        correctIndex: 1,
        explanation: '`HAVING AVG(salary) > 50000` is the correct clause to filter aggregated groups.',
      },
      {
        id: 'sql4-q4',
        question: 'In standard SQL logical query processing, which of the following outlines the correct evaluation sequence?',
        options: [
          'FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY',
          'FROM -> HAVING -> WHERE -> GROUP BY -> SELECT',
          'SELECT -> FROM -> WHERE -> HAVING -> GROUP BY',
          'WHERE -> FROM -> GROUP BY -> HAVING -> ORDER BY',
        ],
        correctIndex: 0,
        explanation: 'SQL evaluates: `FROM` (table scan) -> `WHERE` (row filter) -> `GROUP BY` (grouping) -> `HAVING` (group filter) -> `SELECT` (projections) -> `ORDER BY` (sorting).',
      },
      {
        id: 'sql4-q5',
        question: 'Can a single SQL query contain BOTH a WHERE clause and a HAVING clause?',
        options: [
          'No, SQL syntax disallows having both in one query block',
          'Yes; WHERE filters individual rows first, then GROUP BY forms groups, and HAVING filters the aggregated groups',
          'Yes, but only if they evaluate the exact same column',
          'No, HAVING automatically supersedes and cancels WHERE',
        ],
        correctIndex: 1,
        explanation: 'Using both is standard practice: `WHERE` eliminates irrelevant rows before grouping, and `HAVING` filters the resulting aggregate calculations.',
      },
      {
        id: 'sql4-q6',
        question: 'In a query grouping employees by gender, which query correctly filters for groups having an average age greater than 40?',
        options: [
          'SELECT gender, AVG(age) FROM employee_demographics GROUP BY gender HAVING AVG(age) > 40;',
          'SELECT gender, AVG(age) FROM employee_demographics WHERE AVG(age) > 40 GROUP BY gender;',
          'SELECT gender, AVG(age) FROM employee_demographics GROUP BY gender WHERE age > 40;',
          'SELECT gender, AVG(age) FROM employee_demographics FILTER AVG(age) > 40 GROUP BY gender;',
        ],
        correctIndex: 0,
        explanation: 'Filtering on the grouped aggregate `AVG(age) > 40` must be placed in the `HAVING` clause after `GROUP BY`.',
      },
      {
        id: 'sql4-q7',
        question: 'If a query uses "WHERE occupation LIKE \'%manager%\'" alongside "HAVING AVG(salary) > 75000", what data does the HAVING clause examine?',
        options: [
          'All employee rows in the company',
          'Only groups formed from rows whose occupation contains "manager"',
          'Only employees who earn more than 75000 prior to grouping',
          'No data, because LIKE cannot be used in a query that has HAVING',
        ],
        correctIndex: 1,
        explanation: 'The `WHERE` clause first isolates rows containing "manager". Then `GROUP BY` aggregates those rows, and `HAVING` filters the resulting group averages.',
      },
      {
        id: 'sql4-q8',
        question: 'Which aggregate function returns the total number of items or non-null rows in a grouped partition?',
        options: ['SUM()', 'COUNT()', 'TOTAL()', 'SIZE()'],
        correctIndex: 1,
        explanation: '`COUNT()` calculates the number of rows or non-null values matching the group criteria.',
      },
      {
        id: 'sql4-q9',
        question: 'What is the difference between COUNT(*) and COUNT(column_name) in an aggregate query?',
        options: [
          'COUNT(*) counts all rows including NULLs, while COUNT(column_name) ignores NULL values in that specific column',
          'COUNT(*) is slower by definition in all storage engines',
          'COUNT(column_name) only works with numeric values',
          'They produce identical results in every scenario regardless of NULLs',
        ],
        correctIndex: 0,
        explanation: '`COUNT(*)` returns the total row count in the group, whereas `COUNT(column)` ignores rows where the specified column is `NULL`.',
      },
      {
        id: 'sql4-q10',
        question: 'If you want to exclude employees with status "Terminated" before calculating departmental totals, which clause must filter that status?',
        options: [
          'HAVING status != \'Terminated\'',
          'WHERE status != \'Terminated\'',
          'LIMIT status != \'Terminated\'',
          'ORDER BY status != \'Terminated\'',
        ],
        correctIndex: 1,
        explanation: 'Filtering out non-aggregated row attributes prior to group calculation should always be done in the `WHERE` clause for efficiency and accuracy.',
      },
    ],
  },

  // Module 5 Quiz (10 Questions)
  {
    moduleId: 'mod-sql-5',
    title: 'Module 5 Assessment: LIMIT and Aliasing in MySQL',
    passThreshold: 70,
    questions: [
      {
        id: 'sql5-q1',
        question: 'What does the clause "LIMIT 3" accomplish in "SELECT * FROM employee_demographics LIMIT 3;"?',
        options: [
          'It returns the first 3 columns defined in the table',
          'It restricts the output to at most 3 rows from the result set',
          'It filters rows where the primary key ID is 3',
          'It samples every third row from the disk storage',
        ],
        correctIndex: 1,
        explanation: '`LIMIT 3` specifies that the query will return a maximum of 3 records.',
      },
      {
        id: 'sql5-q2',
        question: 'Why is it strongly advised to pair the LIMIT clause with an ORDER BY clause?',
        options: [
          'Because SQL engines will throw a syntax error without ORDER BY',
          'Because relational tables have no guaranteed physical order, making top rows unpredictable without an explicit ORDER BY',
          'Because LIMIT duplicates rows if ORDER BY is omitted',
          'Because ORDER BY disables table scanning',
        ],
        correctIndex: 1,
        explanation: 'Without `ORDER BY`, the database returns rows in non-deterministic order, so `LIMIT` would return an arbitrary slice of records.',
      },
      {
        id: 'sql5-q3',
        question: 'How do you reliably retrieve the 3 oldest employees from an employee_demographics table?',
        options: [
          'ORDER BY age ASC LIMIT 3;',
          'ORDER BY age DESC LIMIT 3;',
          'LIMIT 3 ORDER BY age;',
          'WHERE age = MAX(age) LIMIT 3;',
        ],
        correctIndex: 1,
        explanation: '`ORDER BY age DESC` arranges employees from oldest to youngest, and `LIMIT 3` selects the top 3 oldest.',
      },
      {
        id: 'sql5-q4',
        question: 'In MySQL\'s two-number LIMIT syntax "LIMIT 2, 1;", what do the numbers 2 and 1 represent?',
        options: [
          'Start at row index 2 (offset) and return 1 row',
          'Return 2 rows starting from column 1',
          'Return row 2 and row 1 together',
          'Filter for employees with 2 dependents and 1 job',
        ],
        correctIndex: 0,
        explanation: 'In `LIMIT offset, row_count`, the first number is the zero-based row offset (skipping 2 rows) and the second is the number of rows to return (1 row).',
      },
      {
        id: 'sql5-q5',
        question: 'Which query uses standard SQL syntax to skip the first 2 rows and return the next single row?',
        options: [
          'SELECT * FROM employee_demographics LIMIT 1 OFFSET 2;',
          'SELECT * FROM employee_demographics OFFSET 1 LIMIT 2;',
          'SELECT * FROM employee_demographics SKIP 2 TAKE 1;',
          'SELECT * FROM employee_demographics LIMIT 2, OFFSET 1;',
        ],
        correctIndex: 0,
        explanation: '`LIMIT 1 OFFSET 2` is standard SQL syntax that skips 2 rows and fetches 1 row.',
      },
      {
        id: 'sql5-q6',
        question: 'What is the primary function of the AS keyword in column aliasing (e.g. "SELECT AVG(age) AS avg_age")?',
        options: [
          'To permanently rename the column definition in the underlying database table',
          'To assign a clean, descriptive temporary alias name for the expression in the query output',
          'To convert the calculation into a string variable',
          'To register an index on the calculation',
        ],
        correctIndex: 1,
        explanation: 'Column aliasing assigns a temporary, user-friendly label to a column or computed expression in the query result set.',
      },
      {
        id: 'sql5-q7',
        question: 'Is the AS keyword strictly required to create an alias in MySQL (e.g. "SELECT first_name fn")?',
        options: [
          'Yes, omitting AS triggers a syntax error',
          'No, AS is optional, though including it is recommended for readability',
          'Yes, but only when aliasing aggregate calculations',
          'No, but only when aliasing table names, not columns',
        ],
        correctIndex: 1,
        explanation: 'In MySQL, the `AS` keyword is optional; putting a space between the column and alias works, though explicit `AS` is best practice.',
      },
      {
        id: 'sql5-q8',
        question: 'If a column alias contains spaces (e.g. "Average Age"), how must it be enclosed in MySQL?',
        options: [
          'In backticks (`Average Age`), single quotes (\'Average Age\'), or double quotes ("Average Age")',
          'In curly braces {Average Age}',
          'In parentheses (Average Age)',
          'Aliases with spaces are strictly forbidden in all relational databases',
        ],
        correctIndex: 0,
        explanation: 'Aliases with spaces or reserved words must be quoted using backticks, single quotes, or double quotes in MySQL.',
      },
      {
        id: 'sql5-q9',
        question: 'Why can you NOT use a column alias defined in the SELECT clause inside the WHERE clause of the same query block?',
        options: [
          'Because aliases can only be used in subqueries',
          'Because the WHERE clause is logically executed before the SELECT clause assigns the aliases',
          'Because WHERE clauses only accept table aliases, not column aliases',
          'Because aliases are discarded before WHERE evaluates',
        ],
        correctIndex: 1,
        explanation: 'Due to SQL execution order, `WHERE` runs before `SELECT`, so column aliases do not exist yet when `WHERE` filters rows.',
      },
      {
        id: 'sql5-q10',
        question: 'Can a column alias defined in the SELECT clause be referenced inside an ORDER BY clause?',
        options: [
          'No, aliases cannot be used anywhere else in the query',
          'Yes, because ORDER BY is executed after SELECT in the query evaluation pipeline',
          'Only if the alias contains fewer than 8 characters',
          'Only when sorting in descending (DESC) order',
        ],
        correctIndex: 1,
        explanation: 'Yes, because `ORDER BY` is evaluated after `SELECT`, it can freely reference column aliases defined in the `SELECT` clause.',
      },
    ],
  },
];
