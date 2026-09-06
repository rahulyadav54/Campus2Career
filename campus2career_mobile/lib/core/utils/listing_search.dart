bool listingMatchesQuery({
  required String query,
  required String title,
  String? description,
  String? location,
  String? company,
  String? type,
  String? stipend,
  List<String> skills = const [],
}) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return true;
  bool has(String? value) => (value ?? '').toLowerCase().contains(q);
  if (has(title) || has(description) || has(location) || has(company) || has(type) || has(stipend)) {
    return true;
  }
  return skills.any((skill) => skill.toLowerCase().contains(q));
}

bool looksLikeInternship({
  String? title,
  String? type,
  String? duration,
  String? description,
}) {
  final blob = '${title ?? ''} ${type ?? ''} ${duration ?? ''} ${description ?? ''}'.toLowerCase();
  return blob.contains('intern');
}
