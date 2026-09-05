import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/api_helper.dart';
import '../../../widgets/state_views.dart';

class AssessmentAttemptScreen extends StatefulWidget {
  final String id;
  const AssessmentAttemptScreen({super.key, required this.id});

  @override
  State<AssessmentAttemptScreen> createState() => _AssessmentAttemptScreenState();
}

class _AssessmentAttemptScreenState extends State<AssessmentAttemptScreen> {
  int _index = 0;
  final Map<int, int> _answers = {};
  bool _submitting = false;

  Future<void> _submit(Map<String, dynamic> assessment) async {
    setState(() => _submitting = true);
    try {
      final api = context.read<ApiHelper>();
      final result = await api.post(
        '/assessments/${widget.id}/submit',
        body: {'answers': _answers.entries.map((e) => {'index': e.key, 'selected': e.value}).toList()},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Submitted')));
      context.pop(result);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not submit')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiHelper>();
    return Scaffold(
      appBar: AppBar(title: const Text('Assessment')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: api.get('/assessments/${widget.id}'),
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) return const ErrorStateView(message: 'Could not load assessment.');
          final a = snap.data ?? {};
          final questions = List<Map<String, dynamic>>.from(a['questions'] ?? const []);
          if (questions.isEmpty) return const EmptyState(icon: Icons.assignment_outlined, title: 'No questions');
          final q = questions[_index];
          final selected = _answers[_index];
          return Column(
            children: [
              LinearProgressIndicator(
                value: (_index + 1) / questions.length,
                backgroundColor: AppColors.divider,
                color: AppColors.primary,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Question ${_index + 1} of ${questions.length}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 8),
                      Text(q['question']?.toString() ?? '',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 14),
                      ...List<Map<String, dynamic>>.from(q['options'] ?? const [])
                          .toList()
                          .asMap()
                          .entries
                          .map((e) => RadioListTile<int>(
                                value: e.key,
                                groupValue: selected,
                                onChanged: (v) => setState(() => _answers[_index] = v!),
                                title: Text(e.value['text']?.toString() ?? ''),
                              )),
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      if (_index > 0)
                        OutlinedButton(
                          onPressed: () => setState(() => _index--),
                          child: const Text('Previous'),
                        ),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: _submitting
                            ? null
                            : () {
                                if (_index < questions.length - 1) {
                                  setState(() => _index++);
                                } else {
                                  _submit(a);
                                }
                              },
                        child: Text(_index < questions.length - 1 ? 'Next' : 'Submit'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
