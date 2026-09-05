import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class AptitudeTestsScreen extends StatefulWidget {
  const AptitudeTestsScreen({super.key});

  @override
  State<AptitudeTestsScreen> createState() => _AptitudeTestsScreenState();
}

class _AptitudeTestsScreenState extends State<AptitudeTestsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final api = context.read<StudentService>();
    return api.fetchAptitudeTests();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Aptitude Tests')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.psychology_outlined,
              title: 'No tests available',
              message: 'New aptitude tests will appear here when published.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final t = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.psychology, color: AppColors.primary),
                  title: Text(t['title']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('${t['category'] ?? "—"} • ${t['duration'] ?? "—"} min',
                      style: const TextStyle(fontSize: 12)),
                  trailing: ElevatedButton(
                    onPressed: () => context.push('/aptitude-tests/${t['_id']}'),
                    child: const Text('Start'),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
