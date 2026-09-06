# Campus2Career - Enterprise Campus Placement Platform

A comprehensive full-stack platform for campus placements, skill development, AI career guidance, assessments, and industry-academia collaboration.

## What This Project Actually Does

Campus2Career is built around **6 real workflows**:

1. **Students** build profiles, take assessments, apply to jobs/internships, join workshops/challenges/projects, and get AI career guidance.
2. **Recruiters** post jobs, manage applications, schedule interviews, create assessments, and shortlist candidates.
3. **Mentors** approve student applications, track progress, manage internships, and oversee student activity.
4. **Institutions/Admins** approve jobs/opportunities, manage users, run analytics, oversee collaborations, and configure assessments.
5. **Academicians** browse faculty programs, apply to opportunities, and track their applications.
6. **AI Career Advisor** provides persistent, context-aware chat with full markdown rendering and chat history.

## Live Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router |
| Backend | Node.js + Express + MongoDB (Mongoose) |
| AI | NVIDIA Nemotron via OpenAI-compatible API |
| Auth | JWT + refresh tokens |
| File handling | Multer + XLSX + Mammoth |

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB
- Python venv (only if running the recommendation service locally)

### Clone

```bash
git clone https://github.com/rahulyadav54/Campus2Career.git
cd Campus2Career
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill MONGO_URI, JWT_SECRET, and optional AI/email keys
npm install
npm run seed:admin
npm start
```

Default admin credentials are defined in `backend/scripts/seedAdmin.js`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### Recommendation Service (optional)

```bash
cd recommendation_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Roles

- `student`
- `mentor`
- `recruiter`
- `admin`
- `institution`
- `academician`

## Feature Map

### Authentication & Profile
- Registration / login with role selection
- Token refresh
- Profile completion and reputation scoring
- Resume upload
- Social links
- Digital portfolio

### Jobs & Applications
- Job posting with recruiter approval workflow
- AI-powered job recommendations
- Application status tracking
- Interview scheduling
- Mentor approval flow
- Recruiter application management
- Shortlisting and hiring

### Assessments & Tests
- Admin/recruiter/institution assessment management
- Question bank with bulk import (CSV, XLSX, XLS, JSON, DOCX)
- Assessment templates
- Timed student assessment attempts
- Auto-submit on timeout
- Integrity monitoring (tab switch, blur, fullscreen)
- Aptitude tests
- Results and analytics

### AI Career Advisor
- Full markdown rendering (headings, tables, code, lists)
- Persistent per-user chat history
- New chat / delete chat / load previous chats
- Available as full-page route and floating widget
- Uses NVIDIA Nemotron backend

### Notifications
- System notifications
- Unread count badge
- Mark as read / mark all read

### Collaboration & Learning
- Workshops and guest lectures
- Innovation challenges
- Live industry projects
- Collaboration registrations
- Learning platforms
- Courses and certificates
- Skill mapping
- Learning recommendations

### Analytics
- Admin analytics
- Skill demand trends
- Internship participation
- Placement readiness
- Student skill gap reports
- Recruiter analytics

## Backend API Overview

Base path: `/api`

### Core Routes
- `/api/auth` — login, register, profile, refresh
- `/api/jobs` — job CRUD and status toggles
- `/api/applications` — apply, mentor/recruiter decisions
- `/api/recommendations` — AI job recommendations
- `/api/student` — student-specific endpoints
- `/api/mentor` — mentor approvals, progress, internships
- `/api/recruiter` — recruiter jobs, applications, history
- `/api/admin` — approvals, user management, activities, post
- `/api/institutions` — institution analytics and portfolio verification
- `/api/opportunities` — faculty programs and academician workflows
- `/api/portfolio` — student portfolio management
- `/api/realtime` — notifications and activity feeds
- `/api/collaborations` — workshops, lectures, challenges, projects
- `/api/learning-platforms` — external learning providers
- `/api/courses` — student/enrolled courses
- `/api/mentorship` — mentor sessions
- `/api/notifications` — notification center
- `/api/chat-history` — AI chat persistence
- `/api/assessment-management` — assessment CRUD, candidates, stats
- `/api/student-assessments` — student attempts and results
- `/api/question-bank` — questions, templates, bulk import
- `/api/ai` — AI chat
- `/api/aptitude` — aptitude tests
- `/api/academician-opportunities` — academician opportunity workflows
- `/api/internship-progress` — internship progress tracking

## Frontend Routes

- `/` — Landing page
- `/login` — Login
- `/register` — Student registration
- `/recruiter/register` — Recruiter registration
- `/academician/register` — Academician registration

### Student
- `/student` — Home
- `/student/profile`
- `/student/jobs`
- `/student/recommendations`
- `/student/assessment`
- `/student/assessments`
- `/student/aptitude`
- `/student/opportunities`
- `/student/applications`
- `/student/certificates`
- `/student/portfolio`
- `/student/career`
- `/student/skill-mapping`
- `/student/learning`
- `/student/learning-platforms`
- `/student/internships`
- `/student/workshops`
- `/student/challenges`
- `/student/projects`
- `/student/collaborations`
- `/student/announcements`
- `/student/notifications`
- `/student/courses`
- `/student/my-courses`

### Recruiter
- `/recruiter`
- `/recruiter/jobs`
- `/recruiter/create-job`
- `/recruiter/applications`
- `/recruiter/students`
- `/recruiter/history`
- `/recruiter/analytics`
- `/recruiter/assessments`
- `/recruiter/announcements`
- `/recruiter/notifications`

### Admin
- `/admin`
- `/admin/users`
- `/admin/activities`
- `/admin/job-verification`
- `/admin/opportunity-approvals`
- `/admin/portfolio-verification`
- `/admin/question-bank`
- `/admin/assessments`
- `/admin/pathways`
- `/admin/analytics`
- `/admin/collaboration`
- `/admin/learning-platforms`
- `/admin/courses`
- `/admin/notifications`

### Institution
- `/institution`
- `/institution/portfolio-verification`
- `/institution/analytics/skill-demand`
- `/institution/analytics/internship-participation`
- `/institution/analytics/placement-readiness`
- `/institution/assessments`
- `/institution/notifications`

### Mentor
- `/mentor`
- `/mentor/mentees`
- `/mentor/approvals`
- `/mentor/progress`
- `/mentor/history`
- `/mentor/internships`

### Academician
- `/academician`
- `/academician/opportunities`
- `/academician/applications`

## Environment Variables

```bash
# Backend
MONGO_URI=
JWT_SECRET=
PORT=5000
OPENAI_API_KEY=
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
AI_MODEL=nemotron-4-340b-instruct
FRONTEND_URLS=https://campus2career.zayacodehub.in,https://campus2career-cpe2.onrender.com
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
```

## Deployment

Backend is deployed on Render. Frontend should be deployed on Vercel or Netlify with `VITE_API_URL` set to the backend URL.

## Contributing

1. Create a feature branch
2. Make changes
3. Run `npm run build` in frontend
4. Run `node --check server.js` in backend
5. Open a pull request

## License

ISC
