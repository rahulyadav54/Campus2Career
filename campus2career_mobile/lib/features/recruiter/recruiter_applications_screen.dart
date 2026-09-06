import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/recruiter_service.dart';
import '../../../widgets/state_views.dart';

class RecruiterApplicationsScreen extends StatefulWidget {
  const RecruiterApplicationsScreen({super.key});

  @override
  State<RecruiterApplicationsScreen> createState() => _RecruiterApplicationsScreenState();
}

class _RecruiterApplicationsScreenState extends State<RecruiterApplicationsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<RecruiterService>().fetchApplications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Applications')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = context.read<RecruiterService>().fetchApplications());
        },
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load applications.',
                onRetry: () =>
                    setState(() => _future = context.read<RecruiterService>().fetchApplications()),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.folder_open,
                title: 'No applications yet',
                message: 'Students who apply to your jobs will show up here.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final a = list[i];
                final student = a['student'] is Map ? Map<String, dynamic>.from(a['student']) : {};
                final job = a['job'] is Map ? Map<String, dynamic>.from(a['job']) : {};
                return Card(
                  child: ListTile(
                    title: Text(
                      (student['name'] ?? a['name'] ?? 'Applicant').toString(),
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      '${job['title'] ?? a['jobTitle'] ?? 'Role'} • ${a['status'] ?? 'applied'}',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
