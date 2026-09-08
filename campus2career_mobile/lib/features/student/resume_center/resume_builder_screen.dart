import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/resume_document.dart';
import '../../../services/resume_optimizer_service.dart';
import '../../../widgets/state_views.dart';

class ResumeBuilderScreen extends StatefulWidget {
  final String resumeId;
  const ResumeBuilderScreen({super.key, required this.resumeId});

  @override
  State<ResumeBuilderScreen> createState() => _ResumeBuilderScreenState();
}

class _ResumeBuilderScreenState extends State<ResumeBuilderScreen> with SingleTickerProviderStateMixin {
  ResumeDocument? _resume;
  bool _loading = true;
  bool _saving = false;
  bool _exporting = false;
  String? _error;
  Timer? _saveTimer;
  late TabController _tabs;
  Map<String, dynamic>? _analysis;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final resume = await context.read<ResumeOptimizerService>().getResume(widget.resumeId);
      if (!mounted) return;
      setState(() => _resume = resume);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not load resume');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> get _content => _resume?.content ?? {};

  void _patchContent(Map<String, dynamic> patch) {
    if (_resume == null) return;
    final next = Map<String, dynamic>.from(_content);
    next.addAll(patch);
    setState(() => _resume = ResumeDocument(
      id: _resume!.id,
      title: _resume!.title,
      templateId: _resume!.templateId,
      targetRole: _resume!.targetRole,
      content: next,
      atsScore: _resume!.atsScore,
      isDefault: _resume!.isDefault,
      updatedAt: _resume!.updatedAt,
    ));
    _scheduleSave();
  }

  void _patchPersonal(Map<String, dynamic> fields) {
    final personal = Map<String, dynamic>.from(_content['personal'] is Map ? _content['personal'] as Map : {});
    personal.addAll(fields);
    _patchContent({'personal': personal});
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 1200), _flushSave);
  }

  Future<void> _flushSave({bool showToast = false}) async {
    if (_resume == null) return;
    _saveTimer?.cancel();
    setState(() => _saving = true);
    try {
      final updated = await context.read<ResumeOptimizerService>().updateResume(
        widget.resumeId,
        title: _resume!.title,
        content: _resume!.content,
        targetRole: _resume!.targetRole,
      );
      if (!mounted) return;
      setState(() => _resume = updated);
      if (showToast) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Resume saved')));
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Save failed')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _export() async {
    setState(() => _exporting = true);
    try {
      await _flushSave();
      final html = await context.read<ResumeOptimizerService>().exportHtml(widget.resumeId);
      await Clipboard.setData(ClipboardData(text: html));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resume exported — HTML copied. Paste in browser & print to PDF.')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Export failed')));
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _analyze() async {
    try {
      final result = await context.read<ResumeOptimizerService>().analyze(widget.resumeId);
      if (!mounted) return;
      setState(() => _analysis = result);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('ATS score: ${result['atsScore'] ?? '—'}/100')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Analysis failed')));
    }
  }

  Future<void> _startInterview() async {
    await _flushSave();
    try {
      final ctx = await context.read<ResumeOptimizerService>().getInterviewContext(widget.resumeId);
      if (!mounted) return;
      context.push('/virtual-interview', extra: {
        'targetRole': ctx['targetRole'] ?? _resume?.targetRole ?? '',
        'jobDescription': ctx['jobDescription'] ?? '',
        'resumeBased': true,
      });
    } catch (_) {
      if (!mounted) return;
      context.push('/virtual-interview');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_error != null || _resume == null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorStateView(message: _error ?? 'Not found', onRetry: _load),
      );
    }

    final p = _content['personal'] is Map ? Map<String, dynamic>.from(_content['personal'] as Map) : <String, dynamic>{};

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: TextEditingController(text: _resume!.title),
          decoration: const InputDecoration(border: InputBorder.none, hintText: 'Resume title'),
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          onSubmitted: (v) {
            setState(() => _resume = ResumeDocument(
              id: _resume!.id,
              title: v,
              templateId: _resume!.templateId,
              targetRole: _resume!.targetRole,
              content: _resume!.content,
              atsScore: _resume!.atsScore,
            ));
            _flushSave();
          },
        ),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(14), child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))
          else
            IconButton(icon: const Icon(Icons.save_outlined), onPressed: () => _flushSave(showToast: true)),
          IconButton(
            icon: _exporting ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.share_outlined),
            onPressed: _exporting ? null : _export,
          ),
          IconButton(icon: const Icon(Icons.mic_none), onPressed: _startInterview),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Edit'),
            Tab(text: 'Preview'),
            Tab(text: 'ATS'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _EditTab(
            personal: p,
            content: _content,
            onPersonal: _patchPersonal,
            onPatch: _patchContent,
          ),
          _PreviewTab(content: _content),
          _AtsTab(analysis: _analysis, onAnalyze: _analyze),
        ],
      ),
    );
  }
}

