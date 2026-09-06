import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../core/theme/app_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingPage {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> colors;
  const _OnboardingPage({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.colors,
  });
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  static const _pages = [
    _OnboardingPage(
      title: 'Jobs that match you',
      subtitle: 'See internships and roles scored against your skills — not a copy of the website, just the openings that matter.',
      icon: Icons.work_rounded,
      colors: [Color(0xFF4F46E5), Color(0xFF818CF8)],
    ),
    _OnboardingPage(
      title: 'Learn. Prove. Grow.',
      subtitle: 'Courses, assessments, and certificates live in one place so you can close skill gaps before placement season.',
      icon: Icons.menu_book_rounded,
      colors: [Color(0xFF0EA5E9), Color(0xFF10B981)],
    ),
    _OnboardingPage(
      title: 'AI career coach',
      subtitle: 'Mock interviews, resume import, and personal guidance — on your phone, powered by the Campus2Career API.',
      icon: Icons.auto_awesome_rounded,
      colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
    ),
  ];

  Future<void> _finish() async {
    final storage = SecureStorageService();
    await storage.writeString(SecureStorageKeys.onboardingSeen, '1');
    if (!mounted) return;
    context.go('/login');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final last = _index == _pages.length - 1;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF8FAFC), Color(0xFFEEF2FF)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                child: Row(
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(left: 12),
                      child: Text(
                        'Campus2Career',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: _finish,
                      child: const Text('Skip'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) => _OnboardingSlide(page: _pages[i]),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_pages.length, (i) {
                  final active = i == _index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 8,
                    width: active ? 26 : 8,
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : const Color(0xFFC7D2FE),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    onPressed: () {
                      if (last) {
                        _finish();
                      } else {
                        _controller.nextPage(
                          duration: const Duration(milliseconds: 320),
                          curve: Curves.easeOutCubic,
                        );
                      }
                    },
                    child: Text(last ? 'Get started' : 'Next'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingSlide extends StatelessWidget {
  final _OnboardingPage page;
  const _OnboardingSlide({required this.page});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        children: [
          const Spacer(flex: 1),
          SizedBox(
            height: 260,
            width: 260,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(
                  top: 12,
                  right: 8,
                  child: _blob(90, page.colors.last.withValues(alpha: 0.18)),
                ),
                Positioned(
                  bottom: 8,
                  left: 4,
                  child: _blob(70, page.colors.first.withValues(alpha: 0.16)),
                ),
                Container(
                  width: 168,
                  height: 168,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: page.colors,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: page.colors.first.withValues(alpha: 0.35),
                        blurRadius: 32,
                        offset: const Offset(0, 16),
                      ),
                    ],
                  ),
                  child: Icon(page.icon, size: 78, color: Colors.white),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              height: 1.15,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              height: 1.5,
              color: AppColors.textSecondary,
            ),
          ),
          const Spacer(flex: 2),
        ],
      ),
    );
  }

  Widget _blob(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
