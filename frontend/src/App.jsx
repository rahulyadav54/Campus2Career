import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { applyTheme } from "./utils/theme";
import { Toaster } from 'react-hot-toast';
import Landing from "./pages/Landing";
import RegisterPage from "./pages/auth/Register";
import LoginPage from "./pages/auth/Login";
import DashboardLayout from "./components/shared/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentHome from "./pages/student/StudentHome";
import Profile from "./pages/student/profile";
import JobOpenings from "./pages/student/JobOpenings";
import JobRecommendations from "./pages/student/JobRecommendations";
import Applications from "./pages/student/Applications";
import Certificates from "./pages/student/Certificates";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import Mentees from "./pages/mentor/Mentees";
import Approvals from "./pages/mentor/Approvals";
import Progress from "./pages/mentor/Progress";
import MentorHistory from "./pages/mentor/History";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import PlacementDashboard from "./pages/admin/PlacementDashboard";
import UserApprovals from "./pages/admin/UserApprovals";
import JobVerification from "./pages/admin/JobVerification";
import StudentApprovals from "./pages/admin/StudentApprovals";
import UserManagement from "./pages/admin/UserManagement";
import ActivityMonitor from "./pages/admin/ActivityMonitor";
import RecruiterStudentProfile from "./pages/recruiter/RecruiterStudentProfile";
import StudentsList from "./pages/recruiter/StudentsList";
import AdminPostSection from "./pages/admin/AdminPostSection";
import RecruiterJobs from "./pages/recruiter/RecruiterJobs";
import EnhancedRecruiterJobs from "./pages/recruiter/EnhancedRecruiterJobs";
import JobPostingForm from "./pages/recruiter/JobPostingForm";
import ApplicationManagement from "./pages/recruiter/ApplicationManagement";
import RecruiterRegistration from "./pages/recruiter/RecruiterRegistration";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterHistory from "./pages/recruiter/History";
import JobApplications from "./pages/recruiter/JobApplications";
import UnderDevelopment from "./pages/UnderDevelopment";
import SkillAssessment from "./pages/student/SkillAssessment";
import StudentAssessments from "./pages/student/StudentAssessments";
import AptitudeTests from "./pages/student/AptitudeTests";
import AptitudeTestAttempt from "./pages/student/AptitudeTestAttempt";
import AptitudeResults from "./pages/student/AptitudeResults";
import OpportunityHub from "./pages/shared/OpportunityHub";
import AcademicianRegistration from "./pages/auth/AcademicianRegistration";
import Portfolio from "./pages/student/Portfolio";
import AcademicianDashboard from "./pages/academician/AcademicianDashboard";
import AcademicianOpportunities from "./pages/academician/AcademicianOpportunities";
import AcademicianOpportunityDetail from "./pages/academician/AcademicianOpportunityDetail";
import AcademicianMyApplications from "./pages/academician/AcademicianMyApplications";
import OpportunityApprovals from "./pages/admin/OpportunityApprovals";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import PortfolioVerification from "./pages/institution/PortfolioVerification";
import InstitutionSkillDemandAnalytics from "./pages/institution/InstitutionSkillDemandAnalytics";
import InstitutionInternshipAnalytics from "./pages/institution/InstitutionInternshipAnalytics";
import InstitutionPlacementReadiness from "./pages/institution/InstitutionPlacementReadiness";
import AdminPortfolioVerification from "./pages/admin/PortfolioVerification";
import QuestionBankManagement from "./pages/admin/QuestionBankManagement";
import AssessmentManagement from "./pages/admin/AssessmentManagement";
import AdminPathways from "./pages/admin/AdminPathways";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import SkillDemandAnalytics from "./pages/admin/SkillDemandAnalytics";
import InternshipAnalytics from "./pages/admin/InternshipAnalytics";
import StudentSkillGapReport from "./pages/admin/StudentSkillGapReport";
import RecruitmentAnalytics from "./pages/recruiter/RecruitmentAnalytics";
import CareerGuidance from "./pages/student/CareerGuidance";
import AIDashboardPage from "./pages/student/AIDashboardPage";
import AICareerMissionPage from "./pages/student/AICareerMissionPage";
import AISkillGapPage from "./pages/student/AISkillGapPage";
import InterviewPreparation from "./pages/student/InterviewPreparation";
import VirtualInterviewer from "./pages/student/VirtualInterviewer";
import LearningRecommendations from "./pages/student/LearningRecommendations";
import SkillMapping from "./pages/student/SkillMapping";
import Internships from "./pages/student/Internships";
import MentorInternships from "./pages/mentor/MentorInternships";
import Workshops from "./pages/student/Workshops";
import InnovationChallenges from "./pages/student/InnovationChallenges";
import LiveIndustryProjects from "./pages/student/LiveIndustryProjects";
import CollaborationRegistrations from "./pages/student/CollaborationRegistrations";
import AdminCollaborationManagement from "./pages/admin/AdminCollaborationManagement";
import LearningPlatforms from "./pages/shared/LearningPlatforms";
import AdminLearningPlatforms from "./pages/admin/AdminLearningPlatforms";
import StudentCourses from "./pages/student/StudentCourses";
import CourseDetail from "./pages/student/CourseDetail";
import MyCourses from "./pages/student/MyCourses";
import AdminCourses from "./pages/admin/AdminCourses";
import Announcements from "./pages/shared/Announcements";
import Notifications from "./pages/shared/Notifications";
import AdminSettings from "./pages/admin/AdminSettings";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResumeCenter from "./pages/student/ResumeCenter";
import ResumeBuilder from "./pages/student/ResumeCenter/ResumeBuilder";
import ResumeJobMatches from "./pages/student/ResumeCenter/JobMatches";
import ResumeCompanies from "./pages/student/ResumeCenter/Companies";
import ResumeSkillGaps from "./pages/student/ResumeCenter/SkillGaps";


function ThemeSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    applyTheme(undefined, pathname);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ThemeSync />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/recruiter/register" element={<RecruiterRegistration />} />
        <Route path="/academician/register" element={<AcademicianRegistration />} />
        
        <Route path="/student" element={<ProtectedRoute><DashboardLayout userRole="student" /></ProtectedRoute>}>
          <Route index element={<StudentHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:studentId" element={<Profile />} />
          <Route path="jobs" element={<JobOpenings />} />
          <Route path="recommendations" element={<JobRecommendations />} />
          <Route path="assessment" element={<SkillAssessment />} />
          <Route path="assessments" element={<StudentAssessments />} />
          <Route path="aptitude" element={<AptitudeTests />} />
          <Route path="aptitude/:testId" element={<AptitudeTestAttempt />} />
          <Route path="aptitude/results/:attemptId" element={<AptitudeResults />} />
          <Route path="opportunities" element={<OpportunityHub />} />
          <Route path="applications" element={<Applications />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="career" element={<CareerGuidance />} />
          <Route path="ai-dashboard" element={<AIDashboardPage />} />
          <Route path="ai-career-mission" element={<AICareerMissionPage />} />
          <Route path="ai-skill-gap" element={<AISkillGapPage />} />
          <Route path="interview-preparation" element={<InterviewPreparation />} />
          <Route path="virtual-interview" element={<VirtualInterviewer />} />
          <Route path="virtual-interview/:sessionId" element={<VirtualInterviewer />} />
          <Route path="resume-center" element={<ResumeCenter />} />
          <Route path="resume-center/builder/:resumeId" element={<ResumeBuilder />} />
          <Route path="resume-center/jobs" element={<ResumeJobMatches />} />
          <Route path="resume-center/companies" element={<ResumeCompanies />} />
          <Route path="resume-center/skills" element={<ResumeSkillGaps />} />
          <Route path="skill-mapping" element={<SkillMapping />} />
          <Route path="learning" element={<LearningRecommendations />} />
          <Route path="learning-platforms" element={<LearningPlatforms />} />
          <Route path="internships" element={<Internships />} />
          <Route path="workshops" element={<Workshops />} />
          <Route path="challenges" element={<InnovationChallenges />} />
          <Route path="projects" element={<LiveIndustryProjects />} />
          <Route path="collaborations" element={<CollaborationRegistrations />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="my-courses" element={<MyCourses />} />
        </Route>

        <Route path="/academician" element={<ProtectedRoute><DashboardLayout userRole="academician" /></ProtectedRoute>}>
          <Route index element={<AcademicianDashboard />} />
          <Route path="dashboard" element={<AcademicianDashboard />} />
          <Route path="opportunities" element={<AcademicianOpportunities />} />
          <Route path="opportunities/:id" element={<AcademicianOpportunityDetail />} />
          <Route path="applications" element={<AcademicianMyApplications />} />
        </Route>
        
        <Route path="/mentor" element={<ProtectedRoute><DashboardLayout userRole="mentor" /></ProtectedRoute>}>
          <Route index element={<MentorDashboard />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="mentees" element={<Mentees />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="progress" element={<Progress />} />
          <Route path="history" element={<MentorHistory />} />
          <Route path="internships" element={<MentorInternships />} />
          <Route path="student/:studentId" element={<Profile />} />
        </Route>
        
        <Route path="/recruiter" element={<ProtectedRoute><DashboardLayout userRole="recruiter" /></ProtectedRoute>}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="jobs" element={<EnhancedRecruiterJobs />} />
          <Route path="create-job" element={<JobPostingForm />} />
          <Route path="jobs/:jobId/edit" element={<JobPostingForm />} />
          <Route path="jobs/:jobId/applications" element={<ApplicationManagement />} />
          <Route path="applications" element={<RecruiterApplications />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="student/:id" element={<RecruiterStudentProfile />} />
          <Route path="post" element={<RecruiterJobs /> } />
          <Route path="job/:jobId/applications" element={<JobApplications />} />
          <Route path="history" element={<RecruiterHistory />} />
          <Route path="analytics" element={<RecruitmentAnalytics />} />
          <Route path="assessments" element={<AssessmentManagement />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><DashboardLayout userRole="admin" /></ProtectedRoute>}>
          <Route index element={<PlacementDashboard />} />
          <Route path="dashboard" element={<PlacementDashboard />} />
          <Route path="user-approvals" element={<UserApprovals />} />
          <Route path="job-verification" element={<JobVerification />} />
          <Route path="opportunity-approvals" element={<OpportunityApprovals />} />
          <Route path="approvals" element={<StudentApprovals />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="activities" element={<ActivityMonitor />} />
          <Route path="post" element={<AdminPostSection />} />
          <Route path="portfolio-verification" element={<AdminPortfolioVerification />} />
          <Route path="question-bank" element={<QuestionBankManagement />} />
          <Route path="assessments" element={<AssessmentManagement />} />
          <Route path="pathways" element={<AdminPathways />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="analytics/skill-demand-trends" element={<SkillDemandAnalytics />} />
          <Route path="analytics/internship-participation" element={<InternshipAnalytics />} />
          <Route path="analytics/student-skill-gaps" element={<StudentSkillGapReport />} />
          <Route path="collaboration" element={<AdminCollaborationManagement />} />
          <Route path="learning-platforms" element={<AdminLearningPlatforms />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/institution" element={<ProtectedRoute><DashboardLayout userRole="institution" /></ProtectedRoute>}>
          <Route index element={<InstitutionDashboard />} />
          <Route path="dashboard" element={<InstitutionDashboard />} />
          <Route path="portfolio-verification" element={<PortfolioVerification />} />
          <Route path="analytics/skill-demand" element={<InstitutionSkillDemandAnalytics />} />
          <Route path="analytics/internship-participation" element={<InstitutionInternshipAnalytics />} />
          <Route path="analytics/placement-readiness" element={<InstitutionPlacementReadiness />} />
          <Route path="assessments" element={<AssessmentManagement />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<UnderDevelopment />} />
      </Routes>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </>
  );
}

export default App;
