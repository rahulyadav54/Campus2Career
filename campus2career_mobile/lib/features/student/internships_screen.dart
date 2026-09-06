import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/errors/failures.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/listing_search.dart';
import '../../../models/internship.dart';
import '../../../services/student_service.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/listing_search_field.dart';
import '../../../widgets/state_views.dart';

class InternshipsScreen extends StatelessWidget {
  const InternshipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          leading: const ShellMenuButton(),
          title: const Text('Internships'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Openings'),
              Tab(text: 'My progress'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _OpeningsTab(),
            _ProgressTab(),
          ],
        ),
      ),
    );
  }
}

class _OpeningsTab extends StatefulWidget {
  const _OpeningsTab();
  @override
  State<_OpeningsTab> createState() => _OpeningsTabState();
}

class _OpeningsTabState extends State<_OpeningsTab> {
  final _searchCtrl = TextEditingController();
  List<Internship> _all = [];
  String _query = '';
  bool _loading = true;
  String? _error;

  List<Internship> get _visible {
    return _all
        .where((it) => listingMatchesQuery(
              query: _query,
              title: it.title,
              description: it.description,
              location: it.location,
              company: it.companyName ?? it.company,
              stipend: it.stipend?.toString(),
              skills: it.requiredSkills,
            ))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await context.read<StudentService>().fetchInternships();
      if (!mounted) return;
      setState(() {
        _all = list;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load internships.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _visible;
    return Column(
      children: [
        ListingSearchField(
          controller: _searchCtrl,
          hint: 'Search internships, skills, company, location…',
          onChanged: (value) => setState(() => _query = value),
        ),
        if (!_loading && _error == null && _all.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _query.trim().isEmpty
                    ? '${items.length} openings'
                    : '${items.length} result${items.length == 1 ? '' : 's'} for “${_query.trim()}”',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
            ),
          ),
        Expanded(
          child: _loading
              ? const LoadingList()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : items.isEmpty
                      ? EmptyState(
                          icon: Icons.search_off,
                          title: _query.trim().isEmpty ? 'No internships yet' : 'No matching internships',
                          message: _query.trim().isEmpty
                              ? 'Check back soon for new openings.'
                              : 'Try a different title, skill, company, or location.',
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, i) {
                              final it = items[i];
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
                                      '${it.companyName ?? it.company ?? "—"} • ${it.location ?? "Remote"}',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () => context.push('/jobs/${it.id}'),
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}

class _ProgressTab extends StatefulWidget {
  const _ProgressTab();
  @override
  State<_ProgressTab> createState() => _ProgressTabState();
}

class _ProgressTabState extends State<_ProgressTab> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchInternshipProgress();
  }

  Future<void> _create() async {
    final title = TextEditingController();
    final org = TextEditingController();
    final desc = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.viewInsetsOf(ctx).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Track an internship', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 10),
            TextField(controller: org, decoration: const InputDecoration(labelText: 'Organization')),
            const SizedBox(height: 10),
            TextField(controller: desc, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    if (ok == true && title.text.trim().isNotEmpty && mounted) {
      try {
        await context.read<StudentService>().createInternshipProgress({
          'title': title.text.trim(),
          'organization': org.text.trim(),
          'description': desc.text.trim(),
          'startDate': DateTime.now().toIso8601String(),
        });
        setState(() => _future = context.read<StudentService>().fetchInternshipProgress());
      } on AppFailure catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
    title.dispose();
    org.dispose();
    desc.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _create,
        icon: const Icon(Icons.add),
        label: const Text('Add record'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = context.read<StudentService>().fetchInternshipProgress());
        },
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const LoadingList();
            if (snap.hasError) {
              return ErrorStateView(
                message: 'Could not load internship progress.',
                onRetry: () =>
                    setState(() => _future = context.read<StudentService>().fetchInternshipProgress()),
              );
            }
            final list = snap.data ?? [];
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.timeline,
                title: 'No internship records',
                message: 'Add the internships you are doing so mentors can follow your progress.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final r = list[i];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(14),
                    title: Text((r['title'] ?? 'Internship').toString(),
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Text(
                      '${r['organization'] ?? '—'} • ${r['status'] ?? 'ongoing'}',
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
