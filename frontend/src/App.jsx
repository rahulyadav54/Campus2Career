import { Route, Routes } from "react-router-dom";
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
import OpportunityHub from "./pages/shared/OpportunityHub";
import AcademicianRegistration from "./pages/auth/AcademicianRegistration";
import Portfolio from "./pages/student/Portfolio";
import AcademicianDashboard from "./pages/academician/AcademicianDashboard";
import OpportunityApprovals from "./pages/admin/OpportunityApprovals";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import PortfolioVerification from "./pages/institution/PortfolioVerification";
import AdminPortfolioVerification from "./pages/admin/PortfolioVerification";
import QuestionBankManagement from "./pages/admin/QuestionBankManagement";
import AdminPathways from "./pages/admin/AdminPathways";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import CareerGuidance from "./pages/student/CareerGuidance";
import LearningRecommendations from "./pages/student/LearningRecommendations";
import SkillMapping from "./pages/student/SkillMapping";
import Internships from "./pages/student/Internships";
import MentorInternships from "./pages/mentor/MentorInternships";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recruiter/register" element={<RecruiterRegistration />} />
        <Route path="/academician/register" element={<AcademicianRegistration />} />
        <Route path="*" element={<UnderDevelopment />} />
        
        <Route path="/student" element={<ProtectedRoute><DashboardLayout userRole="student" /></ProtectedRoute>}>
          <Route index element={<StudentHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:studentId" element={<Profile />} />
          <Route path="jobs" element={<JobOpenings />} />
          <Route path="recommendations" element={<JobRecommendations />} />
          <Route path="assessment" element={<SkillAssessment />} />
          <Route path="opportunities" element={<OpportunityHub />} />
          <Route path="applications" element={<Applications />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="career" element={<CareerGuidance />} />
          <Route path="skill-mapping" element={<SkillMapping />} />
          <Route path="learning" element={<LearningRecommendations />} />
          <Route path="internships" element={<Internships />} />
        </Route>

        <Route path="/academician" element={<ProtectedRoute><DashboardLayout userRole="academician" /></ProtectedRoute>}>
          <Route index element={<AcademicianDashboard />} />
          <Route path="dashboard" element={<AcademicianDashboard />} />
          <Route path="opportunities" element={<OpportunityHub />} />
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
        </Route>
        
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout userRole="admin" /></ProtectedRoute>}>
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
          <Route path="pathways" element={<AdminPathways />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="/institution" element={<ProtectedRoute><DashboardLayout userRole="institution" /></ProtectedRoute>}>
          <Route index element={<InstitutionDashboard />} />
          <Route path="dashboard" element={<InstitutionDashboard />} />
          <Route path="portfolio-verification" element={<PortfolioVerification />} />
        </Route>

      </Routes>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
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
