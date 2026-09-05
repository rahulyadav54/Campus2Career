import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
              message: 'Could not load notifications.',
              onRetry: () => setState(() => _future = context.read<StudentService>().fetchNotifications()),
            );
          }
          final list = (snap.data as List?) ?? [];
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_outlined,
              title: 'No notifications',
              message: 'You\'re all caught up.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = context.read<StudentService>().fetchNotifications()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final n = list[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: (n.read == true ? AppColors.textMuted : AppColors.primary).withValues(alpha: 0.15),
                      child: Icon(
                        n.type == 'application' ? Icons.work : Icons.notifications,
                        color: n.read == true ? AppColors.textMuted : AppColors.primary,
                        size: 18,
                      ),
                    ),
                    title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: n.body == null ? null : Text(n.body, style: const TextStyle(fontSize: 12)),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
