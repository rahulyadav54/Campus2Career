import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/errors/failures.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/user.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/student_service.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/cached_avatar.dart';
import '../../../widgets/sign_out_action.dart';
import '../../../widgets/state_views.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _raw;
  bool _loading = true;
  bool _editing = false;
  bool _saving = false;
  String? _error;

  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _year = TextEditingController();
  final _cgpa = TextEditingController();
  final _course = TextEditingController();
  final _spec = TextEditingController();
  final _desc = TextEditingController();
  final _skills = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _year, _cgpa, _course, _spec, _desc, _skills]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<StudentService>().fetchStudentProfile();
      if (!mounted) return;
      _apply(data);
      await context.read<AuthProvider>().refreshProfile();
    } catch (_) {
      if (!mounted) return;
      final user = context.read<AuthProvider>().user;
      if (user != null && user.data.isNotEmpty) {
        _apply(user.data);
      } else {
        setState(() => _error = 'Could not load your profile.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _apply(Map<String, dynamic> data) {
    final user = User.fromJson(data);
    _raw = data;
    _name.text = user.name;
    _phone.text = user.phone ?? '';
    _year.text = user.year;
    _cgpa.text = user.cgpa == 0 ? '' : user.cgpa.toString();
    _course.text = user.course;
    _spec.text = user.specialization;
    _desc.text = user.description;
    _skills.text = user.skills.join(', ');
    setState(() {});
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final updated = await context.read<StudentService>().updateStudentProfile({
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'year': _year.text.trim(),
        'cgpa': num.tryParse(_cgpa.text.trim()) ?? 0,
        'course': _course.text.trim(),
        'specialization': _spec.text.trim(),
        'description': _desc.text.trim(),
        'skills': _skills.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
      });
      if (!mounted) return;
      _apply(updated);
      await context.read<AuthProvider>().refreshProfile();
      if (!mounted) return;
      setState(() => _editing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile saved. Changes are live on the web portal too.')),
      );
    } on AppFailure catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save profile. Try again.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionUser = context.watch<AuthProvider>().user;
    final canEdit = context.watch<AuthProvider>().user?.isStudent ?? true;
    return Scaffold(
      appBar: AppBar(
        leading: const ShellMenuButton(),
        title: const Text('My profile'),
        actions: [
          if (canEdit && !_editing)
            IconButton(
              tooltip: 'Edit profile',
              onPressed: _raw == null ? null : () => setState(() => _editing = true),
              icon: const Icon(Icons.edit_outlined),
            )
          else if (canEdit && _editing)
            TextButton(onPressed: _saving ? null : _save, child: _saving ? const Text('Saving…') : const Text('Save')),
          const SignOutIconButton(),
        ],
      ),
      body: _loading
          ? const LoadingList(count: 4)
          : _error != null && _raw == null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                    children: [
                      _header(sessionUser),
                      const SizedBox(height: 14),
                      if (_editing && canEdit) _editForm() else _readView(),
                      const SizedBox(height: 16),
                      _shortcuts(context),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () => signOut(context),
                        icon: const Icon(Icons.logout),
                        label: const Text('Sign out'),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _header(User? sessionUser) {
    final user = _raw != null ? User.fromJson(_raw!) : sessionUser;
    if (user == null) return const SizedBox.shrink();
    final pct = user.profileCompletion;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                CachedAvatar(name: user.name, url: user.avatar, size: 72),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text(user.email, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      if (user.rollNo.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text('Roll ${user.rollNo}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      ],
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _pill(user.role.toUpperCase(), AppColors.primary),
                          if (user.department.isNotEmpty) _pill(user.department, AppColors.secondary),
                          if (user.year.isNotEmpty) _pill(user.year, AppColors.accent),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (pct > 0) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  const Text('Profile completeness', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  const Spacer(),
                  Text('$pct%', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: LinearProgressIndicator(
                  value: (pct / 100).clamp(0, 1),
                  minHeight: 8,
                  backgroundColor: AppColors.divider,
                  color: AppColors.primary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _readView() {
    final user = User.fromJson(_raw ?? {});
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _section('About', [
          _kv('Phone', user.phone ?? '—'),
          _kv('Course', user.course.isEmpty ? '—' : user.course),
          _kv('Specialization', user.specialization.isEmpty ? '—' : user.specialization),
          _kv('CGPA', user.cgpa == 0 ? '—' : user.cgpa.toString()),
          if (user.description.isNotEmpty) _kv('Bio', user.description),
        ]),
        const SizedBox(height: 12),
        _section(
          'Skills',
          [
            if (user.skills.isEmpty)
              const Text('No skills added yet.', style: TextStyle(color: AppColors.textSecondary))
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: user.skills.map((s) => Chip(label: Text(s, style: const TextStyle(fontSize: 12)))).toList(),
              ),
          ],
        ),
        if (user.experiences.isNotEmpty) ...[
          const SizedBox(height: 12),
          _section(
            'Experience',
            user.experiences
                .map((e) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('${e['role'] ?? e['title'] ?? 'Role'}',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text('${e['company'] ?? ''}'),
                    ))
                .toList(),
          ),
        ],
        if (user.projects.isNotEmpty) ...[
          const SizedBox(height: 12),
          _section(
            'Projects',
            user.projects
                .map((p) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('${p['title'] ?? 'Project'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text('${p['description'] ?? ''}', maxLines: 2, overflow: TextOverflow.ellipsis),
                    ))
                .toList(),
          ),
        ],
        if (user.badges.isNotEmpty) ...[
          const SizedBox(height: 12),
          _section(
            'Badges',
            [
              Wrap(
                spacing: 8,
                children: user.badges.map((b) => Chip(avatar: const Icon(Icons.emoji_events, size: 16), label: Text(b))).toList(),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _editForm() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
            const SizedBox(height: 10),
            TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 10),
            TextField(controller: _year, decoration: const InputDecoration(labelText: 'Year (e.g. 3rd)')),
            const SizedBox(height: 10),
            TextField(
              controller: _cgpa,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'CGPA'),
            ),
            const SizedBox(height: 10),
            TextField(controller: _course, decoration: const InputDecoration(labelText: 'Course')),
            const SizedBox(height: 10),
            TextField(controller: _spec, decoration: const InputDecoration(labelText: 'Specialization')),
            const SizedBox(height: 10),
            TextField(controller: _skills, decoration: const InputDecoration(labelText: 'Skills (comma separated)')),
            const SizedBox(height: 10),
            TextField(controller: _desc, maxLines: 4, decoration: const InputDecoration(labelText: 'About you')),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      if (_raw != null) _apply(_raw!);
                      setState(() => _editing = false);
                    },
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(onPressed: _saving ? null : _save, child: const Text('Save changes')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _shortcuts(BuildContext context) {
    final tiles = [
      ('Applications', Icons.folder_open, '/applications'),
      ('Portfolio', Icons.folder_shared, '/portfolio'),
      ('AI Career Advisor', Icons.auto_awesome, '/career-advisor'),
      ('Courses', Icons.school_outlined, '/courses'),
      ('Notifications', Icons.notifications_outlined, '/notifications'),
      ('About', Icons.info_outline, '/about'),
    ];
    return Card(
      child: Column(
        children: [
          const ListTile(
            title: Text('More', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
          const Divider(height: 1),
          for (var i = 0; i < tiles.length; i++) ...[
            ListTile(
              leading: Icon(tiles[i].$2, color: AppColors.primary, size: 20),
              title: Text(tiles[i].$1),
              trailing: const Icon(Icons.chevron_right, size: 18),
              onTap: () => context.push(tiles[i].$3),
            ),
            if (i < tiles.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(k, style: const TextStyle(color: AppColors.textMuted, fontSize: 13))),
          Expanded(child: Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
