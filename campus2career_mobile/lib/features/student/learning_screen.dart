import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/learning_resource.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class LearningScreen extends StatefulWidget {
  final List<String>? autoSkills;
  const LearningScreen({super.key, this.autoSkills});

  @override
  State<LearningScreen> createState() => _LearningScreenState();
}

class _LearningScreenState extends State<LearningScreen> {
  late Future<List<LearningResource>> _future;
  String? _category;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<LearningResource>> _load() async {
    final svc = context.read<StudentService>();
    if (widget.autoSkills != null && widget.autoSkills!.isNotEmpty) {
      return svc.fetchRecommendations(skills: widget.autoSkills);
    }
    return svc.fetchLearningPlatforms(category: _category);
  }

  Future<void> _open(LearningResource r) async {
    if (r.url == null || r.url!.isEmpty) return;
    final uri = Uri.tryParse(r.url!);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.autoSkills != null ? 'Recommended for your skill gaps' : 'Learning Hub'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(() => _future = _load()),
        child: FutureBuilder<List<LearningResource>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const LoadingList();
            }
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load learning resources.',
                onRetry: () => setState(() => _future = _load()),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.menu_book_outlined,
                title: 'No resources yet',
                message: 'Add skills to your profile to get recommendations.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final r = list[i];
                return Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => _open(r),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.menu_book, color: AppColors.accent),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(r.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 4),
                                Text(
                                  [
                                    if (r.provider != null) r.provider!,
                                    if (r.level != null) r.level!,
                                    if (r.free) 'Free' else 'Paid',
                                    if (r.certification) 'Certificate'
                                  ].join(' • '),
                                  style: const TextStyle(
                                      color: AppColors.textSecondary, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.open_in_new, color: AppColors.textMuted, size: 18),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
