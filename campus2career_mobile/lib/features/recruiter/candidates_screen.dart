import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/recruiter_service.dart';
import '../../../widgets/state_views.dart';

class CandidatesScreen extends StatefulWidget {
  const CandidatesScreen({super.key});

  @override
  State<CandidatesScreen> createState() => _CandidatesScreenState();
}

class _CandidatesScreenState extends State<CandidatesScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<RecruiterService>().fetchDashboard();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Candidates')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'Could not load candidates.',
                onRetry: () => setState(() => _future = context.read<RecruiterService>().fetchDashboard()));
          }
          final list = List<Map<String, dynamic>>.from(snap.data?['recentCandidates'] ?? const []);
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.people_outline,
              title: 'No candidates yet',
              message: 'Candidates will appear here when they apply to your jobs.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final c = list[i];
              return Card(
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: Text(c['name']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(c['email']?.toString() ?? '—',
                      style: const TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
