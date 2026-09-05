import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../widgets/state_views.dart';
import '../../../services/api_helper.dart';

class PortfolioScreen extends StatelessWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Digital Portfolio')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: context.read<ApiHelper>().get('/portfolio/me'),
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(message: 'Could not load portfolio.');
          }
          final p = Map<String, dynamic>.from(snap.data ?? {});
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? '—',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text(user?.email ?? '',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 8),
                      Text(p['summary']?.toString() ?? 'No summary added yet.',
                          style: const TextStyle(fontSize: 13)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              _section('Skills', p['skills']),
              const SizedBox(height: 10),
              _section('Certifications', p['certifications']),
              const SizedBox(height: 10),
              _section('Projects', p['projects']),
              const SizedBox(height: 10),
              _section('Internships', p['internships']),
              const SizedBox(height: 10),
              _section('Achievements', p['achievements']),
            ],
          );
        },
      ),
    );
  }

  Widget _section(String title, dynamic items) {
    final list = items is List ? items.map((e) => e.toString()).toList() : <String>[];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (list.isEmpty)
              const Text('Not added yet.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13))
            else
              ...list.map((s) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text('• $s', style: const TextStyle(fontSize: 13)),
                  )),
          ],
        ),
      ),
    );
  }
}
