import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/errors/failures.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/api_helper.dart';
import '../../../widgets/app_logo.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _department = TextEditingController();
  final _rollNo = TextEditingController();
  final _cgpa = TextEditingController();
  final _company = TextEditingController();
  final _institution = TextEditingController();
  final _designation = TextEditingController();
  String _role = 'student';
  String _year = '3rd';
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final api = context.read<ApiHelper>();
      final email = _email.text.trim().toLowerCase();
      Map<String, dynamic> body;
      String path;
      if (_role == 'student') {
        path = '/auth/register-student';
        body = {
          'name': _name.text.trim(),
          'email': email,
          'password': _password.text,
          'phone': _phone.text.trim(),
          'department': _department.text.trim(),
          'year': _year,
          'rollNo': _rollNo.text.trim().toUpperCase(),
          'cgpa': double.tryParse(_cgpa.text.trim()) ?? 0,
          'skills': <String>[],
        };
      } else {
        path = '/auth/register';
        body = {
          'name': _name.text.trim(),
          'email': email,
          'password': _password.text,
          'phone': _phone.text.trim(),
          'role': _role,
          if (_role == 'recruiter') 'company': _company.text.trim(),
          if (_role == 'academician') 'institution': _institution.text.trim(),
          if (_role == 'academician') 'designation': _designation.text.trim(),
        };
      }
      final data = await api.post(path, body: body);
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      final token = data is Map ? data['token'] : null;
      if (token is String && token.isNotEmpty) {
        final signedIn = await auth.completeRegistration(data);
        if (!mounted) return;
        if (signedIn) {
          context.go('/home');
          return;
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_role == 'student'
              ? 'Account created. You can sign in now.'
              : 'Account created. Sign in after an admin approves your account.'),
        ),
      );
      context.go('/login');
    } on AppFailure catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Registration failed. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _department.dispose();
    _rollNo.dispose();
    _cgpa.dispose();
    _company.dispose();
    _institution.dispose();
    _designation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AppLogo(size: 84)),
                const SizedBox(height: 16),
                const Text(
                  'Join Campus2Career',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Create a student, recruiter, or academician account',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: _role,
                  decoration: const InputDecoration(labelText: 'Account type'),
                  items: const [
                    DropdownMenuItem(value: 'student', child: Text('Student')),
                    DropdownMenuItem(value: 'recruiter', child: Text('Recruiter')),
                    DropdownMenuItem(value: 'academician', child: Text('Academician')),
                  ],
                  onChanged: (v) => setState(() => _role = v ?? 'student'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(labelText: 'Full name'),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                  validator: (v) => v == null || v.trim().length < 10 ? 'Enter a valid phone' : null,
                ),
                if (_role == 'student') ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _department,
                    decoration: const InputDecoration(labelText: 'Department'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Department is required' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _year,
                    decoration: const InputDecoration(labelText: 'Year'),
                    items: const [
                      DropdownMenuItem(value: '1st', child: Text('1st year')),
                      DropdownMenuItem(value: '2nd', child: Text('2nd year')),
                      DropdownMenuItem(value: '3rd', child: Text('3rd year')),
                      DropdownMenuItem(value: '4th', child: Text('4th year')),
                    ],
                    onChanged: (v) => setState(() => _year = v ?? '3rd'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _rollNo,
                    decoration: const InputDecoration(labelText: 'Roll number'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Roll number is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _cgpa,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'CGPA (out of 10)'),
                    validator: (v) {
                      final n = double.tryParse(v ?? '');
                      if (n == null || n < 0 || n > 10) return 'Enter CGPA between 0 and 10';
                      return null;
                    },
                  ),
                ],
                if (_role == 'recruiter') ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _company,
                    decoration: const InputDecoration(labelText: 'Company'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Company is required' : null,
                  ),
                ],
                if (_role == 'academician') ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _institution,
                    decoration: const InputDecoration(labelText: 'Institution'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Institution is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _designation,
                    decoration: const InputDecoration(labelText: 'Designation'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Designation is required' : null,
                  ),
                ],
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password (min 8 characters)'),
                  validator: (v) => v == null || v.length < 8 ? 'Min 8 characters' : null,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : const Text('Create account'),
                ),
              ],
            ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
