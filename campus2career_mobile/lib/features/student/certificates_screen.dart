import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';

class CertificatesScreen extends StatefulWidget {
  const CertificatesScreen({super.key});

  @override
  State<CertificatesScreen> createState() => _CertificatesScreenState();
}

class _CertificatesScreenState extends State<CertificatesScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StudentService>().fetchCertificates();
  }

  Future<void> _open(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Certifications')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingList();
          if (snap.hasError) {
            return ErrorStateView(
                message: 'Could not load certificates.',
                onRetry: () => setState(() => _future = context.read<StudentService>().fetchCertificates()));
          }
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.workspace_premium_outlined,
              title: 'No certificates yet',
              message: 'Add your certifications to strengthen your profile.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = context.read<StudentService>().fetchCertificates()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final c = list[i];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.workspace_premium, color: AppColors.accent),
                    title: Text(c['name']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                        [
                          c['provider']?.toString(),
                          c['issueDate']?.toString(),
                          if (c['credentialId'] != null) 'ID: ${c['credentialId']}'
                        ].whereType<String>().join(' • '),
                        style: const TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.open_in_new, size: 18),
                    onTap: () => _open(c['credentialUrl']?.toString()),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
