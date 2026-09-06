import 'package:flutter/material.dart';
import 'ai_chat_workspace.dart';

class InterviewPrepScreen extends StatelessWidget {
  const InterviewPrepScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AiChatWorkspace(
      title: 'Interview preparation',
      subtitle: 'Mock questions · coaching · voice answers',
      welcome:
          "You're in **mock interview mode**.\n\nI'll ask **one question at a time**, wait for your answer, then give a short **score** and coaching. Prefer campus internship and product-company interviews in India.",
      prompts: [
        'Start a mock HR interview',
        'Ask me a React intern technical question',
        'Coach me on STAR-format answers',
        'Run a behavioral round for a data analyst intern',
      ],
      thinking: [
        'Preparing the next interview question…',
        'Listening for structure and impact…',
        'Scoring your answer…',
        'Writing coaching notes…',
      ],
      instruction:
          'You are running a mock interview. Ask one question at a time, wait for the student answer, then give a short score and coaching with Markdown headings and bullet points. Prefer campus internship and product-company interviews in India.',
    );
  }
}
