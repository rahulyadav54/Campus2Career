import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/job.dart';
import '../../../services/recruiter_service.dart';
import '../../../widgets/state_views.dart';

class RecruiterJobsScreen extends StatefulWidget {
  const RecruiterJobsScreen({super.key});

  @override
  State<RecruiterJobsScreen> createState() => _RecruiterJobsScreenState();
}

class _RecruiterJobsScreenState extends State<RecruiterJobsScreen> {
  late Future<List<Job>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<RecruiterService>().fetchMyJobs();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Jobs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/recruiter/jobs/post'),
          ),
        ],
      ),
      body: FutureBuilder<List<Job>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
              message: 'Could not load jobs.',
              onRetry: () => setState(() => _future = context.read<RecruiterService>().fetchMyJobs()),
            );
          }
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.work_outline,
              title: 'No jobs posted',
              message: 'Tap + to post your first job.',
              action: ElevatedButton.icon(
                onPressed: () => context.push('/recruiter/jobs/post'),
                icon: const Icon(Icons.add),
                label: const Text('Post a job'),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = context.read<RecruiterService>().fetchMyJobs()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final j = list[i];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.work, color: AppColors.primary),
                    title: Text(j.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${j.location ?? "—"} • ${j.type ?? "—"}',
                        style: const TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/recruiter/jobs/${j.id}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
