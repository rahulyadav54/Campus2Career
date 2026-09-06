import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/recruiter_service.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/state_views.dart';

class RecruiterStudentsScreen extends StatefulWidget {
  const RecruiterStudentsScreen({super.key});

  @override
  State<RecruiterStudentsScreen> createState() => _RecruiterStudentsScreenState();
}

class _RecruiterStudentsScreenState extends State<RecruiterStudentsScreen> {
  final _search = TextEditingController();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<RecruiterService>().fetchStudents();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Students')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                hintText: 'Search students',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
              onSubmitted: (v) =>
                  setState(() => _future = context.read<RecruiterService>().fetchStudents(search: v)),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState != ConnectionState.done) return const LoadingList();
                if (snap.hasError) {
                  return ErrorStateView(
                    message: 'Could not load students.',
                    onRetry: () =>
                        setState(() => _future = context.read<RecruiterService>().fetchStudents()),
                  );
                }
                final list = snap.data ?? [];
                if (list.isEmpty) {
                  return const EmptyState(
                    icon: Icons.people_outline,
                    title: 'No students found',
                    message: 'Approved student profiles will appear here.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final s = list[i];
                    return Card(
                      child: ListTile(
                        leading: CachedAvatar(name: s['name']?.toString(), size: 42),
                        title: Text((s['name'] ?? 'Student').toString(),
                            style: const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text(
                          '${s['department'] ?? ''} • CGPA ${s['cgpa'] ?? '—'}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
