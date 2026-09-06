import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/errors/failures.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/job.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class JobDetailScreen extends StatefulWidget {
  final String id;
  const JobDetailScreen({super.key, required this.id});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  late Future<Job> _future;
  bool _applying = false;
  bool _applied = false;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchJobDetail(widget.id);
    _checkApplied();
  }

  Future<void> _checkApplied() async {
    try {
      final yes = await context.read<StudentService>().hasAppliedToJob(widget.id);
      if (mounted) setState(() => _applied = yes);
    } catch (_) {}
  }

  Future<void> _apply(Job job) async {
    setState(() => _applying = true);
    try {
      await context.read<StudentService>().applyToJob(job.id);
      if (!mounted) return;
      setState(() => _applied = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Application submitted. It is now visible on the web portal.')),
      );
    } on AppFailure catch (e) {
      if (!mounted) return;
      final already = e.message.toLowerCase().contains('already');
      if (already) setState(() => _applied = true);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not apply to this job')),
      );
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Job details')),
      body: FutureBuilder<Job>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || snap.data == null) {
            return ErrorStateView(
              message: 'Could not load this job.',
              onRetry: () => setState(() {
                _future = context.read<StudentService>().fetchJobDetail(widget.id);
              }),
            );
          }
          final job = snap.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(job.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(job.companyName ?? job.company ?? 'Campus employer',
                  style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (job.location != null) _chip(Icons.location_on_outlined, job.location!),
                  if (job.stipend != null && job.stipend!.isNotEmpty)
                    _chip(Icons.payments_outlined, job.stipend!),
                ],
              ),
              const SizedBox(height: 16),
              if (job.requiredSkills.isNotEmpty) ...[
                const Text('Skills', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: job.requiredSkills
                      .map((s) => Chip(
                            label: Text(s, style: const TextStyle(fontSize: 12)),
                            visualDensity: VisualDensity.compact,
                            backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
              ],
              Text(job.description ?? 'No description provided.',
                  style: const TextStyle(height: 1.45, fontSize: 14)),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: (_applying || _applied) ? null : () => _apply(job),
                icon: _applying
                    ? const SizedBox(
                        width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Icon(_applied ? Icons.check : Icons.send),
                label: Text(_applying ? 'Applying…' : (_applied ? 'Applied' : 'Apply')),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _chip(IconData icon, String text) {
    return Chip(
      avatar: Icon(icon, size: 16, color: AppColors.primary),
      label: Text(text),
      visualDensity: VisualDensity.compact,
    );
  }
}
