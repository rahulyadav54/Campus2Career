import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/ai_service.dart';

class ResumeImportScreen extends StatefulWidget {
  const ResumeImportScreen({super.key});

  @override
  State<ResumeImportScreen> createState() => _ResumeImportScreenState();
}

class _ResumeImportScreenState extends State<ResumeImportScreen> {
  bool _busy = false;
  Map<String, dynamic>? _result;
  String? _error;

  Future<void> _pick() async {
    final svc = context.read<AiService>();
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx'],
    );
    if (picked == null || picked.files.isEmpty) return;
    final file = picked.files.first;
    if (file.path == null) {
      setState(() => _error = 'Could not read that file on this device.');
      return;
    }
    final path = file.path!;
    final name = file.name;
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final data = await svc.importResume(filePath: path, filename: name);
      if (!mounted) return;
      setState(() => _result = data);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Resume import failed. Use a text-based PDF or DOCX.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final skills = ((_result?['data'] is Map) ? (_result!['data'] as Map)['skills'] : null);
    return Scaffold(
      appBar: AppBar(title: const Text('Import resume')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Upload a PDF or DOCX. Skills, projects, and experience are written to your Campus2Career profile via the API — the website is not loaded in the app.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy ? null : _pick,
            icon: const Icon(Icons.upload_file),
            label: Text(_busy ? 'Importing…' : 'Choose resume'),
          ),
          if (_busy) const Padding(padding: EdgeInsets.only(top: 16), child: LinearProgressIndicator()),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ],
          if (_result != null) ...[
            const SizedBox(height: 20),
            Text(_result!['message']?.toString() ?? 'Imported',
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.success)),
            if (skills is List) ...[
              const SizedBox(height: 12),
              const Text('Extracted skills'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: skills.map((s) => Chip(label: Text(s.toString()))).toList(),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
