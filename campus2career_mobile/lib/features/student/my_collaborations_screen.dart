import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class MyCollaborationsScreen extends StatefulWidget {
  const MyCollaborationsScreen({super.key});

  @override
  State<MyCollaborationsScreen> createState() => _MyCollaborationsScreenState();
}

class _MyCollaborationsScreenState extends State<MyCollaborationsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchMyCollaborations();
  }

  List<Map<String, dynamic>> _asMaps(dynamic v) {
    if (v is! List) return const [];
    return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  String _titleOf(Map<String, dynamic> m, List<String> keys) {
    for (final k in keys) {
      final nested = m[k];
      if (nested is Map) {
        final t = nested['title'] ?? nested['name'];
        if (t != null) return t.toString();
      }
    }
    return (m['title'] ?? m['name'] ?? 'Item').toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My collaborations')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = context.read<StudentService>().fetchMyCollaborations());
        },
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load collaborations.',
                onRetry: () =>
                    setState(() => _future = context.read<StudentService>().fetchMyCollaborations()),
              );
            }
            final d = snap.data ?? {};
            final sections = <(String, List<Map<String, dynamic>>, List<String>)>[
              ('Workshops', _asMaps(d['workshopRegs']), ['workshop']),
              ('Guest lectures', _asMaps(d['guestLectureRegs']), ['guestLecture']),
              ('Challenges', _asMaps(d['challengeRegs']), ['challenge']),
              ('Projects', _asMaps(d['projectApps']), ['project']),
            ];
            final empty = sections.every((s) => s.$2.isEmpty);
            if (empty) {
              return const EmptyState(
                icon: Icons.groups_outlined,
                title: 'No registrations yet',
                message: 'Join a workshop, challenge, or live project to see it here.',
              );
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final s in sections)
                  if (s.$2.isNotEmpty) ...[
                    Text(s.$1, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...s.$2.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Card(
                          child: ListTile(
                            leading: const Icon(Icons.check_circle_outline, color: AppColors.accent),
                            title: Text(_titleOf(item, s.$3),
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text((item['status'] ?? 'registered').toString()),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}
