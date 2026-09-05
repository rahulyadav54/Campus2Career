import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/academician_service.dart';
import '../../../widgets/state_views.dart';

class AcademicianApplicationsScreen extends StatelessWidget {
  const AcademicianApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final future = context.read<AcademicianService>().fetchMyApplications();
    return Scaffold(
      appBar: AppBar(title: const Text('My Applications')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) return const ErrorStateView(message: 'Could not load.');
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(
                icon: Icons.folder_open, title: 'No applications yet', message: 'Apply to opportunities to see them here.');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final a = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.assignment, color: AppColors.primary),
                  title: Text(a['opportunity']?['title']?.toString() ?? a['title']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(a['status']?.toString() ?? '—',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
