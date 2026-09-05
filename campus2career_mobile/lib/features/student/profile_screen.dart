import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/state_views.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will need to sign in again to use the app.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true), child: const Text('Sign out')),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await context.read<AuthProvider>().logout();
      if (context.mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: () => _logout(context)),
        ],
      ),
      body: user == null
          ? const EmptyState(icon: Icons.person_outline, title: 'Not signed in')
          : RefreshIndicator(
              onRefresh: () async => context.read<AuthProvider>().bootstrap(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CachedAvatar(name: user.name, url: user.avatar, size: 64),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(user.name,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                                const SizedBox(height: 4),
                                Text(user.email,
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.10),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(user.role.toUpperCase(),
                                      style: const TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _menu(context, [
                    if (user.isStudent) ...[
                      _Tile('Skill Assessment', Icons.assignment_turned_in, '/assessments'),
                      _Tile('Skill Mapping', Icons.trending_up, '/skill-mapping'),
                      _Tile('Applications', Icons.folder_open, '/applications'),
                      _Tile('My Learning', Icons.menu_book, '/my-learning'),
                      _Tile('My Courses', Icons.book_outlined, '/my-courses'),
                      _Tile('Courses', Icons.school_outlined, '/courses'),
                      _Tile('Certificates', Icons.workspace_premium, '/certificates'),
                      _Tile('Portfolio', Icons.folder_shared, '/portfolio'),
                      _Tile('Aptitude Tests', Icons.psychology, '/aptitude-tests'),
                      _Tile('Job Recommendations', Icons.star, '/recommendations'),
                      _Tile('Opportunity Hub', Icons.explore_outlined, '/opportunities'),
                      _Tile('Career Guidance', Icons.account_tree_outlined, '/career'),
                      _Tile('Announcements', Icons.campaign_outlined, '/announcements'),
                    ],
                    if (user.isRecruiter) ...[
                      _Tile('Manage Jobs', Icons.work, '/recruiter/jobs'),
                      _Tile('Internships', Icons.school, '/recruiter/internships'),
                      _Tile('Candidates', Icons.people, '/recruiter/candidates'),
                      _Tile('Analytics', Icons.analytics, '/recruiter/analytics'),
                    ],
                    if (user.isAcademician) ...[
                      _Tile('Opportunities', Icons.assignment, '/academician/opportunities'),
                      _Tile('My Applications', Icons.folder_open, '/academician/applications'),
                      _Tile('Mentorship', Icons.handshake, '/academician/mentorship'),
                    ],
                    if (user.isInstitution) ...[
                      _Tile('Students', Icons.school, '/institution/students'),
                      _Tile('Analytics', Icons.analytics, '/institution/analytics'),
                    ],
                    _Tile('Notifications', Icons.notifications_outlined, '/notifications'),
                    _Tile('About', Icons.info_outline, '/about'),
                  ]),
                ],
              ),
            ),
    );
  }

  Widget _menu(BuildContext context, List<_Tile> tiles) {
    return Card(
      child: Column(
        children: [
          for (var i = 0; i < tiles.length; i++) ...[
            ListTile(
              leading: Icon(tiles[i].icon, color: AppColors.primary, size: 20),
              title: Text(tiles[i].title),
              trailing: const Icon(Icons.chevron_right, size: 18),
              onTap: () => context.push(tiles[i].route),
            ),
            if (i < tiles.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

class _Tile {
  final String title;
  final IconData icon;
  final String route;
  _Tile(this.title, this.icon, this.route);
}
