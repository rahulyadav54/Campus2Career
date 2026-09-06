import 'dart:async';

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

Future<void> main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    try {
      await Environment.setPreferredOrientations();
    } catch (e, st) {
      debugPrint('Orientation setup failed: $e\n$st');
    }
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      debugPrint('FlutterError: ${details.exception}\n${details.stack}');
    };
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
  late final dynamic _router;

  @override
  void initState() {
    super.initState();
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
    _router = buildRouter(_authProvider);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiHelper>.value(value: _apiHelper),
        Provider<AuthService>.value(value: _authService),
        Provider<StudentService>.value(value: _studentService),
        Provider<AiService>.value(value: _aiService),
        Provider<RecruiterService>.value(value: _recruiterService),
        Provider<AcademicianService>.value(value: _academicianService),
        Provider<InstitutionService>.value(value: _institutionService),
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
