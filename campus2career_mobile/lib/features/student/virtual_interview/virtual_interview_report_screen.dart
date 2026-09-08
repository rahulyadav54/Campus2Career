import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/interview_session.dart';
import '../../../services/interview_service.dart';
import '../../../widgets/ai_feature_cards.dart';
import '../../../widgets/state_views.dart';

class VirtualInterviewReportScreen extends StatefulWidget {
  final String sessionId;
  const VirtualInterviewReportScreen({super.key, required this.sessionId});

  @override
  State<VirtualInterviewReportScreen> createState() => _VirtualInterviewReportScreenState();
}

class _VirtualInterviewReportScreenState extends State<VirtualInterviewReportScreen> {
  InterviewReport? _report;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final report = await context.read<InterviewService>().getReport(widget.sessionId);
      if (mounted) setState(() => _report = report);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Interview report')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _report == null
              ? ErrorStateView(message: 'Report not available', onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            ScoreRing(score: _report!.overallScore, label: 'Overall score', size: 100),
                            const SizedBox(height: 12),
                            Text(_report!.targetRole, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
                    if (_report!.summary.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text('Summary', style: TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(_report!.summary, style: const TextStyle(height: 1.45)),
                    ],
                    if (_report!.strengths.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text('Strengths', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.success)),
                      ..._report!.strengths.map((s) => ListTile(dense: true, leading: const Icon(Icons.check_circle_outline, color: AppColors.success, size: 18), title: Text(s, style: const TextStyle(fontSize: 13)))),
                    ],
                    if (_report!.improvements.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      const Text('Improvements', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning)),
                      ..._report!.improvements.map((s) => ListTile(dense: true, leading: const Icon(Icons.lightbulb_outline, color: AppColors.warning, size: 18), title: Text(s, style: const TextStyle(fontSize: 13)))),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(onPressed: () => context.go('/virtual-interview'), child: const Text('Practice again')),
                    const SizedBox(height: 8),
                    OutlinedButton(onPressed: () => context.go('/resume-center'), child: const Text('Back to Resume Center')),
                  ],
                ),
    );
  }
}
