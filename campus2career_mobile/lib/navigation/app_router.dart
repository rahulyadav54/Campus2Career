import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../features/about/about_screen.dart';
import '../features/academician/academician_applications_screen.dart';
import '../features/academician/academician_home_screen.dart';
import '../features/academician/academician_opportunities_screen.dart';
import '../features/academician/academician_opportunity_detail_screen.dart';
import '../features/academician/mentorship_programs_screen.dart';
import '../features/assessments/assessment_attempt_screen.dart';
import '../features/assessments/assessments_screen.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/auth/home_shell.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/onboarding_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/splash_screen.dart';
import '../features/institution/institution_analytics_screen.dart';
import '../features/institution/institution_home_screen.dart';
import '../features/institution/institution_students_screen.dart';
import '../features/mentor/mentor_home_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/portfolio/portfolio_screen.dart';
import '../features/recruiter/candidates_screen.dart';
import '../features/recruiter/post_job_screen.dart';
import '../features/recruiter/recruiter_analytics_screen.dart';
import '../features/recruiter/recruiter_applications_screen.dart';
import '../features/recruiter/recruiter_home_screen.dart';
import '../features/recruiter/recruiter_jobs_screen.dart';
import '../features/recruiter/recruiter_students_screen.dart';
import '../features/student/applications_screen.dart';
import '../features/student/aptitude_tests_screen.dart';
import '../features/student/announcements_screen.dart';
import '../features/student/career_guidance_screen.dart';
import '../features/student/certificates_screen.dart';
import '../features/student/collaboration_catalog_screen.dart';
import '../features/student/course_detail_screen.dart';
import '../features/student/internships_screen.dart';
import '../features/student/job_recommendations_screen.dart';
import '../features/student/career_advisor_screen.dart';
import '../features/student/interview_prep_screen.dart';
import '../features/student/job_detail_screen.dart';
import '../features/student/jobs_screen.dart';
import '../features/student/learning_platforms_screen.dart';
import '../features/student/my_collaborations_screen.dart';
import '../features/student/resume_import_screen.dart';
import '../features/student/resume_center/resume_builder_screen.dart';
import '../features/student/resume_center/resume_center_screen.dart';
import '../features/student/resume_center/resume_insights_screen.dart';
import '../features/student/virtual_interview/virtual_interview_live_screen.dart';
import '../features/student/virtual_interview/virtual_interview_report_screen.dart';
import '../features/student/virtual_interview/virtual_interview_setup_screen.dart';
import '../features/student/learning_screen.dart';
import '../features/student/my_courses_screen.dart';
import '../features/student/my_learning_screen.dart';
import '../features/student/opportunity_hub_screen.dart';
import '../features/student/profile_screen.dart';
import '../features/student/skill_mapping_screen.dart';
import '../features/student/student_courses_screen.dart';
import '../features/student/student_home_screen.dart';
import '../features/student/workshops_screen.dart';
import '../navigation/app_navigator.dart';
import '../providers/auth_provider.dart';

