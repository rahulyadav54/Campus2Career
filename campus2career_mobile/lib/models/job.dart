class Job {
  final String id;
  final String title;
  final String? description;
  final String? company;
  final String? companyName;
  final String? location;
  final String? mode;
  final String? type;
  final num? salaryMin;
  final num? salaryMax;
  final List<String> requiredSkills;
  final List<String> niceToHave;
  final String? experience;
  final String? deadline;
  final DateTime? createdAt;
  final Map<String, dynamic>? raw;

  const Job({
    required this.id,
    required this.title,
    this.description,
    this.company,
    this.companyName,
    this.location,
    this.mode,
    this.type,
    this.salaryMin,
    this.salaryMax,
    this.requiredSkills = const [],
    this.niceToHave = const [],
    this.experience,
    this.deadline,
    this.createdAt,
    this.raw,
  });

  factory Job.fromJson(Map<String, dynamic> j) {
    return Job(
      id: (j['_id'] ?? j['id']).toString(),
      title: (j['title'] ?? '').toString(),
      description: j['description'] as String?,
      company: j['company']?.toString(),
      companyName: (j['companyName'] ?? j['company']?['name'] ?? j['recruiter']?['company'] ?? j['recruiter']?['name'])?.toString(),
      location: j['location']?.toString(),
      mode: j['mode']?.toString() ?? j['workMode']?.toString(),
      type: j['type']?.toString(),
      salaryMin: j['salaryMin'] as num? ?? j['salary']?['min'] as num?,
      salaryMax: j['salaryMax'] as num? ?? j['salary']?['max'] as num?,
      requiredSkills: _toStringList(j['requiredSkills']),
      niceToHave: _toStringList(j['niceToHave'] ?? j['preferredSkills']),
      experience: j['experience']?.toString(),
      deadline: j['deadline']?.toString() ?? j['applyDeadline']?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
      raw: j,
    );
  }

  static List<String> _toStringList(dynamic v) {
    if (v is List) return v.map((e) => e.toString()).toList();
    if (v is String) return v.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    return const [];
  }
}
