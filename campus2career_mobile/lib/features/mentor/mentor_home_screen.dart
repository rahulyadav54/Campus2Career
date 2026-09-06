import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/sign_out_action.dart';

class MentorHomeScreen extends StatelessWidget {
  const MentorHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        leading: const ShellMenuButton(),
        title: const Text('Mentor dashboard'),
        actions: const [SignOutIconButton()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CachedAvatar(name: user?.name, size: 52),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'Mentor',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                        const Text('Guide internships, approvals, and mentee progress',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.people_outline, color: AppColors.primary),
                  title: const Text('Mentees'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/mentor/mentees'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.fact_check_outlined, color: AppColors.primary),
                  title: const Text('Approvals'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/mentor/approvals'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.school_outlined, color: AppColors.primary),
                  title: const Text('Internship progress'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/internships'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
