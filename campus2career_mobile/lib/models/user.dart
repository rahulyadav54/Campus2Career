class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? avatar;
  final String? phone;
  final Map<String, dynamic>? profile;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar,
    this.phone,
    this.profile,
  });

  factory User.fromJson(Map<String, dynamic> j) {
    return User(
      id: (j['_id'] ?? j['id']).toString(),
      name: (j['name'] ?? '').toString(),
      email: (j['email'] ?? '').toString(),
      role: (j['role'] ?? 'student').toString(),
      avatar: j['avatar'] as String?,
      phone: j['phone'] as String?,
      profile: j['profile'] is Map ? Map<String, dynamic>.from(j['profile']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'role': role,
        'avatar': avatar,
        'phone': phone,
        'profile': profile,
      };

  bool get isStudent => role == 'student';
  bool get isRecruiter => role == 'recruiter';
  bool get isAcademician => role == 'academician';
  bool get isMentor => role == 'mentor';
  bool get isInstitution => role == 'institution';
}
