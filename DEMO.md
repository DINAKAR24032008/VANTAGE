# Vantage — 36-Hour Hackathon Demo Script (SIH26075)

This walkthrough guides you through the live demonstration of **Vantage** for the Smart India Hackathon jury.

---

## ⏱️ Live Demo Walkthrough (5-Minute Script)

### Step 1: Learner Journey (Gap Analysis & Course Completion)
1. Navigate to **`http://localhost:5173`**.
2. Click **"Learner"** on the quick-switch bar or log in as `learner1@vantage.gov.in` / `Password@123`.
3. **Inspect the Dashboard**:
   - Point out the **Role Readiness Index** (e.g. 52%) and **Deficiency Gap** vs the benchmark for *Meteorological Assistant*.
   - View the interactive **Skill Gap Chart**: Highlight how *Numerical Weather Prediction (NWP)* and *Doppler Radar* show critical deficiencies.
   - Show the **Ranked Course Recommendations**: Highlight that the top recommended course directly addresses the largest competency deficit.
4. **Enroll & Complete Modules**:
   - Click **"Continue Course"** or **"Enroll Now"** on *Doppler Weather Radar Operations*.
   - In the course player, toggle module completion checkboxes and note how the progress bar updates to 100%.
5. **Take Competency Assessment**:
   - Click **"Take Competency Quiz"**.
   - Answer the 3 MCQ questions (e.g., Q1: Correlation Coefficient, Q2: Inbound/outbound couplet, Q3: Marshall-Palmer relation).
   - Click **"Submit Assessment"**: View the instant auto-grading score and personalized rationale.
6. **Verify Certificate Issuance & Profile Elevation**:
   - Click **"View Official Certificate"**: Showcase the Ministry of Earth Sciences accredited certificate with unique Certificate Number and SHA-256 digital verification hash.
   - Return to the Learner Dashboard: Show that the learner's skill level has elevated and the Readiness Index increased!

---

### Step 2: Trainer Journey (Curriculum & Assessment Authoring)
1. Click **"Trainer"** on the top navigation quick-switch bar (logged in as `trainer.met@vantage.gov.in`).
2. Navigate to **"Trainer Hub & Courses"**.
3. View existing published courses and click **"Create New Course"**:
   - Enter title and description.
   - Demonstrate the file/media upload component.
   - Map the course to one or more competencies and set target skill elevation levels (1 to 5).
   - Add instructional modules and configure assessment questions.
4. Click **"Save & Publish Course"** to verify immediate availability in the catalog.

---

### Step 3: Admin Journey (Org Heatmap & Automated Feedback Loop)
1. Click **"Admin"** on the quick-switch bar (logged in as `admin@vantage.gov.in`).
2. Navigate to **"Executive Analytics & Heatmap"**:
   - **Executive KPIs**: Review active scientists, 70%+ completion velocity, and issued certificates.
   - **Inter-Departmental Competency Gap Heatmap**: Point out the color-coded matrix across IMD, INCOIS, NCS, NIOT, and NCPOR.
   - **Course Engagement Chart**: Point out completion velocity and average quiz scores.
3. **Demonstrate Feature 9 (The Feedback Loop)**:
   - Scroll down to **"Automated Feedback Loop: Role Competency Matrix Tuning"**.
   - Select *Meteorological Assistant*.
   - Adjust the required benchmark slider for *Satellite Meteorology* from Level 4 up to Level 5.
   - Click **"Save Matrix & Trigger Feedback Loop"**.
   - **Show the Jury**: Point out the live feedback notification confirming that the engine recalculated gap scores and ranked recommendations across all learners in that job role automatically!

---

### Step 4: Knowledge Sharing Forum
1. Navigate to **"MoES Forum"**.
2. Filter between *General Discourse* and *Course Discussions*.
3. Post a question or reply directly to an existing thread to demonstrate real-time threaded knowledge collaboration.

---

## 📌 Simplified & Stubbed Components (Jury Q&A Notes)

When asked about production scalability and government integrations during Q&A:

1. **Single Sign-On (SSO)**:
   - *Current Implementation*: Extensible auth abstraction layer (`AuthService.authenticateWithSSOStub`).
   - *Future Work*: Pluggable OAuth2 / SAML 2.0 adapters connecting to Government of India identity providers (**Parichay**, **Jan Parichay**, and **iGOT-Karmayogi**).
2. **File & Media Storage**:
   - *Current Implementation*: Local disk multi-part file handler (`storageService.ts`) with S3-compliant interface (`StorageProvider`).
   - *Future Work*: Swapping the provider with an AWS S3 / MinIO / NIC MeghRaj Object Storage bucket.
3. **Database Scalability**:
   - *Current Implementation*: SQLite for zero-dependency instant local evaluation, with complete production Docker compose packaging for PostgreSQL 16.
   - *Future Work*: Read-replica clustering on AWS RDS PostgreSQL or Gov MeghRaj cloud.
