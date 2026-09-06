import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import 'cached_avatar.dart';
import 'sign_out_action.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final role = user?.role ?? 'student';
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  CachedAvatar(name: user?.name, url: user?.avatar, size: 48),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'Campus2Career',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        Text(user?.email ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: _itemsFor(role).expand((g) {
                  return [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                      child: Text(g.title,
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textMuted,
                              letterSpacing: 0.6)),
                    ),
                    ...g.items.map((it) => ListTile(
                          dense: true,
                          leading: Icon(it.icon, color: AppColors.primary, size: 20),
                          title: Text(it.label, style: const TextStyle(fontSize: 14)),
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push(it.route);
                          },
                        )),
                  ];
                }).toList(),
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.danger),
              title: const Text('Sign out'),
              onTap: () {
                Navigator.of(context).pop();
                signOut(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  List<_Group> _itemsFor(String role) {
    if (role == 'recruiter') {
      return const [
        _Group('Overview', [_Item('Dashboard', Icons.dashboard_outlined, '/home')]),
        _Group('Hiring', [
          _Item('My jobs', Icons.work_outline, '/recruiter/jobs'),
          _Item('Post a job', Icons.add_box_outlined, '/recruiter/jobs/post'),
          _Item('Applications', Icons.folder_open, '/recruiter/applications'),
          _Item('Students', Icons.people_outline, '/recruiter/students'),
          _Item('Candidates', Icons.badge_outlined, '/recruiter/candidates'),
          _Item('Analytics', Icons.analytics_outlined, '/recruiter/analytics'),
        ]),
        _Group('Account', [
          _Item('Profile', Icons.person_outline, '/profile'),
          _Item('Announcements', Icons.campaign_outlined, '/announcements'),
          _Item('Notifications', Icons.notifications_outlined, '/notifications'),
        ]),
      ];
    }
    if (role == 'academician') {
      return const [
        _Group('Academia', [
          _Item('Dashboard', Icons.dashboard_outlined, '/home'),
          _Item('Opportunities', Icons.assignment_outlined, '/academician/opportunities'),
          _Item('Applications', Icons.folder_open, '/academician/applications'),
          _Item('Mentorship', Icons.handshake_outlined, '/academician/mentorship'),
          _Item('Notifications', Icons.notifications_outlined, '/notifications'),
          _Item('Profile', Icons.person_outline, '/profile'),
        ]),
      ];
    }
    if (role == 'mentor') {
      return const [
        _Group('Mentoring', [
          _Item('Dashboard', Icons.dashboard_outlined, '/home'),
          _Item('Mentees', Icons.people_outline, '/mentor/mentees'),
          _Item('Approvals', Icons.verified_outlined, '/mentor/approvals'),
          _Item('Notifications', Icons.notifications_outlined, '/notifications'),
          _Item('Profile', Icons.person_outline, '/profile'),
        ]),
      ];
    }
    if (role == 'institution') {
      return const [
        _Group('Institution', [
          _Item('Dashboard', Icons.dashboard_outlined, '/home'),
          _Item('Students', Icons.people_outline, '/institution/students'),
          _Item('Analytics', Icons.analytics_outlined, '/institution/analytics'),
          _Item('Notifications', Icons.notifications_outlined, '/notifications'),
          _Item('Profile', Icons.person_outline, '/profile'),
        ]),
      ];
    }
    return const [
      _Group('Overview', [
        _Item('Dashboard', Icons.dashboard_outlined, '/home'),
        _Item('My profile', Icons.person_outline, '/profile'),
      ]),
      _Group('Career', [
        _Item('Job openings', Icons.work_outline, '/jobs'),
        _Item('Job recommendations', Icons.star_outline, '/recommendations'),
        _Item('My applications', Icons.folder_open, '/applications'),
        _Item('Career guidance', Icons.account_tree_outlined, '/career'),
        _Item('Skill mapping', Icons.trending_up, '/skill-mapping'),
        _Item('Interview preparation', Icons.record_voice_over_outlined, '/interview-prep'),
        _Item('AI career advisor', Icons.auto_awesome, '/career-advisor'),
        _Item('Import resume', Icons.upload_file, '/resume-import'),
      ]),
      _Group('Learning', [
        _Item('My courses', Icons.book_outlined, '/my-courses'),
        _Item('Explore courses', Icons.school_outlined, '/courses'),
        _Item('Learning hub', Icons.menu_book_outlined, '/learning'),
        _Item('Learning platforms', Icons.public, '/learning-platforms'),
        _Item('Skill assessment', Icons.assignment_turned_in, '/assessments'),
        _Item('Aptitude tests', Icons.psychology_outlined, '/aptitude-tests'),
        _Item('Certificates', Icons.workspace_premium_outlined, '/certificates'),
        _Item('Digital portfolio', Icons.folder_shared_outlined, '/portfolio'),
      ]),
      _Group('Community', [
        _Item('Announcements', Icons.campaign_outlined, '/announcements'),
        _Item('Notifications', Icons.notifications_outlined, '/notifications'),
        _Item('Internships', Icons.school_outlined, '/internships'),
        _Item('Workshops & lectures', Icons.cast_for_education, '/workshops'),
        _Item('Innovation challenges', Icons.emoji_events_outlined, '/challenges'),
        _Item('Live industry projects', Icons.precision_manufacturing_outlined, '/projects'),
        _Item('Collaborations', Icons.groups_outlined, '/collaborations'),
        _Item('Opportunity hub', Icons.explore_outlined, '/opportunities'),
        _Item('About', Icons.info_outline, '/about'),
      ]),
    ];
  }
}

class _Group {
  final String title;
  final List<_Item> items;
  const _Group(this.title, this.items);
}

class _Item {
  final String label;
  final IconData icon;
  final String route;
  const _Item(this.label, this.icon, this.route);
}

class ShellMenuButton extends StatelessWidget {
  const ShellMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Menu',
      icon: const Icon(Icons.menu),
      onPressed: () {
        final open = HomeShellScope.maybeOf(context)?.openDrawer;
        if (open != null) {
          open();
          return;
        }
        Scaffold.maybeOf(context)?.openDrawer();
      },
    );
  }
}

class HomeShellScope extends InheritedWidget {
  final VoidCallback openDrawer;
  const HomeShellScope({super.key, required this.openDrawer, required super.child});

  static HomeShellScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HomeShellScope>();

  @override
  bool updateShouldNotify(HomeShellScope oldWidget) => false;
}
