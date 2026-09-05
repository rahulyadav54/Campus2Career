import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/job_recommendation.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class JobRecommendationsScreen extends StatefulWidget {
  const JobRecommendationsScreen({super.key});

  @override
  State<JobRecommendationsScreen> createState() => _JobRecommendationsScreenState();
}

class _JobRecommendationsScreenState extends State<JobRecommendationsScreen> {
  late Future<List<JobRecommendation>> _future;
  late Future<Map<String, dynamic>> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchRecommendedJobs();
    _summaryFuture = context.read<StudentService>().fetchRecommendationSummary();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<StudentService>().fetchRecommendedJobs();
      _summaryFuture = context.read<StudentService>().fetchRecommendationSummary();
    });
  }

  void _showDetails(JobRecommendation rec) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      builder: (_) => _DetailsSheet(rec: rec),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Recommendations'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<JobRecommendation>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load recommendations.',
                onRetry: _refresh,
              );
            }
            final list = snap.data ?? [];
            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _Summary(summaryFuture: _summaryFuture)),
                const SliverToBoxAdapter(child: SizedBox(height: 8)),
                list.isEmpty
                    ? SliverFillRemaining(
                        hasScrollBody: false,
                        child: EmptyState(
                          icon: Icons.star_outline,
                          title: 'No recommendations yet',
                          message: 'Complete your profile and add skills to get personalized job recommendations.',
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.all(16),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, i) => Column(
                              children: [
                                _RecoCard(
                                  rec: list[i],
                                  onTap: () => _showDetails(list[i]),
                                ),
                                if (i < list.length - 1) const SizedBox(height: 10),
                              ],
                            ),
                            childCount: list.length,
                          ),
                        ),
                      ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  final Future<Map<String, dynamic>> summaryFuture;

  const _Summary({required this.summaryFuture});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: summaryFuture,
      builder: (context, snap) {
        final s = snap.data ?? {};
        final top = s['top_matches'] as int? ?? 0;
        final good = s['good_matches'] as int? ?? 0;
        final near = s['near_misses'] as int? ?? 0;
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(child: _StatCard('Top matches', top, AppColors.success)),
              const SizedBox(width: 8),
              Expanded(child: _StatCard('Good matches', good, AppColors.info)),
              const SizedBox(width: 8),
              Expanded(child: _StatCard('Near misses', near, AppColors.warning)),
            ],
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final dynamic value;
  final Color color;

  const _StatCard(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value.toString(),
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _RecoCard extends StatelessWidget {
  final JobRecommendation rec;
  final VoidCallback onTap;

  const _RecoCard({required this.rec, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rec.jobTitle,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text(rec.company,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                        if (rec.location != null)
                          Text(rec.location!,
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _scoreColor(rec.matchScore).withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('${rec.matchScore}%',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700, color: _scoreColor(rec.matchScore))),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (rec.matchedSkills.isNotEmpty)
                    ...rec.matchedSkills
                        .take(4)
                        .map((s) => _skillChip(s, true)),
                  if (rec.missingSkills.isNotEmpty)
                    ...rec.missingSkills
                        .take(3)
                        .map((s) => _skillChip(s, false)),
                ],
              ),
              if (rec.matchedSkills.length > 4)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('+${rec.matchedSkills.length - 4} more matched skills',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Color _scoreColor(int score) {
    if (score >= 80) return AppColors.success;
    if (score >= 60) return AppColors.info;
    if (score >= 40) return AppColors.warning;
    return AppColors.danger;
  }

  Widget _skillChip(String skill, bool matched) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (matched ? AppColors.success : AppColors.warning).withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(skill,
          style: TextStyle(
              fontSize: 11,
              color: matched ? AppColors.success : AppColors.warning,
              fontWeight: FontWeight.w600)),
    );
  }
}

class _DetailsSheet extends StatelessWidget {
  final JobRecommendation rec;

  const _DetailsSheet({required this.rec});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(rec.jobTitle,
                      style:
                          const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
                IconButton(
                    icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 4),
            Text(rec.company,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
            if (rec.location != null)
              Text(rec.location!,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 14),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${rec.matchScore}% Match',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
            ),
            const SizedBox(height: 18),
            _sectionTitle('Match Status'),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                Chip(
                  label: Text(rec.matchStatus,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                  visualDensity: VisualDensity.compact,
                ),
                Chip(
                  label: Text('${rec.skillScore}% skills',
                      style: const TextStyle(fontSize: 11)),
                  backgroundColor: AppColors.accent.withValues(alpha: 0.10),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (rec.matchedSkills.isNotEmpty) ...[
              _sectionTitle('Matched Skills (${rec.matchedSkills.length})'),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: rec.matchedSkills
                    .map((s) => Chip(
                        label: Text(s, style: const TextStyle(fontSize: 11)),
                        backgroundColor:
                            AppColors.success.withValues(alpha: 0.10),
                        visualDensity: VisualDensity.compact))
                    .toList(),
              ),
              const SizedBox(height: 16),
            ],
            if (rec.missingSkills.isNotEmpty) ...[
              _sectionTitle('Skills to Learn (${rec.missingSkills.length})'),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: rec.missingSkills
                    .map((s) => Chip(
                        label: Text(s, style: const TextStyle(fontSize: 11)),
                        backgroundColor:
                            AppColors.warning.withValues(alpha: 0.10),
                        visualDensity: VisualDensity.compact))
                    .toList(),
              ),
              const SizedBox(height: 16),
            ],
            if (rec.description != null) ...[
              _sectionTitle('Description'),
              Text(rec.description!,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 16),
            ],
            if (rec.duration != null || rec.stipend != null || rec.type != null) ...[
              _sectionTitle('Details'),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (rec.type != null) _detail(Icons.work, 'Type', rec.type!),
                  if (rec.duration != null) _detail(Icons.access_time, 'Duration', rec.duration!),
                  if (rec.stipend != null) _detail(Icons.payments_outlined, 'Stipend', '₹${rec.stipend}'),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      );

  Widget _detail(IconData icon, String label, String value) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 16),
          const SizedBox(width: 4),
          Text('$label: $value',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ],
      );
}
