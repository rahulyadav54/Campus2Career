import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/institution_service.dart';
import '../../../widgets/state_views.dart';

class InstitutionStudentsScreen extends StatefulWidget {
  const InstitutionStudentsScreen({super.key});

  @override
  State<InstitutionStudentsScreen> createState() => _InstitutionStudentsScreenState();
}

class _InstitutionStudentsScreenState extends State<InstitutionStudentsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<InstitutionService>().fetchStudents();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Students')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'No data available yet.',
                onRetry: () => setState(() => _future = context.read<InstitutionService>().fetchStudents()));
          }
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(icon: Icons.school_outlined, title: 'No students yet', message: 'No data available yet.');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final s = list[i];
              return Card(
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: Text(s['name']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(s['email']?.toString() ?? '—',
                      style: const TextStyle(fontSize: 12)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
