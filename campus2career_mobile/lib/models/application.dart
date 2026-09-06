class Application {
  final String id;
  final String type;
  final String status;
  final String? jobId;
  final String? internshipId;
  final String? opportunityId;
  final String? title;
  final String? company;
  final DateTime? appliedAt;
  final DateTime? updatedAt;

  const Application({
    required this.id,
    required this.type,
    required this.status,
    this.jobId,
    this.internshipId,
    this.opportunityId,
    this.title,
    this.company,
    this.appliedAt,
    this.updatedAt,
  });

  factory Application.fromJson(Map<String, dynamic> j) {
    DateTime? parseDate(dynamic v) => v != null ? DateTime.tryParse(v.toString()) : null;
    return Application(
      id: (j['_id'] ?? j['id']).toString(),
      type: (j['type'] ?? j['opportunityType'] ?? 'job').toString(),
      status: (j['status'] ?? 'applied').toString(),
      jobId: j['job'] is Map ? j['job']['_id']?.toString() : j['job']?.toString(),
      internshipId:
          j['internship'] is Map ? j['internship']['_id']?.toString() : j['internship']?.toString(),
      opportunityId: j['opportunity']?.toString() ?? j['opportunityId']?.toString(),
      title: (j['title'] ?? j['job']?['title'] ?? j['internship']?['title'])?.toString(),
      company: _company(j),
      appliedAt: parseDate(j['appliedAt'] ?? j['createdAt']),
      updatedAt: parseDate(j['updatedAt']),
    );
  }

  static String? _company(Map<String, dynamic> j) {
    if (j['company'] != null) return j['company'].toString();
    final job = j['job'];
    if (job is Map) {
      if (job['companyName'] != null) return job['companyName'].toString();
      if (job['company'] is String) return job['company'] as String;
      if (job['company'] is Map) return job['company']['name']?.toString();
      final rec = job['recruiter'];
      if (rec is Map) return (rec['company'] ?? rec['name'])?.toString();
    }
    final rec = j['recruiter'];
    if (rec is Map) return (rec['company'] ?? rec['name'])?.toString();
    return j['internship'] is Map ? j['internship']['companyName']?.toString() : null;
  }

  bool get isOpen =>
      !{'selected', 'rejected', 'withdrawn', 'closed'}.contains(status.toLowerCase());
}
