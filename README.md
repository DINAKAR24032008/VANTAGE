# Vantage (SIH26075)
### Digital Capacity Building & Learning Management Portal
**Ministry of Earth Sciences (MoES) • Theme: Smart Education**

Vantage is an enterprise-grade digital capacity building and learning management portal tailored for the Ministry of Earth Sciences. It features dynamic heuristic competency gap analysis, role-based course recommendations, structured learning paths, auto-graded MCQ assessments with verifiable cryptographic certificates, organizational skill-gap heatmaps, collaborative forums, and an automated policy feedback loop.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**: Enforced server-side on every route (`admin`, `trainer`, `learner`).
2. **Dynamic Competency Profiling**: Onboarding self-assessment calibrated against Ministry operational levels (Novice to Master).
3. **Intelligent Gap Analysis Engine (`GET /api/learners/:id/recommendations`)**: Heuristic scoring between learner profiles and target job role matrices, returning ranked personalized recommendations.
4. **Interactive Learning & Module Progress**: Video & document viewer with real-time progress calculation.
5. **Auto-Graded MCQ Assessments & Digital Certificates**: Immediate scoring, automatic profile elevation upon passing, and unique SHA-256 verifiable certificates (`VT-YYYY-XXXXXX`).
6. **Executive Analytics Dashboard**: Org-wide completion velocity and an inter-departmental competency gap heatmap (IMD, INCOIS, NCS, NIOT, NCPOR).
7. **Threaded Knowledge-Sharing Forum**: Multi-level discussions scoped either to specific courses or general MoES open-data research.
8. **Automated Feedback Loop (SIH Stretch Goal)**: Modifying a job role's competency matrix instantly triggers automated gap and recommendation recalibrations across all affected staff.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend**: Node.js, Express, TypeScript, Zod, Multer, bcryptjs, jsonwebtoken
- **Database / ORM**: SQLite (instant local development) & PostgreSQL 16 (containerized production), managed via Prisma ORM
- **Authentication**: JWT sessions with Parichay / iGOT Karmayogi SSO abstraction layer
- **Deployment**: Docker, Docker Compose, Nginx

---

## 🚀 Quick Start (Local One-Command Execution)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install Dependencies
```bash
# From the root directory:
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Initialize Database & Seed Domain Data
```bash
cd server
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
cd ..
```
> **Note:** After reseeding the database, log out and log in again so your browser updates its session token.

### 3. Launch Development Server
```bash
# Starts both Express backend (Port 5000) and React frontend (Port 5173) concurrently:
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

> **Note:** The daily course reminder scheduler requires an always-on server instance (a host that sleeps or goes idle will miss background cron ticks). Production SMS delivery requires integration with an enterprise SMS provider gateway (e.g., Twilio or GupShup) and, in India, TRAI DLT registration. In dev/demo mode, SMS delivery is simulated via server console logging.

---

## 🐳 Containerized Deployment (Docker)

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost`
- Backend API: `http://localhost:5000/api/health`
- Database: PostgreSQL on port 5432

---

## 🔑 Pre-Configured Demo Credentials

The platform includes a built-in **Quick Role Switcher** at the top right of the navigation bar, allowing 1-click switching during jury evaluation.

| Role | Name & Department | Email | Password |
| :--- | :--- | :--- | :--- |
| **Learner** | Priya Sharma (IMD - Met Assistant) | `learner1@vantage.gov.in` | `Password@123` |
| **Learner** | Rajesh Kulkarni (INCOIS - Ocean Analyst) | `learner2@vantage.gov.in` | `Password@123` |
| **Trainer** | Dr. Ananya Sen (IMD - Chief Scientist) | `trainer.met@vantage.gov.in` | `Password@123` |
| **Trainer** | Dr. Vikram Nair (NIOT - Oceanographer) | `trainer.ocean@vantage.gov.in` | `Password@123` |
| **Admin** | Dr. Rameshwar Rao (MoES HQ - Training Director) | `admin@vantage.gov.in` | `Password@123` |

---

## 📝 Seed Data Overview

- **1 Admin** & **2 Trainers**
- **5 Learners** across 5 MoES institutes (IMD, INCOIS, NCS, NIOT, NCPOR) with realistic initial skill profiles
- **7 Specialization Courses**:
  1. *Doppler Weather Radar (DWR) Operations & Nowcasting* (IMD)
  2. *High-Resolution Numerical Weather Prediction using WRF-ARW* (IMD)
  3. *Tsunami Early Warning & Ocean State Forecast Services* (INCOIS)
  4. *Deep-Ocean Submersible Operations & AUVs (Samudrayaan)* (NIOT)
  5. *Earthquake Hazard Microzonation & Broadband Seismographs* (NCS)
  6. *Geospatial Cloud & Big Earth Data Processing with Python & GDAL* (MoES-wide)
  7. *Introduction to Python* (MoES-wide)
- Pre-seeded enrollments, assessments, certificates, and threaded forum discussions for immediate visualization.
