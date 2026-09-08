import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/resume_document.dart';
import '../../../services/resume_optimizer_service.dart';
import '../../../widgets/ai_feature_cards.dart';
import '../../../widgets/state_views.dart';

class ResumeCenterScreen extends StatefulWidget {
  const ResumeCenterScreen({super.key});

  @override
  State<ResumeCenterScreen> createState() => _ResumeCenterScreenState();
}

class _ResumeCenterScreenState extends State<ResumeCenterScreen> {
  CareerDashboard? _dashboard;
  List<ResumeDocument> _resumes = [];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = context.read<ResumeOptimizerService>();
      final results = await Future.wait([
        svc.getDashboard(),
        svc.listResumes(),
      ]);
      if (!mounted) return;
      setState(() {
        _dashboard = results[0] as CareerDashboard;
        _resumes = results[1] as List<ResumeDocument>;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Could not load Resume Center. Pull to refresh.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    setState(() => _busy = true);
    try {
      final resume = await context.read<ResumeOptimizerService>().createResume(fromProfile: true);
      if (!mounted) return;
      context.push('/resume-center/builder/${resume.id}');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not create resume')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _upload() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'docx'],
    );
    if (picked == null || picked.files.isEmpty || picked.files.first.path == null) return;
    setState(() => _busy = true);
    try {
      final file = picked.files.first;
      final resume = await context.read<ResumeOptimizerService>().uploadResume(
        filePath: file.path!,
        filename: file.name,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Resume imported successfully')));
      context.push('/resume-center/builder/${resume.id}');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed — use PDF or DOCX')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        title: const Text('Resume Center'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: GradientHeader(
                title: 'Resume & Career',
                subtitle: 'Build, analyze, match jobs, and prepare for interviews — your AI career copilot.',
                icon: Icons.description_outlined,
              ),
            ),
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_error != null)
              SliverFillRemaining(child: ErrorStateView(message: _error!, onRetry: _load))
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _ReadinessCard(readiness: _dashboard?.careerReadiness ?? 0, scores: _dashboard?.scores ?? {}),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: _busy ? null : _create,
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('New resume'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _busy ? null : _upload,
                            icon: const Icon(Icons.upload_file, size: 18),
                            label: const Text('Upload'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Career tools', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 10),
                    FeatureActionCard(
                      title: 'Job matches',
                      subtitle: 'Roles that fit your resume',
                      icon: Icons.work_outline,
                      color: AppColors.primary,
                      onTap: () => context.push('/resume-center/insights?tab=jobs'),
                    ),
                    const SizedBox(height: 8),
                    FeatureActionCard(
                      title: 'Target companies',
                      subtitle: 'Companies you can aim for',
                      icon: Icons.business_outlined,
                      color: AppColors.secondary,
                      onTap: () => context.push('/resume-center/insights?tab=companies'),
                    ),
                    const SizedBox(height: 8),
                    FeatureActionCard(
                      title: 'Skill gaps',
                      subtitle: 'What to learn next',
                      icon: Icons.trending_up,
                      color: AppColors.accent,
                      onTap: () => context.push('/resume-center/insights?tab=skills'),
                    ),
                    const SizedBox(height: 8),
                    FeatureActionCard(
                      title: 'Virtual interviewer',
                      subtitle: 'AI mock interview with voice',
                      icon: Icons.mic_none,
                      color: const Color(0xFF7C3AED),
                      onTap: () => context.push('/virtual-interview'),
                    ),
                    const SizedBox(height: 20),
                    const Text('My resumes', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 10),
                    if (_resumes.isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Text('No resumes yet. Create one or upload your existing resume.',
                              style: TextStyle(color: AppColors.textSecondary)),
                        ),
                      )
                    else
                      ..._resumes.map((r) => _ResumeTile(
                            resume: r,
                            onTap: () => context.push('/resume-center/builder/${r.id}'),
                          )),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ReadinessCard extends StatelessWidget {
  final int readiness;
  final Map<String, int> scores;
  const _ReadinessCard({required this.readiness, required this.scores});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            ScoreRing(score: readiness, label: 'Career readiness'),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Your readiness snapshot', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 8),
                  if (scores.isEmpty)
                    const Text('Build your resume to unlock scores.', style: TextStyle(color: AppColors.textSecondary, fontSize: 12))
                  else
                    ...scores.entries.take(4).map((e) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              Expanded(child: Text(_label(e.key), style: const TextStyle(fontSize: 12))),
                              Text('${e.value}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                            ],
                          ),
                        )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _label(String key) => key.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[1]}').trim();
}

class _ResumeTile extends StatelessWidget {
  final ResumeDocument resume;
  final VoidCallback onTap;
  const _ResumeTile({required this.resume, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: const Icon(Icons.description, color: AppColors.primary, size: 20),
        ),
        title: Text(resume.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          [
            if (resume.targetRole.isNotEmpty) resume.targetRole,
            if (resume.atsScore != null) 'ATS ~${resume.atsScore}',
          ].join(' · '),
          style: const TextStyle(fontSize: 12),
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
