import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/listing_search.dart';
import '../../../models/job.dart';
import '../../../services/student_service.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/listing_search_field.dart';
import '../../../widgets/state_views.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final _searchCtrl = TextEditingController();
  List<Job> _all = [];
  String _query = '';
  bool _loading = true;
  String? _error;

  List<Job> get _visible {
    return _all
        .where((job) => listingMatchesQuery(
              query: _query,
              title: job.title,
              description: job.description,
              location: job.location,
              company: job.companyName ?? job.company,
              type: job.type,
              stipend: job.stipend,
              skills: job.requiredSkills,
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
      final list = await context.read<StudentService>().fetchJobs();
      if (!mounted) return;
      setState(() {
        _all = list;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load jobs.';
      });
    }
  }

  void _onQuery(String value) => setState(() => _query = value);

  @override
  Widget build(BuildContext context) {
    final items = _visible;
    return Scaffold(
      appBar: AppBar(leading: const ShellMenuButton(), title: const Text('Jobs')),
      body: Column(
        children: [
          ListingSearchField(
            controller: _searchCtrl,
            hint: 'Search jobs, skills, company, location…',
            onChanged: _onQuery,
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
                            title: _query.trim().isEmpty ? 'No jobs found' : 'No matching jobs',
                            message: _query.trim().isEmpty
                                ? 'Check back later for new openings.'
                                : 'Try a different title, skill, company, or location.',
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: items.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, i) {
                                final job = items[i];
                                return _JobCard(job: job, onTap: () => context.push('/jobs/${job.id}'));
                              },
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
                  if (job.stipend != null && job.stipend!.isNotEmpty)
                    _tag(Icons.payments_outlined, job.stipend!),
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
