class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? avatar;
  final String? phone;
  final Map<String, dynamic> data;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar,
    this.phone,
    this.data = const {},
  });

  factory User.fromJson(Map<String, dynamic> j) {
    final image = (j['profileImage'] ?? j['avatar'])?.toString();
    return User(
      id: (j['_id'] ?? j['id'] ?? '').toString(),
      name: (j['name'] ?? '').toString(),
      email: (j['email'] ?? '').toString(),
      role: (j['role'] ?? 'student').toString(),
      avatar: (image != null && image.isNotEmpty) ? image : null,
      phone: j['phone']?.toString(),
      data: Map<String, dynamic>.from(j),
    );
  }

  String get department => (data['department'] ?? '').toString();
  String get year => (data['year'] ?? '').toString();
  String get rollNo => (data['rollNo'] ?? '').toString();
  String get course => (data['course'] ?? '').toString();
  String get specialization => (data['specialization'] ?? '').toString();
  String get description => (data['description'] ?? '').toString();
  String get institution => (data['institution'] ?? data['company'] ?? '').toString();
  num get cgpa => data['cgpa'] is num ? data['cgpa'] as num : num.tryParse('${data['cgpa']}') ?? 0;
  int get profileCompletion =>
      data['profileCompletion'] is num ? (data['profileCompletion'] as num).round() : 0;
  List<String> get skills => data['skills'] is List
      ? (data['skills'] as List).map((e) => e.toString()).toList()
      : const [];
  List<String> get badges => data['badges'] is List
      ? (data['badges'] as List).map((e) => e.toString()).toList()
      : const [];
  Map<String, dynamic> get socialLinks =>
      data['socialLinks'] is Map ? Map<String, dynamic>.from(data['socialLinks']) : {};
  List<Map<String, dynamic>> get projects => data['projects'] is List
      ? (data['projects'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : const [];
  List<Map<String, dynamic>> get experiences => data['experiences'] is List
      ? (data['experiences'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : const [];
  List<Map<String, dynamic>> get certifications => data['certifications'] is List
      ? (data['certifications'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : const [];

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'role': role,
        'avatar': avatar,
        'phone': phone,
        ...data,
      };

  bool get isStudent => role == 'student';
  bool get isRecruiter => role == 'recruiter';
  bool get isAcademician => role == 'academician';
  bool get isMentor => role == 'mentor';
  bool get isInstitution => role == 'institution';
}
