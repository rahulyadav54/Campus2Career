import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/resume_optimizer_service.dart';
import '../../../widgets/state_views.dart';

class ResumeInsightsScreen extends StatefulWidget {
  final String initialTab;
  const ResumeInsightsScreen({super.key, this.initialTab = 'jobs'});

  @override
  State<ResumeInsightsScreen> createState() => _ResumeInsightsScreenState();
}

class _ResumeInsightsScreenState extends State<ResumeInsightsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  bool _loading = true;
  List<Map<String, dynamic>> _jobs = [];
  List<Map<String, dynamic>> _companies = [];
  Map<String, dynamic> _gaps = {};

  @override
  void initState() {
    super.initState();
    final index = {'jobs': 0, 'companies': 1, 'skills': 2}[widget.initialTab] ?? 0;
    _tabs = TabController(length: 3, vsync: this, initialIndex: index);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final svc = context.read<ResumeOptimizerService>();
      final results = await Future.wait([
        svc.getJobMatches().catchError((_) => <Map<String, dynamic>>[]),
        svc.getCompanies().catchError((_) => <Map<String, dynamic>>[]),
        svc.getSkillGaps().catchError((_) => <String, dynamic>{}),
      ]);
      if (!mounted) return;
      setState(() {
        _jobs = results[0] as List<Map<String, dynamic>>;
        _companies = results[1] as List<Map<String, dynamic>>;
        _gaps = results[2] as Map<String, dynamic>;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Career insights'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Jobs'),
            Tab(text: 'Companies'),
            Tab(text: 'Skills'),
          ],
        ),
      ),
      body: _loading
          ? const LoadingList()
          : RefreshIndicator(
              onRefresh: _load,
              child: TabBarView(
                controller: _tabs,
                children: [
                  _listTab(_jobs, (j) => '${j['title'] ?? j['jobTitle'] ?? 'Role'}', (j) => '${j['company'] ?? ''} · Match ${j['estimatedMatch'] ?? j['matchScore'] ?? '—'}%'),
                  _listTab(_companies, (c) => c['name']?.toString() ?? 'Company', (c) => c['reason']?.toString() ?? c['industry']?.toString() ?? ''),
                  _skillsTab(),
                ],
              ),
            ),
    );
  }

  Widget _listTab(
    List<Map<String, dynamic>> items,
    String Function(Map<String, dynamic>) title,
    String Function(Map<String, dynamic>) subtitle,
  ) {
    if (items.isEmpty) {
      return const Center(child: Text('No data yet — build your resume first.', style: TextStyle(color: AppColors.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final item = items[i];
        return Card(
          child: ListTile(
            title: Text(title(item), style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(subtitle(item)),
          ),
        );
      },
    );
  }

  Widget _skillsTab() {
    final strengthen = _gaps['skillsToStrengthen'];
    final strong = _gaps['strongSkills'];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (strong is List && strong.isNotEmpty) ...[
          const Text('Your strengths', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: strong.map((s) => Chip(label: Text(s.toString()), backgroundColor: AppColors.success.withValues(alpha: 0.1))).toList()),
          const SizedBox(height: 20),
        ],
        if (strengthen is List && strengthen.isNotEmpty) ...[
          const Text('Skills to strengthen', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...strengthen.map((s) => Card(
                child: ListTile(
                  leading: const Icon(Icons.school_outlined, color: AppColors.warning),
                  title: Text(s.toString()),
                ),
              )),
        ] else
          const Center(child: Text('Complete your profile and resume for skill gap analysis.', style: TextStyle(color: AppColors.textSecondary))),
      ],
    );
  }
}
