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
  final String? stipend;
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
    this.stipend,
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
      company: j['company'] is String ? j['company'] as String : null,
      companyName: _companyName(j),
      location: j['location']?.toString(),
      mode: j['mode']?.toString() ?? j['workMode']?.toString(),
      type: j['type']?.toString(),
      salaryMin: j['salaryMin'] as num? ?? (j['salary'] is Map ? j['salary']['min'] as num? : null),
      salaryMax: j['salaryMax'] as num? ?? (j['salary'] is Map ? j['salary']['max'] as num? : null),
      stipend: j['stipend']?.toString(),
      requiredSkills: _toStringList(j['skillsRequired'] ?? j['requiredSkills']),
      niceToHave: _toStringList(j['niceToHave'] ?? j['preferredSkills']),
      experience: j['experience']?.toString(),
      deadline: j['deadline']?.toString() ?? j['applyDeadline']?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
      raw: j,
    );
  }

  static String? _companyName(Map<String, dynamic> j) {
    if (j['companyName'] != null) return j['companyName'].toString();
    final company = j['company'];
    if (company is Map) return (company['name'] ?? company['displayName'])?.toString();
    if (company is String && company.isNotEmpty) return company;
    final recruiter = j['recruiter'];
    if (recruiter is Map) {
      return (recruiter['company'] ?? recruiter['name'])?.toString();
    }
    return null;
  }

  static List<String> _toStringList(dynamic v) {
    if (v is List) return v.map((e) => e.toString()).toList();
    if (v is String) return v.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    return const [];
  }
}
