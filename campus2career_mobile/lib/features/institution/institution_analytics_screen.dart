import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/institution_service.dart';
import '../../../widgets/state_views.dart';

class InstitutionAnalyticsScreen extends StatefulWidget {
  const InstitutionAnalyticsScreen({super.key});

  @override
  State<InstitutionAnalyticsScreen> createState() => _InstitutionAnalyticsScreenState();
}

class _InstitutionAnalyticsScreenState extends State<InstitutionAnalyticsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = Future.wait<dynamic>([
      context.read<InstitutionService>().fetchAnalytics(),
      context.read<InstitutionService>().fetchPlacementReadiness(),
    ]).then((values) => {
          'analytics': values[0] as Map<String, dynamic>,
          'readiness': values[1] as Map<String, dynamic>,
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return const ErrorStateView(message: 'No data available yet.');
          }
          final d = snap.data ?? {};
          if (d.isEmpty) {
            return const EmptyState(icon: Icons.analytics_outlined, title: 'No data available yet');
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Skill demand',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      ...List<Map<String, dynamic>>.from(d['analytics']?['topSkills'] ?? const [])
                          .map((s) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 3),
                                child: Row(
                                  children: [
                                    Expanded(child: Text(s['name']?.toString() ?? '—')),
                                    Text(s['count']?.toString() ?? '0',
                                        style: const TextStyle(fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              )),
                      if ((d['analytics']?['topSkills'] as List?)?.isEmpty ?? true)
                        const Text('No data available yet.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Placement readiness',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      Text('Ready: ${d['readiness']?['ready'] ?? 0}',
                          style: const TextStyle(fontSize: 14)),
                      Text('In progress: ${d['readiness']?['inProgress'] ?? 0}',
                          style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