GoRouter buildRouter(AuthProvider auth) {
  return GoRouter(
    navigatorKey: appNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: auth,
    redirect: (context, state) {
      final loc = state.matchedLocation;
      if (auth.status == AuthStatus.unknown) {
        return loc == '/splash' ? null : '/splash';
      }
      final loggedIn = auth.isAuthed;
      if (loc == '/splash') {
        return null;
      }
      const publicRoutes = ['/login', '/register', '/onboarding', '/splash', '/forgot-password'];
      if (!loggedIn && !publicRoutes.contains(loc)) return '/login';
      if (loggedIn && (loc == '/login' || loc == '/register' || loc == '/forgot-password' || loc == '/onboarding')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const _RoleHome()),
          GoRoute(path: '/jobs', builder: (_, __) => const JobsScreen()),
          GoRoute(path: '/internships', builder: (_, __) => const InternshipsScreen()),
          GoRoute(path: '/learning', builder: (_, __) => const LearningScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),

          GoRoute(path: '/recruiter/jobs', builder: (_, __) => const RecruiterJobsScreen()),
          GoRoute(path: '/recruiter/jobs/post', builder: (_, __) => const PostJobScreen()),
          GoRoute(path: '/recruiter/internships', builder: (_, __) => const RecruiterJobsScreen()),
          GoRoute(path: '/recruiter/candidates', builder: (_, __) => const CandidatesScreen()),
          GoRoute(path: '/recruiter/applications', builder: (_, __) => const RecruiterApplicationsScreen()),
          GoRoute(path: '/recruiter/students', builder: (_, __) => const RecruiterStudentsScreen()),
          GoRoute(path: '/recruiter/analytics', builder: (_, __) => const RecruiterAnalyticsScreen()),
          GoRoute(path: '/mentor/mentees', builder: (_, __) => const MentorHomeScreen()),
          GoRoute(path: '/mentor/approvals', builder: (_, __) => const MentorHomeScreen()),

          GoRoute(path: '/academician/opportunities', builder: (_, __) => const AcademicianOpportunitiesScreen()),
          GoRoute(path: '/academician/mentorship', builder: (_, __) => const MentorshipProgramsScreen()),
          GoRoute(path: '/academician/applications', builder: (_, __) => const AcademicianApplicationsScreen()),

          GoRoute(path: '/institution/students', builder: (_, __) => const InstitutionStudentsScreen()),
          GoRoute(path: '/institution/analytics', builder: (_, __) => const InstitutionAnalyticsScreen()),
        ],
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (_, state) => JobDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: '/internships/:id', builder: (_, state) => JobDetailScreen(id: state.pathParameters['id']!)),
      GoRoute(path: '/recruiter/jobs/:id', builder: (_, __) => const RecruiterJobsScreen()),
      GoRoute(
        path: '/academician/opportunities/:id',
        builder: (_, state) => AcademicianOpportunityDetailScreen(
          id: state.pathParameters['id']!,
        ),
      ),
      GoRoute(path: '/applications', builder: (_, __) => const ApplicationsScreen()),
      GoRoute(path: '/my-learning', builder: (_, __) => const MyLearningScreen()),
      GoRoute(path: '/certificates', builder: (_, __) => const CertificatesScreen()),
      GoRoute(path: '/skill-mapping', builder: (_, __) => const SkillMappingScreen()),
      GoRoute(path: '/portfolio', builder: (_, __) => const PortfolioScreen()),
      GoRoute(path: '/aptitude-tests', builder: (_, __) => const AptitudeTestsScreen()),
      GoRoute(
        path: '/aptitude-tests/:id',
        builder: (_, state) => AssessmentAttemptScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: '/assessments', builder: (_, __) => const AssessmentsScreen()),
      GoRoute(
        path: '/assessments/:id',
        builder: (_, state) => AssessmentAttemptScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
      GoRoute(path: '/career-advisor', builder: (_, __) => const CareerAdvisorScreen()),
      GoRoute(path: '/interview-prep', builder: (_, __) => const InterviewPrepScreen()),
      GoRoute(path: '/resume-import', builder: (_, __) => const ResumeImportScreen()),
      GoRoute(path: '/resume-center', builder: (_, __) => const ResumeCenterScreen()),
      GoRoute(
        path: '/resume-center/builder/:id',
        builder: (_, state) => ResumeBuilderScreen(resumeId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/resume-center/insights',
        builder: (_, state) => ResumeInsightsScreen(initialTab: state.uri.queryParameters['tab'] ?? 'jobs'),
      ),
      GoRoute(
        path: '/virtual-interview',
        builder: (_, state) => VirtualInterviewSetupScreen(
          initialExtra: state.extra is Map ? Map<String, dynamic>.from(state.extra as Map) : null,
        ),
      ),
      GoRoute(
        path: '/virtual-interview/:sessionId/live',
        builder: (_, state) => VirtualInterviewLiveScreen(sessionId: state.pathParameters['sessionId']!),
      ),
      GoRoute(
        path: '/virtual-interview/:sessionId/report',
        builder: (_, state) => VirtualInterviewReportScreen(sessionId: state.pathParameters['sessionId']!),
      ),
      GoRoute(path: '/recommendations', builder: (_, __) => const JobRecommendationsScreen()),
      GoRoute(path: '/announcements', builder: (_, __) => const AnnouncementsScreen()),
      GoRoute(path: '/opportunities', builder: (_, __) => const OpportunityHubScreen()),
      GoRoute(path: '/career', builder: (_, __) => const CareerGuidanceScreen()),
      GoRoute(path: '/courses', builder: (_, __) => const StudentCoursesScreen()),
      GoRoute(path: '/my-courses', builder: (_, __) => const MyCoursesScreen()),
      GoRoute(path: '/learning-platforms', builder: (_, __) => const LearningPlatformsScreen()),
      GoRoute(path: '/workshops', builder: (_, __) => const WorkshopsScreen()),
      GoRoute(
        path: '/challenges',
        builder: (_, __) => const CollaborationCatalogScreen(
          title: 'Innovation challenges',
          type: 'challenges',
          icon: Icons.emoji_events_outlined,
        ),
      ),
      GoRoute(
        path: '/projects',
        builder: (_, __) => const CollaborationCatalogScreen(
          title: 'Live industry projects',
          type: 'projects',
          icon: Icons.precision_manufacturing_outlined,
        ),
      ),
      GoRoute(path: '/collaborations', builder: (_, __) => const MyCollaborationsScreen()),
      GoRoute(
        path: '/courses/:id',
        builder: (_, state) => CourseDetailScreen(id: state.pathParameters['id']!),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      appBar: AppBar(title: const Text('Not found')),
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
}

class _RoleHome extends StatelessWidget {
  const _RoleHome();

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().role;
    switch (role) {
      case 'recruiter':
        return const RecruiterHomeScreen();
      case 'academician':
        return const AcademicianHomeScreen();
      case 'institution':
        return const InstitutionHomeScreen();
      case 'mentor':
        return const MentorHomeScreen();
      case 'student':
      default:
        return const StudentHomeScreen();
    }
  }
}
