import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/internship.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class InternshipsScreen extends StatefulWidget {
  const InternshipsScreen({super.key});

  @override
  State<InternshipsScreen> createState() => _InternshipsScreenState();
}

class _InternshipsScreenState extends State<InternshipsScreen> {
  final _searchCtrl = TextEditingController();
  int _page = 1;
  List<Internship> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _items = [];
        _page = 1;
        _error = null;
      });
    }
    try {
      final svc = context.read<StudentService>();
      final list = await svc.fetchInternships(page: _page, search: _searchCtrl.text);
      setState(() {
        _items.addAll(list);
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'Could not load internships.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Internships')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'Search internships',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
              onSubmitted: (_) => _load(reset: true),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingList()
                : _error != null
                    ? ErrorStateView(
                        message: _error!,
                        onRetry: () => _load(reset: true),
                      )
                    : _items.isEmpty
                        ? const EmptyState(
                            icon: Icons.school_outlined,
                            title: 'No internships yet',
                            message: 'Check back soon for new openings.')
                        : RefreshIndicator(
                            onRefresh: () => _load(reset: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _items.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, i) {
                                final it = _items[i];
                                return Card(
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.all(14),
                                    leading: const CircleAvatar(
                                      backgroundColor: AppColors.secondary,
                                      child: Icon(Icons.school, color: Colors.white),
                                    ),
                                    title: Text(it.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.w700)),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                          '${it.companyName ?? it.company ?? "—"} • ${it.location ?? "Remote"} • ${it.duration ?? "—"}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis),
                                    ),
                                    trailing: const Icon(Icons.chevron_right),
                                    onTap: () => context.push('/internships/${it.id}'),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
