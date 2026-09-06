import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_constants.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _decide());
  }

  Future<void> _decide() async {
    final auth = context.read<AuthProvider>();
    final started = DateTime.now();
    while (auth.status == AuthStatus.unknown &&
        DateTime.now().difference(started) < const Duration(seconds: 8)) {
      await Future.delayed(const Duration(milliseconds: 80));
      if (!mounted) return;
    }
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    if (auth.isAuthed) {
      context.go('/home');
      return;
    }
    final seen = await SecureStorageService().readString(SecureStorageKeys.onboardingSeen);
    if (!mounted) return;
    context.go(seen == '1' ? '/login' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.all(10),
                child: Image.asset(
                  'assets/images/app_icon.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(Icons.school, color: AppColors.primary, size: 48),
                ),
              ),
              const SizedBox(height: 18),
              const Text(AppConstants.appName,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.3)),
              const SizedBox(height: 6),
              const Text(AppConstants.tagline,
                  style: TextStyle(color: Colors.white70, fontSize: 13, letterSpacing: 0.4)),
              const SizedBox(height: 36),
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