class _EditTab extends StatelessWidget {
  final Map<String, dynamic> personal;
  final Map<String, dynamic> content;
  final void Function(Map<String, dynamic>) onPersonal;
  final void Function(Map<String, dynamic>) onPatch;

  const _EditTab({
    required this.personal,
    required this.content,
    required this.onPersonal,
    required this.onPatch,
  });

  @override
  Widget build(BuildContext context) {
    final skillCats = content['skillCategories'] is List ? content['skillCategories'] as List : [];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _section('Header'),
        _field('Full name', personal['name']?.toString() ?? '', (v) => onPersonal({'name': v})),
        _field('Tagline', personal['tagline']?.toString() ?? '', (v) => onPersonal({'tagline': v})),
        _field('Email', personal['email']?.toString() ?? '', (v) => onPersonal({'email': v})),
        _field('Phone', personal['phone']?.toString() ?? '', (v) => onPersonal({'phone': v})),
        _field('Location', personal['location']?.toString() ?? '', (v) => onPersonal({'location': v})),
        _field('LinkedIn', personal['linkedin']?.toString() ?? '', (v) => onPersonal({'linkedin': v})),
        _field('GitHub', personal['github']?.toString() ?? '', (v) => onPersonal({'github': v})),
        _section('Professional Summary'),
        _field('Summary', content['summary']?.toString() ?? '', (v) => onPatch({'summary': v}), maxLines: 5),
        _section('Technical Skills'),
        ...skillCats.asMap().entries.map((e) {
          final cat = e.value is Map ? Map<String, dynamic>.from(e.value as Map) : <String, dynamic>{};
          final items = (cat['items'] is List) ? (cat['items'] as List).join(', ') : '';
          return _field(cat['category']?.toString() ?? 'Skills', items, (v) {
            final cats = List.from(skillCats);
            cats[e.key] = {
              ...cat,
              'items': v.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
            };
            onPatch({'skillCategories': cats});
          });
        }),
        _section('Languages'),
        _field('Spoken languages', content['spokenLanguages']?.toString() ?? '', (v) => onPatch({'spokenLanguages': v})),
      ],
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 8),
        child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.primary)),
      );

  Widget _field(String label, String value, ValueChanged<String> onChanged, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: TextEditingController(text: value),
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        onChanged: onChanged,
      ),
    );
  }
}

class _PreviewTab extends StatelessWidget {
  final Map<String, dynamic> content;
  const _PreviewTab({required this.content});

  @override
  Widget build(BuildContext context) {
    final p = content['personal'] is Map ? content['personal'] as Map : {};
    final text = _buildPreviewText();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Text((p['name'] ?? 'YOUR NAME').toString().toUpperCase(),
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
              if ((p['tagline'] ?? '').toString().isNotEmpty)
                Center(child: Text(p['tagline'].toString(), style: const TextStyle(fontSize: 13))),
              const SizedBox(height: 8),
              SelectableText(text, style: const TextStyle(fontSize: 13, height: 1.45)),
            ],
          ),
        ),
      ),
    );
  }

  String _buildPreviewText() {
    final buf = StringBuffer();
    if ((content['summary'] ?? '').toString().isNotEmpty) {
      buf.writeln('PROFESSIONAL SUMMARY\n${content['summary']}\n');
    }
    final cats = content['skillCategories'] is List ? content['skillCategories'] as List : [];
    for (final c in cats) {
      if (c is Map && c['items'] is List && (c['items'] as List).isNotEmpty) {
        buf.writeln('${c['category']}: ${(c['items'] as List).join(', ')}');
      }
    }
    return buf.toString().trim().isEmpty ? 'Start editing to see your resume preview.' : buf.toString();
  }
}

class _AtsTab extends StatelessWidget {
  final Map<String, dynamic>? analysis;
  final VoidCallback onAnalyze;
  const _AtsTab({required this.analysis, required this.onAnalyze});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        FilledButton.icon(onPressed: onAnalyze, icon: const Icon(Icons.analytics_outlined), label: const Text('Analyze ATS compatibility')),
        if (analysis != null) ...[
          const SizedBox(height: 20),
          Center(
            child: Text('${analysis!['atsScore'] ?? '—'}/100',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.primary)),
          ),
          const Center(child: Text('Estimated ATS Compatibility', style: TextStyle(color: AppColors.textSecondary))),
          const SizedBox(height: 16),
          if (analysis!['improvements'] is List)
            ...(analysis!['improvements'] as List).map((e) => ListTile(
                  leading: const Icon(Icons.lightbulb_outline, size: 18),
                  title: Text(e.toString(), style: const TextStyle(fontSize: 13)),
                )),
        ],
      ],
    );
  }
}
