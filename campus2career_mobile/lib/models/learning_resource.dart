class LearningResource {
  final String id;
  final String title;
  final String? provider;
  final String? description;
  final String? category;
  final String? level;
  final String? url;
  final bool free;
  final bool certification;
  final List<String> skills;
  final String? thumbnail;

  const LearningResource({
    required this.id,
    required this.title,
    this.provider,
    this.description,
    this.category,
    this.level,
    this.url,
    this.free = false,
    this.certification = false,
    this.skills = const [],
    this.thumbnail,
  });

  factory LearningResource.fromJson(Map<String, dynamic> j) => LearningResource(
        id: (j['_id'] ?? j['id']).toString(),
        title: (j['title'] ?? j['name'] ?? '').toString(),
        provider: (j['provider'] ?? j['platform'])?.toString(),
        description: j['description'] as String?,
        category: j['category']?.toString(),
        level: j['level']?.toString(),
        url: (j['url'] ?? j['link'])?.toString(),
        free: j['free'] == true || j['isFree'] == true,
        certification: j['certification'] == true || j['hasCertificate'] == true,
        skills: j['skills'] is List ? List<String>.from(j['skills']) : const [],
        thumbnail: j['thumbnail'] as String? ?? j['image'] as String?,
      );
}
