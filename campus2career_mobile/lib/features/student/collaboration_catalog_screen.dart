import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/errors/failures.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class CollaborationCatalogScreen extends StatefulWidget {
  final String title;
  final String type;
  final IconData icon;
  final bool nested;
  const CollaborationCatalogScreen({
    super.key,
    required this.title,
    required this.type,
    this.icon = Icons.event_outlined,
    this.nested = false,
  });

  @override
  State<CollaborationCatalogScreen> createState() => _CollaborationCatalogScreenState();
}

class _CollaborationCatalogScreenState extends State<CollaborationCatalogScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchCollaborationList(widget.type);
  }

  Future<void> _register(String id) async {
    try {
      await context.read<StudentService>().registerCollaboration(widget.type, id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.type == 'projects' ? 'Applied successfully' : 'Registered successfully')),
      );
      setState(() => _future = context.read<StudentService>().fetchCollaborationList(widget.type));
    } on AppFailure catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not complete this action.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = context.read<StudentService>().fetchCollaborationList(widget.type));
        },
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load ${widget.title.toLowerCase()}.',
                onRetry: () => setState(
                  () => _future = context.read<StudentService>().fetchCollaborationList(widget.type),
                ),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return EmptyState(
                icon: widget.icon,
                title: 'Nothing listed yet',
                message: 'Check back soon for new ${widget.title.toLowerCase()}.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final item = list[i];
                final id = (item['_id'] ?? item['id'] ?? '').toString();
                final title = (item['title'] ?? item['name'] ?? 'Untitled').toString();
                final org = (item['organization'] ?? item['company'] ?? item['speaker'] ?? item['host'] ?? '')
                    .toString();
                final desc = (item['description'] ?? item['topic'] ?? '').toString();
                final date = (item['date'] ?? item['startDate'] ?? item['deadline'] ?? '').toString();
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                              child: Icon(widget.icon, color: AppColors.primary, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(title,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                            ),
                          ],
                        ),
                        if (org.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(org, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                        ],
                        if (desc.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(desc,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13, height: 1.4)),
                        ],
                        if (date.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(date.split('T').first,
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: FilledButton(
                            onPressed: id.isEmpty ? null : () => _register(id),
                            child: Text(widget.type == 'projects' ? 'Apply' : 'Register'),
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
      );
    if (widget.nested) return body;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: body,
    );
  }
}
