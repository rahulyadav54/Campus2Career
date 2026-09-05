import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/academician_service.dart';
import '../../../widgets/state_views.dart';

class MentorshipProgramsScreen extends StatelessWidget {
  const MentorshipProgramsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mentorship Programs')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: context.read<AcademicianService>().fetchMentorshipPrograms(),
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) return const ErrorStateView(message: 'Could not load.');
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(
                icon: Icons.handshake_outlined, title: 'No programs yet', message: 'Mentorship programs will appear here.');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final p = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.handshake, color: AppColors.primary),
                  title: Text(p['title']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(p['description']?.toString() ?? '',
                      maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
