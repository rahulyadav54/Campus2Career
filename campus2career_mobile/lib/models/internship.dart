class Internship {
  final String id;
  final String title;
  final String? company;
  final String? companyName;
  final String? description;
  final String? location;
  final String? mode;
  final String? duration;
  final num? stipend;
  final List<String> requiredSkills;
  final String? deadline;
  final DateTime? createdAt;

  const Internship({
    required this.id,
    required this.title,
    this.company,
    this.companyName,
    this.description,
    this.location,
    this.mode,
    this.duration,
    this.stipend,
    this.requiredSkills = const [],
    this.deadline,
    this.createdAt,
  });

  factory Internship.fromJson(Map<String, dynamic> j) {
    return Internship(
      id: (j['_id'] ?? j['id']).toString(),
      title: (j['title'] ?? '').toString(),
      company: (j['company'] ?? j['provider']?['name'] ?? j['provider']?['company'])?.toString(),
      companyName: (j['companyName'] ?? j['company']?['name'] ?? j['provider']?['name'])?.toString(),
      description: j['description'] as String?,
      location: j['location']?.toString(),
      mode: j['mode']?.toString(),
      duration: j['duration']?.toString(),
      stipend: j['stipend'] as num?,
      requiredSkills: (j['requiredSkills'] is List)
          ? List<String>.from(j['requiredSkills'].map((e) => e.toString()))
          : const [],
      deadline: j['deadline']?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
    );
  }
}
