import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/academician_service.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/state_views.dart';
import '../../../providers/auth_provider.dart';

class AcademicianHomeScreen extends StatefulWidget {
  const AcademicianHomeScreen({super.key});

  @override
  State<AcademicianHomeScreen> createState() => _AcademicianHomeScreenState();
}

class _AcademicianHomeScreenState extends State<AcademicianHomeScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AcademicianService>().fetchDashboard();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Academician Dashboard')),
      body: RefreshIndicator(
        onRefresh: () async => setState(() => _future = context.read<AcademicianService>().fetchDashboard()),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load dashboard.',
                onRetry: () => setState(() => _future = context.read<AcademicianService>().fetchDashboard()),
              );
            }
            final d = snap.data ?? {};
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        CachedAvatar(name: user?.name, size: 48),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user?.name ?? '—',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                              Text(user?.email ?? '—',
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _stat('Applications', d['totalApplications'] ?? 0, AppColors.primary),
                    const SizedBox(width: 8),
                    _stat('Shortlisted', d['shortlisted'] ?? 0, AppColors.warning),
                  ],
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.assignment, color: AppColors.primary),
                        title: const Text('Browse opportunities'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/academician/opportunities'),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.folder_open, color: AppColors.primary),
                        title: const Text('My applications'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/academician/applications'),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.handshake, color: AppColors.primary),
                        title: const Text('Mentorship programs'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/academician/mentorship'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _stat(String label, dynamic value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value.toString(),
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
