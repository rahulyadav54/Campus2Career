import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../services/recruiter_service.dart';

class PostJobScreen extends StatefulWidget {
  const PostJobScreen({super.key});

  @override
  State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _location = TextEditingController();
  final _skills = TextEditingController();
  final _salaryMin = TextEditingController();
  final _salaryMax = TextEditingController();
  String _type = 'full-time';
  String _mode = 'onsite';
  bool _busy = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final body = {
        'title': _title.text.trim(),
        'description': _desc.text.trim(),
        'location': _location.text.trim(),
        'type': _type,
        'mode': _mode,
        'requiredSkills': _skills.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
        if (_salaryMin.text.isNotEmpty) 'salaryMin': num.tryParse(_salaryMin.text),
        if (_salaryMax.text.isNotEmpty) 'salaryMax': num.tryParse(_salaryMax.text),
      };
      await context.read<RecruiterService>().createJob(body);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job posted')));
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not post job. Please try again.')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    for (final c in [_title, _desc, _location, _skills, _salaryMin, _salaryMax]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Job')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'Job title'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _desc,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'Description'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _type,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: const [
                        DropdownMenuItem(value: 'full-time', child: Text('Full-time')),
                        DropdownMenuItem(value: 'part-time', child: Text('Part-time')),
                        DropdownMenuItem(value: 'contract', child: Text('Contract')),
                        DropdownMenuItem(value: 'internship', child: Text('Internship')),
                      ],
                      onChanged: (v) => setState(() => _type = v ?? _type),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _mode,
                      decoration: const InputDecoration(labelText: 'Mode'),
                      items: const [
                        DropdownMenuItem(value: 'onsite', child: Text('Onsite')),
                        DropdownMenuItem(value: 'remote', child: Text('Remote')),
                        DropdownMenuItem(value: 'hybrid', child: Text('Hybrid')),
                      ],
                      onChanged: (v) => setState(() => _mode = v ?? _mode),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _skills,
                decoration: const InputDecoration(
                  labelText: 'Required skills (comma-separated)',
                  hintText: 'React, Node.js, SQL',
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _salaryMin,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Salary min'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _salaryMax,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Salary max'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 22, height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Text('Post job'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
