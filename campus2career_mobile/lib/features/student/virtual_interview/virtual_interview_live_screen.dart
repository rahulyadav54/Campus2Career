import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/interview_session.dart';
import '../../../services/interview_service.dart';
import '../../../widgets/interactive_ui.dart';

class VirtualInterviewLiveScreen extends StatefulWidget {
  final String sessionId;
  const VirtualInterviewLiveScreen({super.key, required this.sessionId});

  @override
  State<VirtualInterviewLiveScreen> createState() => _VirtualInterviewLiveScreenState();
}

class _VirtualInterviewLiveScreenState extends State<VirtualInterviewLiveScreen> {
  final _speech = SpeechToText();
  final _tts = FlutterTts();
  final _answerCtrl = TextEditingController();

  InterviewStartResult? _start;
  String _phase = 'welcome';
  String _currentQuestion = '';
  int _questionIndex = 0;
  bool _waitingReady = true;
  bool _listening = false;
  bool _processing = false;
  bool _speaking = false;
  String _status = 'Interviewer is speaking…';
  int? _lastScore;
  Timer? _timer;
  int _elapsedSec = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSec++);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootSession());
  }

  Future<void> _bootSession() async {
    if (!mounted) return;
    try {
      await _tts.setLanguage('en-IN');
      await _tts.setSpeechRate(0.48);
      _tts.setCompletionHandler(() {
        if (mounted) setState(() => _speaking = false);
      });
    } catch (e) {
      debugPrint('TTS init failed: $e');
    }

    final extra = GoRouterState.of(context).extra;
    if (extra is InterviewStartResult) {
      _start = extra;
      _currentQuestion = extra.questionText;
      _waitingReady = extra.waitForReady;
      if (mounted) setState(() {});
      await _speak(extra.speakText);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _answerCtrl.dispose();
    unawaited(_tts.stop().catchError((_) {}));
    unawaited(_speech.stop().catchError((_) {}));
    super.dispose();
  }

  Future<void> _speak(String text) async {
    if (text.trim().isEmpty) return;
    if (mounted) {
      setState(() {
        _speaking = true;
        _status = 'Interviewer is speaking…';
      });
    }
    try {
      await _tts.stop();
      await _tts.speak(text);
    } catch (e) {
      debugPrint('TTS speak failed: $e');
      if (mounted) setState(() => _speaking = false);
    }
  }

  Future<void> _confirmReady() async {
    setState(() => _processing = true);
    try {
      final turn = await context.read<InterviewService>().confirmReady(widget.sessionId);
      if (!mounted) return;
      setState(() {
        _waitingReady = false;
        _phase = 'interview';
        _currentQuestion = turn.questionText;
        _questionIndex = turn.questionIndex;
        _status = 'Your turn — answer the question';
      });
      await _speak(turn.speakText);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not start — try again')));
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _toggleListen() async {
    if (_listening) {
      try {
        await _speech.stop();
      } catch (_) {}
      if (mounted) setState(() => _listening = false);
      return;
    }
    try {
      final available = await _speech.initialize(
        onError: (_) {
          if (mounted) setState(() => _listening = false);
        },
        onStatus: (s) {
          if ((s == 'done' || s == 'notListening') && mounted) {
            setState(() => _listening = false);
          }
        },
      );
      if (!available) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone not available. Enable mic permission in Settings.')),
        );
        return;
      }
      if (!mounted) return;
      setState(() => _listening = true);
      await _speech.listen(
        onResult: (r) => _answerCtrl.text = r.recognizedWords,
        listenOptions: SpeechListenOptions(listenMode: ListenMode.confirmation),
      );
    } catch (e) {
      debugPrint('STT failed: $e');
      if (mounted) {
        setState(() => _listening = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Voice input failed on this device. Type your answer instead.')),
        );
      }
    }
  }

  Future<void> _submit() async {
    final text = _answerCtrl.text.trim();
    if (text.isEmpty || _processing) return;
    setState(() {
      _processing = true;
      _status = 'Analyzing your answer…';
    });
    await _speech.stop();
    setState(() => _listening = false);
    try {
      final turn = await context.read<InterviewService>().submitAnswer(
        sessionId: widget.sessionId,
        transcript: text,
        questionIndex: _questionIndex,
      );
      if (!mounted) return;
      setState(() {
        _currentQuestion = turn.questionText;
        _questionIndex = turn.questionIndex;
        _lastScore = turn.overallScore;
        _answerCtrl.clear();
        _status = turn.overallScore != null ? 'Score: ${turn.overallScore}/100' : 'Next question';
      });
      await Future.delayed(Duration(milliseconds: turn.thinkingPauseMs));
      await _speak(turn.speakText);
      if (mounted) setState(() => _status = 'Your turn — answer the question');
      HapticFeedback.lightImpact();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not submit answer')));
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _end() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('End interview?'),
        content: const Text('You will receive a performance report.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Continue')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('End & report')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _processing = true);
    try {
      await context.read<InterviewService>().endInterview(widget.sessionId);
      if (!mounted) return;
      context.go('/virtual-interview/${widget.sessionId}/report');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not end interview')));
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_start?.candidateName.isNotEmpty == true ? 'Interview' : 'Live interview'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: Text('${_elapsedSec ~/ 60}:${(_elapsedSec % 60).toString().padLeft(2, '0')}', style: const TextStyle(fontWeight: FontWeight.w600))),
          ),
          TextButton(onPressed: _end, child: const Text('End')),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(color: Colors.white30, width: 2),
                        ),
                        child: Icon(_speaking ? Icons.record_voice_over : Icons.person_outline, color: Colors.white, size: 44),
                      ),
                      if (_speaking || _processing)
                        const Positioned(right: 4, top: 4, child: LivePulse(size: 14, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_speaking || _processing) ...[
                        const TypingDots(),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Text(
                          _status,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.92), fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  if (_lastScore != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('Last answer: $_lastScore/100', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_waitingReady) ...[
                    const Text('Welcome! The interviewer will greet you. Tap when ready to begin.', style: TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _processing ? null : _confirmReady, child: const Text("I'm ready")),
                  ] else ...[
                    const Text('Current question', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(_currentQuestion.isNotEmpty ? _currentQuestion : 'Listening…', style: const TextStyle(fontSize: 15, height: 1.4)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _answerCtrl,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Your answer',
                        hintText: 'Type or use the mic button…',
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (!_waitingReady)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  FloatingActionButton(
                    heroTag: 'mic',
                    onPressed: _speaking || _processing ? null : _toggleListen,
                    backgroundColor: _listening ? AppColors.danger : AppColors.primary,
                    child: Icon(_listening ? Icons.stop : Icons.mic),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _processing || _speaking ? null : _submit,
                      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      child: Text(_processing ? 'Processing…' : 'Submit answer'),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
