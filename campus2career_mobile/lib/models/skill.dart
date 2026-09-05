class SkillItem {
  final String name;
  final num score;
  final String? level;
  const SkillItem({required this.name, required this.score, this.level});

  factory SkillItem.fromJson(Map<String, dynamic> j) => SkillItem(
        name: (j['name'] ?? j['skill'] ?? '').toString(),
        score: (j['score'] ?? j['proficiency'] ?? 0) as num,
        level: j['level']?.toString(),
      );
}

class SkillProfile {
  final List<SkillItem> skills;
  final List<String> strongSkills;
  final List<String> improveSkills;
  final List<String> industryDemand;
  final num overallScore;
  final String? goal;

  const SkillProfile({
    this.skills = const [],
    this.strongSkills = const [],
    this.improveSkills = const [],
    this.industryDemand = const [],
    this.overallScore = 0,
    this.goal,
  });

  factory SkillProfile.fromJson(Map<String, dynamic> j) {
    return SkillProfile(
      skills: (j['skills'] is List)
          ? j['skills'].map((e) => SkillItem.fromJson(Map<String, dynamic>.from(e))).toList()
          : const [],
      strongSkills: List<String>.from(j['strongSkills'] ?? const []),
      improveSkills: List<String>.from(j['improveSkills'] ?? j['gaps'] ?? const []),
      industryDemand: List<String>.from(j['industryDemand'] ?? const []),
      overallScore: (j['overallScore'] ?? j['score'] ?? 0) as num,
      goal: j['careerGoal']?.toString() ?? j['goal']?.toString(),
    );
  }
}
