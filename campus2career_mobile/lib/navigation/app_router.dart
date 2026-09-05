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
import '../features/auth/home_shell.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/splash_screen.dart';
import '../features/institution/institution_analytics_screen.dart';
import '../features/institution/institution_home_screen.dart';
import '../features/institution/institution_students_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/portfolio/portfolio_screen.dart';
import '../features/recruiter/candidates_screen.dart';
import '../features/recruiter/post_job_screen.dart';
import '../features/recruiter/recruiter_analytics_screen.dart';
import '../features/recruiter/recruiter_home_screen.dart';
import '../features/recruiter/recruiter_jobs_screen.dart';
import '../features/student/applications_screen.dart';
import '../features/student/aptitude_tests_screen.dart';
import '../features/student/announcements_screen.dart';
import '../features/student/career_guidance_screen.dart';
import '../features/student/certificates_screen.dart';
import '../features/student/course_detail_screen.dart';
import '../features/student/internships_screen.dart';
import '../features/student/job_recommendations_screen.dart';
import '../features/student/jobs_screen.dart';
import '../features/student/learning_screen.dart';
import '../features/student/my_courses_screen.dart';
import '../features/student/my_learning_screen.dart';
import '../features/student/opportunity_hub_screen.dart';
import '../features/student/profile_screen.dart';
import '../features/student/skill_mapping_screen.dart';
import '../features/student/student_courses_screen.dart';
import '../features/student/student_home_screen.dart';
import '../providers/auth_provider.dart';

GoRouter buildRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: auth,
    redirect: (context, state) {
      final loc = state.uri.toString();
      final loggedIn = auth.isAuthed;
      if (loc == '/splash') {
        if (auth.status == AuthStatus.unknown) return null;
        return loggedIn ? '/home' : '/login';
      }
      const publicRoutes = ['/login', '/register'];
      if (!loggedIn && !publicRoutes.contains(loc)) return '/login';
      if (loggedIn && publicRoutes.contains(loc)) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
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
          GoRoute(path: '/recruiter/analytics', builder: (_, __) => const RecruiterAnalyticsScreen()),

          GoRoute(path: '/academician/opportunities', builder: (_, __) => const AcademicianOpportunitiesScreen()),
          GoRoute(path: '/academician/mentorship', builder: (_, __) => const MentorshipProgramsScreen()),
          GoRoute(path: '/academician/applications', builder: (_, __) => const AcademicianApplicationsScreen()),

          GoRoute(path: '/institution/students', builder: (_, __) => const InstitutionStudentsScreen()),
          GoRoute(path: '/institution/analytics', builder: (_, __) => const InstitutionAnalyticsScreen()),
        ],
      ),
      GoRoute(path: '/jobs/:id', builder: (_, __) => const JobsScreen()),
      GoRoute(path: '/internships/:id', builder: (_, __) => const InternshipsScreen()),
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
      GoRoute(path: '/recommendations', builder: (_, __) => const JobRecommendationsScreen()),
      GoRoute(path: '/announcements', builder: (_, __) => const AnnouncementsScreen()),
      GoRoute(path: '/opportunities', builder: (_, __) => const OpportunityHubScreen()),
      GoRoute(path: '/career', builder: (_, __) => const CareerGuidanceScreen()),
      GoRoute(path: '/courses', builder: (_, __) => const StudentCoursesScreen()),
      GoRoute(path: '/my-courses', builder: (_, __) => const MyCoursesScreen()),
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
      case 'student':
      default:
        return const StudentHomeScreen();
    }
  }
}
