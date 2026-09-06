import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/learning_resource.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';
import 'package:url_launcher/url_launcher.dart';

class LearningPlatformsScreen extends StatefulWidget {
  const LearningPlatformsScreen({super.key});

  @override
  State<LearningPlatformsScreen> createState() => _LearningPlatformsScreenState();
}

class _LearningPlatformsScreenState extends State<LearningPlatformsScreen> {
  late Future<List<LearningResource>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchLearningPlatforms();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Learning platforms')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = context.read<StudentService>().fetchLearningPlatforms());
        },
        child: FutureBuilder<List<LearningResource>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load platforms.',
                onRetry: () => setState(
                  () => _future = context.read<StudentService>().fetchLearningPlatforms(),
                ),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.public_outlined,
                title: 'No platforms listed',
                message: 'Platforms connected by your institution will appear here.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final r = list[i];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(14),
                    leading: CircleAvatar(
                      backgroundColor: AppColors.secondary.withValues(alpha: 0.12),
                      child: const Icon(Icons.public, color: AppColors.secondary),
                    ),
                    title: Text(r.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Text(
                      [r.provider, r.category, r.free ? 'Free' : null]
                          .where((e) => e != null && e.toString().isNotEmpty)
                          .join(' • '),
                    ),
                    trailing: const Icon(Icons.open_in_new, size: 18),
                    onTap: () async {
                      if (r.url == null || r.url!.isEmpty) return;
                      final uri = Uri.tryParse(r.url!);
                      if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
                    },
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
