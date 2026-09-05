import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/announcement.dart';
import '../../../models/job_recommendation.dart';
import '../../../models/skill.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/student_service.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/state_views.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_HomeData> _load() async {
    final svc = context.read<StudentService>();
    final results = await Future.wait<dynamic>([
      svc.fetchRecommendedJobs().catchError((_) => <JobRecommendation>[]),
      svc.fetchSkillProfile().catchError((_) => const SkillProfile()),
      svc.fetchAnnouncements().catchError((_) => <Announcement>[]),
    ]);
    final jobs = results[0] as List<JobRecommendation>;
    final profile = results[1] as SkillProfile;
    final announcements = results[2] as List<Announcement>;
    return _HomeData(jobs: jobs, profile: profile, announcements: announcements);
  }

  void _refresh() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
              icon: const Icon(Icons.notifications_outlined), onPressed: () => context.push('/notifications')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _refresh(),
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const LoadingList();
            }
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load dashboard. Pull down to retry.',
                onRetry: _refresh,
              );
            }
            final data = snap.data!;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _GreetingCard(name: context.read<AuthProvider>().user?.name ?? 'Student'),
                if (data.announcements.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _AnnouncementBanner(announcements: data.announcements),
                ],
                const SizedBox(height: 14),
                _ReadinessCard(score: data.profile.overallScore, goal: data.profile.goal),
                const SizedBox(height: 14),
                _SkillGapsCard(gaps: data.profile.improveSkills),
                const SizedBox(height: 14),
                _RecommendedJobsCard(jobs: data.jobs.take(3).toList()),
                const SizedBox(height: 14),
                _QuickActions(),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}

  class _HomeData {
  final List<JobRecommendation> jobs;
  final SkillProfile profile;
  final List<Announcement> announcements;
  _HomeData({required this.jobs, required this.profile, required this.announcements});
}

class _GreetingCard extends StatelessWidget {
  final String name;
  const _GreetingCard({required this.name});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: AppColors.gradientPrimary),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${_greeting()},',
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text(name,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                const Text('Welcome to Campus2Career',
                    style: TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
          CachedAvatar(name: name, size: 56),
        ],
      ),
    );
  }
}

class _ReadinessCard extends StatelessWidget {
  final num score;
  final String? goal;
  const _ReadinessCard({required this.score, this.goal});

  @override
  Widget build(BuildContext context) {
    final pct = score.toDouble().clamp(0, 100).toInt();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 60,
              height: 60,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: pct / 100,
                    backgroundColor: AppColors.divider,
                    color: AppColors.primary,
                    strokeWidth: 6,
                  ),
                  Text('$pct%',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Your career readiness',
                      style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 2),
                  Text(goal == null || goal!.isEmpty ? 'Set a career goal' : goal!,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  TextButton(
                    onPressed: () => context.push('/skill-mapping'),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                    child: const Text('View skill mapping'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillGapsCard extends StatelessWidget {
  final List<String> gaps;
  const _SkillGapsCard({required this.gaps});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.trending_up, color: AppColors.warning, size: 18),
                SizedBox(width: 6),
                Text('Skill gaps', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 10),
            if (gaps.isEmpty)
              const Text('No major skill gaps detected. Great job!',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13))
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: gaps.take(6).map((g) => _Chip(label: g)).toList(),
              ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push('/learning?autoSkills=${gaps.join(',')}'),
                child: const Text('Improve with learning'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  const _Chip({required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: const TextStyle(
              color: AppColors.warning, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class _RecommendedJobsCard extends StatelessWidget {
  final List<JobRecommendation> jobs;
  const _RecommendedJobsCard({required this.jobs});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.recommend, color: AppColors.primary, size: 18),
                SizedBox(width: 6),
                Text('Recommended for you',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 10),
            if (jobs.isEmpty)
              const Text('No recommendations yet. Complete your profile to get matches.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13))
            else
              ...jobs.map((j) => _JobRow(rec: j)),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push('/recommendations'),
                child: const Text('View all recommendations'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _JobRow extends StatelessWidget {
  final JobRecommendation rec;
  const _JobRow({required this.rec});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/recommendations'),
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.work, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(rec.jobTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(rec.company,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(width: 6),
                      Text('${rec.location ?? "—"}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('${rec.matchScore}%',
                            style: const TextStyle(color: AppColors.warning, fontSize: 10, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 18),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementBanner extends StatelessWidget {
  final List<Announcement> announcements;
  const _AnnouncementBanner({required this.announcements});

  @override
  Widget build(BuildContext context) {
    final list = announcements.take(3).toList();
    if (list.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.campaign_outlined, color: AppColors.primary, size: 18),
                const SizedBox(width: 6),
                const Text('Announcements',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                const Spacer(),
                TextButton(
                  onPressed: () => context.push('/announcements'),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                  child: const Text('View all', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ...list.asMap().entries.map((entry) => _announcementItem(entry.value, isLast: entry.key == list.length - 1)),
          ],
        ),
      ),
    );
  }

  Widget _announcementItem(Announcement a, {bool isLast = false}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(a.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _priorityColor(a.priority).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(a.priority,
                    style: TextStyle(
                        color: _priorityColor(a.priority), fontSize: 10, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(a.content, maxLines: 2, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
          if (!isLast) const SizedBox(height: 8),
          if (!isLast) const Divider(height: 1, thickness: 0.5),
        ],
      );

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'high':
        return AppColors.danger;
      case 'medium':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      ('Skill Assessment', Icons.assignment_turned_in, '/assessments'),
      ('Job Recommendations', Icons.star, '/recommendations'),
      ('Career Guidance', Icons.account_tree_outlined, '/career'),
      ('Applications', Icons.folder_open, '/applications'),
      ('Opportunity Hub', Icons.explore_outlined, '/opportunities'),
      ('My Courses', Icons.book_outlined, '/my-courses'),
      ('My Learning', Icons.menu_book, '/my-learning'),
      ('Portfolio', Icons.folder_shared, '/portfolio'),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Quick actions',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              childAspectRatio: 2.8,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              children: actions
                  .map((a) => InkWell(
                        onTap: () => context.push(a.$3),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(a.$2, color: AppColors.primary, size: 20),
                              const SizedBox(height: 4),
                              Text(a.$1,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}
