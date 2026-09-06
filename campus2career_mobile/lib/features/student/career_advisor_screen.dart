import 'package:flutter/material.dart';
import 'ai_chat_workspace.dart';

class CareerAdvisorScreen extends StatelessWidget {
  const CareerAdvisorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AiChatWorkspace(
      title: 'AI Skill & Career Advisor',
      subtitle: 'History · voice · files · same format as the portal',
      welcome:
          "Hi — I'm **Campus2Career AI Advisor**.\n\nAsk about skill roadmaps, internships, interviews, or placements. You can **speak**, **type**, or **attach a resume/PDF** and I'll analyze it.",
      prompts: [
        'Build me a 4-week placement prep plan',
        'What skills should I add for Data Science?',
        'Review my profile and list skill gaps',
        'How do I prepare for a product-company interview?',
      ],
      thinking: [
        'Analyzing your question…',
        'Reviewing your skill profile…',
        'Mapping career paths and demand…',
        'Drafting a personalized answer…',
      ],
    );
  }
}
