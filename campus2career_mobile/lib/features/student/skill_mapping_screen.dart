import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../widgets/state_views.dart';
import '../../../services/api_helper.dart';

class SkillMappingScreen extends StatelessWidget {
  const SkillMappingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Skill Mapping')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: context.read<ApiHelper>().get('/assessments/skill-mapping'),
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'Could not load skill mapping.',
                onRetry: () => Navigator.pushReplacement(
                    context, MaterialPageRoute(builder: (_) => const SkillMappingScreen())));
          }
          final data = Map<String, dynamic>.from(snap.data ?? {});
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _section('Strong skills', data['strongSkills'], AppColors.success),
              const SizedBox(height: 10),
              _section('Skills to improve', data['improveSkills'] ?? data['gaps'], AppColors.warning),
              const SizedBox(height: 10),
              _section('Industry demand', data['industryDemand'], AppColors.info),
            ],
          );
        },
      ),
    );
  }

  Widget _section(String title, dynamic items, Color color) {
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
              const Text('No data yet.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13))
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: list
                    .map((s) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(s,
                              style: TextStyle(
                                  color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                        ))
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}
