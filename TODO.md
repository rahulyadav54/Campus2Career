# Campus2Career Implementation Roadmap

## Progress Summary

- Core SIH feature coverage: approximately 65% complete.
- Local development setup: approximately 80% complete.
- Public production deployment: not complete.
- Main remaining risk: MongoDB Atlas connectivity is intermittent on the current network.

## Completed

### Foundation and branding

- [x] Rebranded visible application text as Campus2Career.
- [x] Updated repository documentation to the Campus2Career GitHub repository.
- [x] Added environment examples for frontend and backend.
- [x] Added Vercel SPA routing configuration.
- [x] Added Render service configuration.
- [x] Kept backend `.env` out of Git.

### Existing placement workflows

- [x] Student registration, login, profile, projects, skills, experience, and resume support.
- [x] Recruiter registration and company profile.
- [x] Recruiter job posting and job management.
- [x] Admin job verification.
- [x] Student application and status tracking.
- [x] Mentor approval and student progress workflows.
- [x] Admin user approvals, user management, announcements, and activity monitoring.
- [x] Basic job recommendations using skills, location, and CGPA.
- [x] Resume and recruiter document uploads.
- [x] Admin placement statistics and recruiter reporting.

### SIH expansion implemented

- [x] Academician role in the user model.
- [x] Academician registration page.
- [x] Academician dashboard for publishing programs.
- [x] Opportunity types for internships, jobs, apprenticeships, training, certifications, workshops, mentorship, FDPs, faculty internships, consultancy, research, live projects, and innovation.
- [x] Opportunity approval queue for admins/institutions.
- [x] Student and academician opportunity browsing.
- [x] Opportunity application workflow.
- [x] Skill assessment persistence with technical, soft-skill, and aptitude categories.
- [x] Automatic assessment strengths, gaps, and learning recommendations.
- [x] Student assessment page.
- [x] Persistent digital portfolio items for skills, certificates, projects, internships, and achievements.
- [x] Portfolio verification fields and admin verification API.
- [x] Student portfolio page.
- [x] Real-time notification stream using authenticated Server-Sent Events.
- [x] Dashboard notification listener with heartbeat and disconnect cleanup.
- [x] Admin API URL centralization for deployment compatibility.
- [x] Backend startup waits for MongoDB and retries connection attempts.

## Remaining Work

### Priority 1: Make all SIH workflows production-complete

- [x] Add a dedicated institution entity and institution-admin role.
- [x] Add institution onboarding, departments, and multi-institution data isolation.
- [x] Add institution dashboard for skill development, internship participation, placements, and program outcomes.
- [x] Add admin/institution portfolio verification UI, not only the verification API.
- [x] Add assessment question-bank management and configurable scoring.
- [x] Add aptitude test question types, timed attempts, result history, and score breakdowns.
- [x] Replace generated learning recommendations with real course, certification, and workshop records.
- [x] Add career pathways based on skills, interests, roles, and industry demand.
- [x] Add internship progress records, mentor feedback, completion evidence, and completion certificates.
- [ ] Add structured mentorship sessions, goals, scheduling, attendance, and feedback.
- [ ] Add collaboration records for guest lectures, workshops, research, consultancy, innovation challenges, and live projects.

### Priority 2: Reliability and security

- [ ] Diagnose and eliminate the intermittent MongoDB Atlas TLS/DNS failure on the development network.
- [x] Add backend health and readiness endpoints that report MongoDB state.
- [x] Add centralized frontend API client with consistent timeout, retry, and error handling.
- [x] Replace remaining direct `localhost:5000` calls in all frontend pages with `API_URL`.
- [x] Add request validation with a schema library for auth, opportunities, assessments, portfolios, and applications.
- [x] Add rate limiting, security headers, request size limits, and structured production logging.
- [ ] Move uploads from local disk to private object storage with signed URLs.
- [ ] Add document access audit logs and file malware/type validation.
- [ ] Add email verification, password reset, and optional MFA for privileged roles.
- [x] Remove sensitive request logging, especially passwords and authorization headers.
- [ ] Use a strong production JWT secret and rotate all credentials exposed during development.

