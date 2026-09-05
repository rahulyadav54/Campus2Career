import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/recruiter_service.dart';
import '../../../widgets/state_views.dart';

class RecruiterAnalyticsScreen extends StatefulWidget {
  const RecruiterAnalyticsScreen({super.key});

  @override
  State<RecruiterAnalyticsScreen> createState() => _RecruiterAnalyticsScreenState();
}

class _RecruiterAnalyticsScreenState extends State<RecruiterAnalyticsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<RecruiterService>().fetchAnalytics();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recruitment Analytics')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'No data available yet.',
                onRetry: () => setState(() => _future = context.read<RecruiterService>().fetchAnalytics()));
          }
          final d = snap.data ?? {};
          if (d.isEmpty) {
            return const EmptyState(
              icon: Icons.analytics_outlined,
              title: 'No data available yet',
              message: 'Analytics will appear once candidates start applying.',
            );
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
                      const Text('Recruitment summary',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      _row('Total applications', d['totalApplications']),
                      _row('Shortlisted', d['shortlisted']),
                      _row('Selected', d['selected']),
                      _row('Rejected', d['rejected']),
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

  Widget _row(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: AppColors.textSecondary))),
          Text(value?.toString() ?? '0',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
