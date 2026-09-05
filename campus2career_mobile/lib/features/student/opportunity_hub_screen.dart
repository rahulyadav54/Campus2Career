import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/opportunity.dart';
import '../../../services/student_service.dart';
import '../../../widgets/state_views.dart';
import 'package:url_launcher/url_launcher.dart';

class OpportunityHubScreen extends StatefulWidget {
  const OpportunityHubScreen({super.key});

  @override
  State<OpportunityHubScreen> createState() => _OpportunityHubScreenState();
}

class _OpportunityHubScreenState extends State<OpportunityHubScreen> {
  late Future<List<Opportunity>> _future;
  String? _selectedType;

  final List<String> _categories = [
    'all',
    'internship',
    'job',
    'training',
    'certification',
    'workshop',
    'mentorship',
    'live-project',
    'research',
    'innovation',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() => _future = context.read<StudentService>().fetchOpportunities(type: _selectedType));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Opportunity Hub'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _categories[i];
                final selected = _selectedType == (cat == 'all' ? null : cat);
                return ChoiceChip(
                  label: Text(cat == 'all' ? 'All' : cat.replaceAll('-', ' ')),
                  selected: selected,
                  onSelected: (_) {
                    setState(() => _selectedType = cat == 'all' ? null : cat);
                    _load();
                  },
                  backgroundColor: AppColors.surface,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    color: selected ? Colors.white : AppColors.textSecondary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                );
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => _load(),
              child: FutureBuilder<List<Opportunity>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) return const LoadingList(count: 6);
                  if (snap.hasError) {
                    return ErrorStateView(
                      message: 'Could not load opportunities.',
                      onRetry: _load,
                    );
                  }
                  final list = snap.data ?? [];
                  if (list.isEmpty) {
                    return const EmptyState(
                      icon: Icons.explore_outlined,
                      title: 'No opportunities in this category',
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final o = list[i];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => _apply(o),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        o.title,
                                        style: const TextStyle(
                                            fontSize: 15, fontWeight: FontWeight.w700),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(o.displayType,
                                          style: const TextStyle(
                                              color: AppColors.primary,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                if (o.providerName != null || o.providerCompany != null)
                                  Text(
                                    o.providerCompany ?? o.providerName ?? '',
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                  ),
                                if (o.location != null)
                                  Text('Location: ${o.location}',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                if (o.deadline != null)
                                  Text('Deadline: ${o.deadline!.toLocal().toString().split(".")[0]}',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                if (o.requiredSkills.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: o.requiredSkills
                                        .take(5)
                                        .map((s) => Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.background,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: AppColors.border),
                                              ),
                                              child: Text(s,
                                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                            ))
                                        .toList(),
                                  ),
                                ],
                                if (o.link != null && o.link!.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  TextButton.icon(
                                    onPressed: () => _launchUrl(o.link!),
                                    icon: const Icon(Icons.open_in_new, size: 14),
                                    label: const Text('Open link'),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _apply(Opportunity o) async {
    try {
      await context.read<StudentService>().applyToOpportunity(o.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not apply: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
