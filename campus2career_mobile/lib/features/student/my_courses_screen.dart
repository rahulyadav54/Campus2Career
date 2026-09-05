import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/course.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class MyCoursesScreen extends StatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  State<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends State<MyCoursesScreen> {
  late Future<List<CourseEnrollment>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchMyEnrollments();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Courses')),
      body: RefreshIndicator(
        onRefresh: () async => setState(() => _future = context.read<StudentService>().fetchMyEnrollments()),
        child: FutureBuilder<List<CourseEnrollment>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList(count: 6);
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load your courses.',
                onRetry: () => setState(() => _future = context.read<StudentService>().fetchMyEnrollments()),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.book_outlined,
                title: 'No courses yet',
                message: 'Enroll in courses from the Courses section to track your progress here.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final e = list[i];
                final progress = (e.progressPercent / 100).clamp(0.0, 1.0);
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.accent.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.book, color: AppColors.accent, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(e.course.title,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                                  Text(e.course.provider ?? '',
                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _statusColor(e.status).withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(e.statusLabel,
                                  style: TextStyle(
                                      color: _statusColor(e.status),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: AppColors.divider,
                            color: AppColors.primary,
                            minHeight: 8,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text('${e.progressPercent}% complete',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        if (e.course.externalUrl != null && e.course.externalUrl!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: TextButton.icon(
                              onPressed: () {
                                final uri = Uri.tryParse(e.course.externalUrl!);
                                if (uri != null) {
                                  launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                              icon: const Icon(Icons.open_in_new, size: 14),
                              label: const Text('Open course'),
                              style: TextButton.styleFrom(padding: EdgeInsets.zero),
                            ),
                          ),
                      ],
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

  Color _statusColor(String status) {
    switch (status) {
      case 'completed':
        return AppColors.success;
      case 'in_progress':
        return AppColors.info;
      default:
        return AppColors.warning;
    }
  }
}
