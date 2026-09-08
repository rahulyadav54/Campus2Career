import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/interview_session.dart';
import '../../../services/interview_service.dart';
import '../../../widgets/ai_feature_cards.dart';
import '../../../widgets/state_views.dart';

class VirtualInterviewSetupScreen extends StatefulWidget {
  final Map<String, dynamic>? initialExtra;
  const VirtualInterviewSetupScreen({super.key, this.initialExtra});

  @override
  State<VirtualInterviewSetupScreen> createState() => _VirtualInterviewSetupScreenState();
}

class _VirtualInterviewSetupScreenState extends State<VirtualInterviewSetupScreen> {
  final _roles = [
    'Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'AI/ML Engineer', 'Data Scientist', 'Data Analyst',
  ];
  String _role = 'Software Developer';
  String _difficulty = 'intermediate';
  int _duration = 10;
  bool _resumeBased = false;
  final _jdCtrl = TextEditingController();
  bool _starting = false;
  List<InterviewHistoryItem> _history = [];
  bool _loadingHistory = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    final extra = widget.initialExtra;
    if (extra != null) {
      _role = (extra['targetRole'] ?? _role).toString();
      _jdCtrl.text = (extra['jobDescription'] ?? '').toString();
      _resumeBased = extra['resumeBased'] == true;
    }
  }

  Future<void> _loadHistory() async {
    try {
      final list = await context.read<InterviewService>().getHistory();
      if (mounted) setState(() => _history = list.take(5).toList());
    } catch (_) {}
    if (mounted) setState(() => _loadingHistory = false);
  }

  Future<void> _start() async {
    setState(() => _starting = true);
    try {
      final result = await context.read<InterviewService>().start(
        targetRole: _role,
        difficulty: _difficulty,
        durationMinutes: _duration,
        resumeBased: _resumeBased,
        jobDescription: _jdCtrl.text.trim(),
      );
      if (!mounted) return;
      context.push('/virtual-interview/${result.sessionId}/live', extra: result);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not start interview')));
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  void dispose() {
    _jdCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: GradientHeader(
              title: 'Virtual Interviewer',
              subtitle: 'Real-time AI mock interviews with voice — practice like the real thing.',
              icon: Icons.mic_none,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                DropdownButtonFormField<String>(
                  value: _role,
                  decoration: const InputDecoration(labelText: 'Target role'),
                  items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                  onChanged: (v) => setState(() => _role = v ?? _role),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _difficulty,
                  decoration: const InputDecoration(labelText: 'Difficulty'),
                  items: const [
                    DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                    DropdownMenuItem(value: 'intermediate', child: Text('Intermediate')),
                    DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
                  ],
                  onChanged: (v) => setState(() => _difficulty = v ?? _difficulty),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Duration'),
                    Expanded(
                      child: Slider(
                        value: _duration.toDouble(),
                        min: 5,
                        max: 30,
                        divisions: 5,
                        label: '$_duration min',
                        onChanged: (v) => setState(() => _duration = v.round()),
                      ),
                    ),
                    Text('${_duration}m'),
                  ],
                ),
                SwitchListTile(
                  title: const Text('Resume-based interview'),
                  subtitle: const Text('Questions tailored to your profile'),
                  value: _resumeBased,
                  onChanged: (v) => setState(() => _resumeBased = v),
                ),
                TextField(
                  controller: _jdCtrl,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Job description (optional)',
                    hintText: 'Paste JD for job-specific questions…',
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _starting ? null : _start,
                  icon: _starting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.play_arrow),
                  label: Text(_starting ? 'Starting…' : 'Start interview'),
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => context.push('/interview-prep'),
                  icon: const Icon(Icons.chat_outlined),
                  label: const Text('Quick AI chat prep'),
                ),
                const SizedBox(height: 24),
                const Text('Recent sessions', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 8),
                if (_loadingHistory)
                  const LinearProgressIndicator()
                else if (_history.isEmpty)
                  const Text('No past interviews yet.', style: TextStyle(color: AppColors.textSecondary))
                else
                  ..._history.map((h) => Card(
                        child: ListTile(
                          title: Text(h.targetRole),
                          subtitle: Text(h.status),
                          trailing: h.score != null ? Text('${h.score}%') : null,
                          onTap: () => context.push('/virtual-interview/${h.id}/report'),
                        ),
                      )),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
