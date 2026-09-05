import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/application.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  late Future<List<Application>> _jobsFuture;
  late Future<List<Application>> _internFuture;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _jobsFuture = _loadJobs();
    _internFuture = _loadIntern();
  }

  Future<List<Application>> _loadJobs() async {
    final svc = context.read<StudentService>();
    return svc.fetchMyApplications(type: 'job');
  }

  Future<List<Application>> _loadIntern() async {
    final svc = context.read<StudentService>();
    return svc.fetchMyApplications(type: 'internship');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [Tab(text: 'Jobs'), Tab(text: 'Internships')],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _list(_jobsFuture, 'No job applications yet'),
          _list(_internFuture, 'No internship applications yet'),
        ],
      ),
    );
  }

  Widget _list(Future<List<Application>> f, String empty) {
    return FutureBuilder<List<Application>>(
      future: f,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) return const LoadingList();
        if (snap.hasError) {
          return ErrorStateView(
              message: 'Could not load applications.',
              onRetry: () => setState(() {
                    _jobsFuture = _loadJobs();
                    _internFuture = _loadIntern();
                  }));
        }
        final list = snap.data ?? [];
        if (list.isEmpty) return EmptyState(icon: Icons.folder_open, title: empty);
        return RefreshIndicator(
          onRefresh: () async => setState(() {
            _jobsFuture = _loadJobs();
            _internFuture = _loadIntern();
          }),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _AppCard(app: list[i]),
          ),
        );
      },
    );
  }
}

class _AppCard extends StatelessWidget {
  final Application app;
  const _AppCard({required this.app});

  Color _statusColor() {
    switch (app.status.toLowerCase()) {
      case 'selected':
      case 'shortlisted':
        return AppColors.success;
      case 'rejected':
        return AppColors.danger;
      case 'interview':
        return AppColors.info;
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(app.title ?? '—',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor().withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(app.status,
                      style: TextStyle(
                          color: _statusColor(),
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(app.company ?? '—',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 6),
            Text('Applied: ${app.appliedAt?.toString().split(".").first ?? "—"}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
