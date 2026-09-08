import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_constants.dart';
import 'core/constants/environment.dart';
import 'core/network/api_client.dart';
import 'core/storage/secure_storage_service.dart';
import 'core/theme/app_theme.dart';
import 'navigation/app_router.dart';
import 'providers/auth_provider.dart';
import 'services/academician_service.dart';
import 'services/ai_service.dart';
import 'services/api_helper.dart';
import 'services/auth_service.dart';
import 'services/institution_service.dart';
import 'services/recruiter_service.dart';
import 'services/student_service.dart';
import 'services/interview_service.dart';
import 'services/resume_optimizer_service.dart';

Future<void> main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // Prevent Flutter framework errors from killing the process on OEM devices
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      debugPrint('FlutterError: ${details.exceptionAsString()}');
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      debugPrint('PlatformDispatcher error: $error\n$stack');
      return true; // mark handled so the app does not force-close
    };

    ErrorWidget.builder = (details) {
      return Material(
        color: Colors.white,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Color(0xFF4F46E5), size: 48),
                const SizedBox(height: 12),
                const Text(
                  'Something went wrong',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  details.exceptionAsString(),
                  maxLines: 6,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    };

    try {
      await Environment.setPreferredOrientations();
    } catch (e, st) {
      debugPrint('Orientation setup failed: $e\n$st');
    }

    runApp(const Campus2CareerApp());
  }, (error, stack) {
    debugPrint('Uncaught zone error: $error\n$stack');
  });
}

class Campus2CareerApp extends StatefulWidget {
  const Campus2CareerApp({super.key});

  @override
  State<Campus2CareerApp> createState() => _Campus2CareerAppState();
}

class _Campus2CareerAppState extends State<Campus2CareerApp> {
  late final SecureStorageService _storage;
  late final ApiClient _api;
  late final ApiHelper _apiHelper;
  late final AuthService _authService;
  late final AuthProvider _authProvider;
  late final StudentService _studentService;
  late final AiService _aiService;
  late final RecruiterService _recruiterService;
  late final AcademicianService _academicianService;
  late final InstitutionService _institutionService;
  late final ResumeOptimizerService _resumeOptimizerService;
  late final InterviewService _interviewService;
  late final dynamic _router;
  var _ready = false;
  Object? _bootError;

  @override
  void initState() {
    super.initState();
    _bootstrapApp();
  }

  Future<void> _bootstrapApp() async {
    try {
      _storage = SecureStorageService();
      _api = ApiClient.create(_storage);
      _apiHelper = ApiHelper(_api);
      _authService = AuthService(_apiHelper, _storage);
      _authProvider = AuthProvider(_authService, _storage);
      unawaited(_authProvider.bootstrap().catchError((e) {
        debugPrint('Bootstrap error: $e');
      }));
      _studentService = StudentService(_apiHelper);
      _aiService = AiService(_apiHelper);
      _recruiterService = RecruiterService(_apiHelper);
      _academicianService = AcademicianService(_apiHelper);
      _institutionService = InstitutionService(_apiHelper);
      _resumeOptimizerService = ResumeOptimizerService(_apiHelper);
      _interviewService = InterviewService(_apiHelper);
      _router = buildRouter(_authProvider);
      if (mounted) setState(() => _ready = true);
    } catch (e, st) {
      debugPrint('App bootstrap failed: $e\n$st');
      if (mounted) setState(() => _bootError = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_bootError != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Campus2Career failed to start.\n\n$_bootError',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      );
    }

    if (!_ready) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Color(0xFF4F46E5),
          body: Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
      );
    }

    return MultiProvider(
      providers: [
        Provider<ApiHelper>.value(value: _apiHelper),
        Provider<AuthService>.value(value: _authService),
        Provider<StudentService>.value(value: _studentService),
        Provider<AiService>.value(value: _aiService),
        Provider<RecruiterService>.value(value: _recruiterService),
        Provider<AcademicianService>.value(value: _academicianService),
        Provider<InstitutionService>.value(value: _institutionService),
        Provider<ResumeOptimizerService>.value(value: _resumeOptimizerService),
        Provider<InterviewService>.value(value: _interviewService),
        ChangeNotifierProvider<AuthProvider>.value(value: _authProvider),
      ],
      child: MaterialApp.router(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.light(),
        themeMode: ThemeMode.light,
        routerConfig: _router,
      ),
    );
  }
}
