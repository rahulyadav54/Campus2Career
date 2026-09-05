import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/academician_service.dart';
import '../../../widgets/state_views.dart';

class AcademicianOpportunitiesScreen extends StatefulWidget {
  const AcademicianOpportunitiesScreen({super.key});

  @override
  State<AcademicianOpportunitiesScreen> createState() => _AcademicianOpportunitiesScreenState();
}

class _AcademicianOpportunitiesScreenState extends State<AcademicianOpportunitiesScreen> {
  late Future<List<Map<String, dynamic>>> _future;
  String? _type;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    return context.read<AcademicianService>().fetchOpportunities(type: _type);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Opportunities'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(54),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                _chip('All', null),
                _chip('FDPs', 'fdp'),
                _chip('Faculty Internships', 'faculty-internship'),
                _chip('Consultancy', 'consultancy'),
                _chip('Research', 'research'),
              ],
            ),
          ),
        ),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'Could not load opportunities.',
                onRetry: () => setState(() => _future = _load()));
          }
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.assignment_outlined,
              title: 'No opportunities yet',
              message: 'New opportunities will appear here when posted.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = _load()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final o = list[i];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.assignment, color: AppColors.primary),
                    title: Text(o['title']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                        '${(o['type'] ?? "—").toString()} • ${o['organization'] ?? o['company'] ?? "—"}',
                        style: const TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/academician/opportunities/${o['_id']}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _chip(String label, String? value) {
    final selected = _type == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => setState(() {
          _type = value;
          _future = _load();
        }),
      ),
    );
  }
}
