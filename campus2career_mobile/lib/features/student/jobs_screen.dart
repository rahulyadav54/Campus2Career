import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/job.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final _searchCtrl = TextEditingController();
  int _page = 1;
  bool _loadingMore = false;
  bool _hasMore = true;
  List<Job> _items = [];
  bool _loading = true;
  String? _error;
  String? _type;

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
        _hasMore = true;
        _error = null;
      });
    }
    try {
      final svc = context.read<StudentService>();
      final list = await svc.fetchJobs(
        page: _page,
        search: _searchCtrl.text,
        type: _type,
      );
      setState(() {
        _items.addAll(list);
        _loading = false;
        _hasMore = list.length >= AppConstants.defaultPageSize;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Could not load jobs.';
      });
    }
  }

  Future<void> _refresh() async => _load(reset: true);

  Future<void> _onScroll(ScrollNotification n) async {
    if (_loadingMore || !_hasMore) return;
    if (n.metrics.pixels >= n.metrics.maxScrollExtent - 200) {
      setState(() {
        _loadingMore = true;
        _page += 1;
      });
      await _load();
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Jobs')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search jobs',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchCtrl.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          _load(reset: true);
                          setState(() {});
                        },
                      ),
              ),
              onSubmitted: (_) => _load(reset: true),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: NotificationListener<ScrollNotification>(
              onNotification: (n) {
                _onScroll(n);
                return false;
              },
              child: _loading
                  ? const LoadingList()
                  : _error != null
                      ? ErrorStateView(message: _error!, onRetry: _refresh)
                      : _items.isEmpty
                          ? const EmptyState(
                              icon: Icons.work_outline,
                              title: 'No jobs found',
                              message: 'Try a different search or check back later.')
                          : RefreshIndicator(
                              onRefresh: _refresh,
                              child: ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _items.length + (_hasMore ? 1 : 0),
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (context, i) {
                                  if (i >= _items.length) {
                                    return const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                    );
                                  }
                                  final job = _items[i];
                                  return _JobCard(job: job, onTap: () => context.push('/jobs/${job.id}'));
                                },
                              ),
                            ),
            ),
          ),
        ],
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  final Job job;
  final VoidCallback onTap;
  const _JobCard({required this.job, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
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
                      color: AppColors.primary.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.work, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(job.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text(job.companyName ?? job.company ?? '—',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (job.location != null) _tag(Icons.location_on_outlined, job.location!),
                  if (job.mode != null) _tag(Icons.laptop_chromebook_outlined, job.mode!),
                  if (job.salaryMin != null)
                    _tag(Icons.payments_outlined,
                        '${job.salaryMin}${job.salaryMax != null ? " - ${job.salaryMax}" : ""}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