### Priority 3: Real-time and integrations

- [ ] Emit real-time events for opportunity approval, application status, mentor feedback, and assessment completion.
- [ ] Add a frontend live-refresh mechanism for dashboards and opportunity lists.
- [ ] Add event persistence/replay or polling fallback for disconnected clients.
- [ ] Integrate an LMS or course provider.
- [ ] Integrate certification verification/provider APIs.
- [ ] Add calendar/email integration for interviews and mentorship sessions.
- [ ] Define an institutional database import/export contract.
- [ ] Add API documentation with OpenAPI or an equivalent format.

### Priority 4: Testing, deployment, and presentation

- [ ] Add backend unit tests for scoring, role authorization, opportunity approval, portfolio verification, and application status transitions.
- [ ] Add API integration tests using a test database.
- [ ] Add frontend tests for login, role routing, assessment submission, opportunity application, and admin approvals.
- [ ] Add end-to-end smoke tests for student, academician, recruiter, mentor, and admin journeys.
- [ ] Add CI workflow to run builds, lint, syntax checks, and tests on every push.
- [ ] Push the latest commit after remaining changes.
- [ ] Deploy frontend to Vercel with `VITE_API_URL`.
- [ ] Deploy backend and recommendation service to Render or Railway.
- [x] Add production `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URLS` configuration examples.
- [ ] Replace every production-incompatible localhost URL.
- [x] Add a live demo seed dataset without real personal credentials.
- [ ] Prepare SIH demo script, architecture diagram, requirement mapping, and measurable impact metrics.

## Agent Work Packages

### Agent A: Institution architecture

**Scope:** institution model, institution-admin role, onboarding, access isolation, institution dashboard API.

**Acceptance:** an institution admin can log in, see only its institution data, approve users/programs, and view skill/internship/placement metrics.

### Agent B: Assessment engine

**Scope:** question bank, configurable assessments, aptitude scoring, history, and student result UI.

**Acceptance:** an admin can create an assessment; a student can complete it; the system stores answers, scores technical/soft/aptitude categories, and displays gaps.

### Agent C: Learning and collaboration

**Scope:** course/training records, certification programs, mentorship sessions, workshops, guest lectures, research, consultancy, and live projects.

**Acceptance:** providers can publish programs, institutions can approve them, and eligible users can register/apply and track participation.

### Agent D: Portfolio verification

**Scope:** institution/admin verification UI, evidence uploads, verified public portfolio, completion records.

**Acceptance:** a student submits evidence; an authorized reviewer verifies/rejects it; public profiles show only verified items.

### Agent E: Reliability and security

**Scope:** central API client, remove hardcoded localhost URLs, validation, logging cleanup, rate limiting, health checks, upload security.

**Acceptance:** all frontend workflows use environment-based API URLs; invalid requests return useful errors; secrets/passwords are never logged; readiness reports database status.

### Agent F: Testing and deployment

**Scope:** test suites, CI, Vercel/Render deployment, seed data, demo documentation.

**Acceptance:** CI passes; a fresh clone can be configured from example environment files; deployed frontend can authenticate against deployed backend.

## Recommended Execution Order

1. Agent E: reliability and security.
2. Agent A: institution architecture.
3. Agent B: assessment engine.
4. Agent C: learning and collaboration.
5. Agent D: portfolio verification.
6. Agent F: testing and deployment.

## Definition Of Done

- [ ] All required SIH roles exist: student, academician, industry/recruiter, mentor, and institution.
- [ ] Every major workflow has a database model, protected API, usable UI, validation, and error state.
- [ ] Student skills come from assessment results and produce explainable gaps and recommendations.
- [ ] Internship, placement, learning, faculty, and collaboration programs are searchable and trackable.
- [ ] Portfolios and completion evidence can be institution-verified.
- [ ] Dashboards show real database metrics, not generated placeholder values.
- [ ] Real-time updates work with a reconnect or polling fallback.
- [ ] Automated checks pass on every push.
- [ ] The complete application is deployed and accessible through a public HTTPS URL.
