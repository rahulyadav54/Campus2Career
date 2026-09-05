import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/announcement.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  late Future<List<Announcement>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchAnnouncements();
  }

  Future<void> _refresh() async {
    setState(() => _future = context.read<StudentService>().fetchAnnouncements());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Announcement>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList(count: 8);
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load announcements.',
                onRetry: _refresh,
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) return const EmptyState(icon: Icons.campaign_outlined, title: 'No announcements');
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final a = list[i];
                final priorityHigh = a.priority == 'high';
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _typeColor(a.type).withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _typeLabel(a.type),
                                style: TextStyle(
                                  color: _typeColor(a.type),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (priorityHigh)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.danger.withValues(alpha: 0.10),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('High Priority',
                                    style: TextStyle(
                                        color: AppColors.danger,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700)),
                              ),
                            const Spacer(),
                            Text(
                              a.createdAt != null
                                  ? '${a.createdAt!.month}/${a.createdAt!.day}/${a.createdAt!.year}'
                                  : '',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(a.title,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        Text(a.content,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                        if (a.expiresAt != null) ...[
                          const SizedBox(height: 8),
                          Text('Expires: ${_formatDate(a.expiresAt!)}',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
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

  String _typeLabel(String type) {
    switch (type) {
      case 'placement':
        return 'Placement';
      case 'academic':
        return 'Academic';
      case 'event':
        return 'Event';
      case 'urgent':
        return 'Urgent';
      default:
        return 'General';
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'placement':
        return AppColors.success;
      case 'academic':
        return AppColors.info;
      case 'event':
        return AppColors.secondary;
      case 'urgent':
        return AppColors.danger;
      default:
        return AppColors.primary;
    }
  }

  String _formatDate(DateTime d) => '${d.month}/${d.day}/${d.year}';
}
