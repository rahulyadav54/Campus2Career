import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/institution_service.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/state_views.dart';
import '../../../providers/auth_provider.dart';

class InstitutionHomeScreen extends StatefulWidget {
  const InstitutionHomeScreen({super.key});

  @override
  State<InstitutionHomeScreen> createState() => _InstitutionHomeScreenState();
}

class _InstitutionHomeScreenState extends State<InstitutionHomeScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<InstitutionService>().fetchDashboard();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Institution Dashboard')),
      body: RefreshIndicator(
        onRefresh: () async => setState(() => _future = context.read<InstitutionService>().fetchDashboard()),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load dashboard.',
                onRetry: () => setState(() => _future = context.read<InstitutionService>().fetchDashboard()),
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
                              Text(d['institutionName']?.toString() ?? 'Institution',
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
                    _stat('Students', d['totalStudents'] ?? 0, AppColors.primary),
                    const SizedBox(width: 8),
                    _stat('Placed', d['totalPlaced'] ?? 0, AppColors.accent),
                  ],
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.school, color: AppColors.primary),
                        title: const Text('Students'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/institution/students'),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.analytics, color: AppColors.primary),
                        title: const Text('Analytics'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/institution/analytics'),
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
