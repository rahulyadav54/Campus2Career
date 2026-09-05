class Opportunity {
  final String id;
  final String title;
  final String? description;
  final String type;
  final String? audience;
  final String? providerName;
  final String? providerCompany;
  final List<String> requiredSkills;
  final String? eligibility;
  final String? location;
  final DateTime? deadline;
  final String? link;
  final String? status;
  final DateTime? createdAt;

  const Opportunity({
    required this.id,
    required this.title,
    this.description,
    this.type = 'internship',
    this.audience,
    this.providerName,
    this.providerCompany,
    this.requiredSkills = const [],
    this.eligibility,
    this.location,
    this.deadline,
    this.link,
    this.status,
    this.createdAt,
  });

  factory Opportunity.fromJson(Map<String, dynamic> j) {
    final provider = j['provider'];
    String? pName;
    String? pCompany;
    if (provider is Map) {
      pName = provider['name']?.toString();
      pCompany = provider['company']?.toString();
    }
    return Opportunity(
      id: (j['_id'] ?? j['id']).toString(),
      title: (j['title'] ?? '').toString(),
      description: j['description'] as String?,
      type: (j['type'] ?? 'internship').toString(),
      audience: j['audience']?.toString(),
      providerName: pName,
      providerCompany: pCompany,
      requiredSkills: (j['requiredSkills'] is List)
          ? List<String>.from(j['requiredSkills'].map((e) => e.toString()))
          : const [],
      eligibility: j['eligibility'] as String?,
      location: j['location']?.toString(),
      deadline: j['deadline'] != null ? DateTime.tryParse(j['deadline'].toString()) : null,
      link: j['link']?.toString(),
      status: j['status']?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
    );
  }

  String get displayType {
    final t = type.toLowerCase();
    final map = {
      'internship': 'Internship',
      'job': 'Job',
      'apprenticeship': 'Apprenticeship',
      'training': 'Training',
      'certification': 'Certification',
      'workshop': 'Workshop',
      'mentorship': 'Mentorship',
      'faculty-internship': 'Faculty Internship',
      'fdp': 'FDP',
      'consultancy': 'Consultancy',
      'research': 'Research',
      'live-project': 'Live Project',
      'innovation': 'Innovation',
    };
    return map[t] ?? type;
  }
}
