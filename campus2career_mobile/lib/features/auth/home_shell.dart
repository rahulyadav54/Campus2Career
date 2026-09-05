import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'package:flutter/services.dart';

class HomeShell extends StatefulWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  static const _studentNav = [
    _NavItem('Home', Icons.dashboard_outlined, Icons.dashboard, '/home'),
    _NavItem('Jobs', Icons.work_outline, Icons.work, '/jobs'),
    _NavItem('Internships', Icons.school_outlined, Icons.school, '/internships'),
    _NavItem('Learning', Icons.menu_book_outlined, Icons.menu_book, '/learning'),
    _NavItem('Profile', Icons.person_outline, Icons.person, '/profile'),
  ];

  static const _recruiterNav = [
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard, '/home'),
    _NavItem('Jobs', Icons.work_outline, Icons.work, '/recruiter/jobs'),
    _NavItem('Internships', Icons.school_outlined, Icons.school, '/recruiter/internships'),
    _NavItem('Candidates', Icons.people_outline, Icons.people, '/recruiter/candidates'),
    _NavItem('Profile', Icons.person_outline, Icons.person, '/profile'),
  ];

  static const _academicianNav = [
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard, '/home'),
    _NavItem('Opportunities', Icons.assignment_outlined, Icons.assignment, '/academician/opportunities'),
    _NavItem('Mentorship', Icons.handshake_outlined, Icons.handshake, '/academician/mentorship'),
    _NavItem('Applications', Icons.folder_open, Icons.folder, '/academician/applications'),
    _NavItem('Profile', Icons.person_outline, Icons.person, '/profile'),
  ];

  static const _institutionNav = [
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard, '/home'),
    _NavItem('Students', Icons.school_outlined, Icons.school, '/institution/students'),
    _NavItem('Analytics', Icons.analytics_outlined, Icons.analytics, '/institution/analytics'),
    _NavItem('Profile', Icons.person_outline, Icons.person, '/profile'),
  ];

  static const _mentorNav = [
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard, '/home'),
    _NavItem('Mentees', Icons.people_outline, Icons.people, '/mentor/mentees'),
    _NavItem('Profile', Icons.person_outline, Icons.person, '/profile'),
  ];

  List<_NavItem> _itemsFor(String role) {
    switch (role) {
      case 'recruiter':
        return _recruiterNav;
      case 'academician':
        return _academicianNav;
      case 'institution':
        return _institutionNav;
      case 'mentor':
        return _mentorNav;
      case 'student':
      default:
        return _studentNav;
    }
  }

  int _indexFromLocation(String location) {
    final items = _itemsFor(context.read<AuthProvider>().role);
    for (var i = 0; i < items.length; i++) {
      if (location.startsWith(items[i].route)) return i;
    }
    return 0;
  }

  Future<bool> _onWillPop() async {
    final router = GoRouter.of(context);
    final canPop = router.canPop();
    if (canPop) {
      router.pop();
      return false;
    }
    final exit = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Exit Campus2Career?'),
        content: const Text('Do you want to exit the app?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true), child: const Text('Exit')),
        ],
      ),
    );
    if (exit == true) {
      await SystemNavigator.pop();
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final items = _itemsFor(auth.role);
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexFromLocation(location);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _onWillPop();
      },
      child: Scaffold(
        body: widget.child,
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: BottomNavigationBar(
            currentIndex: index,
            onTap: (i) => context.go(items[i].route),
            items: items
                .map((n) => BottomNavigationBarItem(
                      icon: Icon(n.icon),
                      activeIcon: Icon(n.activeIcon),
                      label: n.label,
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String route;
  const _NavItem(this.label, this.icon, this.activeIcon, this.route);
}
