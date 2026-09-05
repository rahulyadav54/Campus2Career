import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class CareerGuidanceScreen extends StatefulWidget {
  const CareerGuidanceScreen({super.key});

  @override
  State<CareerGuidanceScreen> createState() => _CareerGuidanceScreenState();
}

class _CareerGuidanceScreenState extends State<CareerGuidanceScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
    _future = context.read<StudentService>().fetchCareerGuidance();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() => _future = context.read<StudentService>().fetchCareerGuidance());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Career Guidance'),
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Pathways'),
            Tab(text: 'Industries'),
            Tab(text: 'Resources'),
            Tab(text: 'Skill Gaps'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load career guidance.',
                onRetry: _refresh,
              );
            }
            final d = snap.data ?? {};
            return TabBarView(
              controller: _tab,
              children: [
                _PathwaysTab(pathways: d['recommendedPathways'] ?? []),
                _IndustriesTab(industries: d['recommendedIndustries'] ?? []),
                _ResourcesTab(resources: d['learningResources'] ?? []),
                _GapsTab(gaps: d['skillGaps'] ?? []),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PathwaysTab extends StatelessWidget {
  final List<dynamic> pathways;

  const _PathwaysTab({required this.pathways});

  @override
  Widget build(BuildContext context) {
    if (pathways.isEmpty) {
      return const EmptyState(icon: Icons.account_tree_outlined, title: 'No pathways yet');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: pathways.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final p = pathways[i] as Map<String, dynamic>;
        final pathway = p['pathway'] as Map<String, dynamic>? ?? {};
        final score = (p['matchScore'] as num?)?.toInt() ?? 0;
        final matched = p['matchedSkills'] as List? ?? [];
        final missing = p['missingSkills'] as List? ?? [];
        return Card(
          child: ExpansionTile(
            title: Text(pathway['role']?.toString() ?? '—',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            subtitle: Text('${pathway['industry']?.toString() ?? "—"} · Demand: ${p['demandLevel']?.toString() ?? "—"}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            trailing: CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.primary.withValues(alpha: 0.08),
              child: Text('$score%', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 24, right: 16, bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (matched.isNotEmpty) ...[
                      const Text('Matched skills', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: matched.map((s) => Chip(
                            label: Text(s.toString(), style: const TextStyle(fontSize: 11)),
                            backgroundColor: AppColors.success.withValues(alpha: 0.10),
                            visualDensity: VisualDensity.compact)).toList(),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (missing.isNotEmpty) ...[
                      const Text('Skills to learn', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: missing.map((s) => Chip(
                            label: Text(s.toString(), style: const TextStyle(fontSize: 11)),
                            backgroundColor: AppColors.warning.withValues(alpha: 0.10),
                            visualDensity: VisualDensity.compact)).toList(),
                      ),
                    ],
                    if (pathway['averageSalaryLPA'] != null) ...[
                      const SizedBox(height: 8),
                      Text('Avg. salary: ₹${pathway['averageSalaryLPA']} LPA',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _IndustriesTab extends StatelessWidget {
  final List<dynamic> industries;

  const _IndustriesTab({required this.industries});

  Color _demandColor(String? level) {
    switch (level) {
      case 'high':
        return AppColors.danger;
      case 'medium':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (industries.isEmpty) {
      return const EmptyState(icon: Icons.business_outlined, title: 'No industry data');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: industries.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final ind = industries[i] as Map<String, dynamic>;
        final score = ind['demandScore'] as num? ?? 0;
        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(14),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.business, color: AppColors.secondary),
            ),
            title: Text(ind['industry']?.toString() ?? '—',
                style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${ind['roles']} roles · ${ind['matchedRoles']?.toString() ?? ""}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                LinearProgressIndicator(
                  value: (score / 100).clamp(0, 1),
                  backgroundColor: AppColors.divider,
                  color: _demandColor(ind['demandLevel']?.toString()),
                  minHeight: 4,
                ),
              ],
            ),
            trailing: Text('${score.toInt()}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        );
      },
    );
  }
}

class _ResourcesTab extends StatelessWidget {
  final List<dynamic> resources;

  const _ResourcesTab({required this.resources});

  Future<void> _openUrl(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (resources.isEmpty) {
      return const EmptyState(icon: Icons.menu_book_outlined, title: 'No learning resources yet');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: resources.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final r = resources[i] as Map<String, dynamic>;
        final url = r['url']?.toString();
        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(14),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.menu_book, color: AppColors.accent),
            ),
            title: Text(r['title']?.toString() ?? '—',
                style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(r['provider']?.toString() ?? r['type']?.toString() ?? '',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            trailing: url != null ? const Icon(Icons.open_in_new, color: AppColors.textMuted, size: 18) : null,
            onTap: url != null ? () => _openUrl(context, url!) : null,
          ),
        );
      },
    );
  }
}

class _GapsTab extends StatelessWidget {
  final List<dynamic> gaps;

  const _GapsTab({required this.gaps});

  @override
  Widget build(BuildContext context) {
    if (gaps.isEmpty) {
      return const EmptyState(icon: Icons.check_circle_outline, title: 'No skill gaps detected');
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: gaps.map((g) => Chip(
                  label: Text(g.toString(), style: const TextStyle(fontSize: 12)),
                  backgroundColor: AppColors.warning.withValues(alpha: 0.10),
                  labelStyle: const TextStyle(color: AppColors.warning),
                  visualDensity: VisualDensity.compact)).toList(),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Work on these skills to improve your career match score. Visit the Learning Hub for personalized resource recommendations.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      ],
    );
  }
}
