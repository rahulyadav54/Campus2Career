import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/academician_service.dart';
import '../../../widgets/state_views.dart';

class AcademicianOpportunityDetailScreen extends StatefulWidget {
  final String id;
  const AcademicianOpportunityDetailScreen({super.key, required this.id});

  @override
  State<AcademicianOpportunityDetailScreen> createState() => _AcademicianOpportunityDetailScreenState();
}

class _AcademicianOpportunityDetailScreenState extends State<AcademicianOpportunityDetailScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AcademicianService>().fetchOpportunityDetail(widget.id);
  }

  Future<void> _apply() async {
    try {
      await context.read<AcademicianService>().applyToOpportunity(widget.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Application submitted')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not apply')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Opportunity')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) return const ErrorStateView(message: 'Could not load.');
          final o = snap.data ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(o['title']?.toString() ?? '—',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text('${o['type'] ?? "—"} • ${o['organization'] ?? o['company'] ?? "—"}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 12),
                      Text(o['description']?.toString() ?? 'No description.',
                          style: const TextStyle(fontSize: 14, height: 1.4)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              ElevatedButton.icon(
                onPressed: _apply,
                icon: const Icon(Icons.send),
                label: const Text('Express interest'),
              ),
            ],
          );
        },
      ),
    );
  }
}
