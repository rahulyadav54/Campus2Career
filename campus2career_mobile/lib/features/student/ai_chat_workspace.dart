import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/ai_service.dart';
import '../../../widgets/app_drawer.dart';

class AiChatWorkspace extends StatefulWidget {
  final String title;
  final String subtitle;
  final String welcome;
  final List<String> prompts;
  final List<String> thinking;
  final String instruction;

  const AiChatWorkspace({
    super.key,
    required this.title,
    required this.subtitle,
    required this.welcome,
    required this.prompts,
    required this.thinking,
    this.instruction = '',
  });

  @override
  State<AiChatWorkspace> createState() => _AiChatWorkspaceState();
}

class _AiChatWorkspaceState extends State<AiChatWorkspace> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final _speech = SpeechToText();
  final _tts = FlutterTts();
  late List<_Msg> _messages;
  final List<_Attach> _files = [];
  List<Map<String, dynamic>> _histories = [];
  String? _historyId;
  bool _sending = false;
  bool _listening = false;
  int _speakingIndex = -1;
  int _thinkingStep = 0;
  Timer? _thinkTimer;
  Timer? _typeTimer;
  int _typedIndex = -1;
  String _typedText = '';
  bool _typedDone = true;

  bool get _empty => _messages.length <= 1 && !_sending;

  @override
  void initState() {
    super.initState();
    _messages = [_Msg(role: 'assistant', text: widget.welcome)];
    _tts.setLanguage('en-IN');
    _tts.setSpeechRate(0.47);
    _loadHistories();
  }

  Future<void> _loadHistories() async {
    try {
      final list = await context.read<AiService>().listChatHistories();
      if (mounted) setState(() => _histories = list);
    } catch (_) {}
  }

  Future<void> _newChat() async {
    _typeTimer?.cancel();
    setState(() {
      _historyId = null;
      _messages = [_Msg(role: 'assistant', text: widget.welcome)];
      _typedDone = true;
      _typedIndex = -1;
      _files.clear();
    });
  }

  Future<void> _openHistory(String id) async {
    Navigator.of(context).maybePop();
    try {
      final h = await context.read<AiService>().getChatHistory(id);
      if (!mounted || h == null) return;
      final msgs = (h['messages'] is List)
          ? (h['messages'] as List)
              .whereType<Map>()
              .map((e) => _Msg(role: (e['role'] ?? 'assistant').toString(), text: (e['content'] ?? e['text'] ?? '').toString()))
              .where((m) => m.text.isNotEmpty)
              .toList()
          : <_Msg>[];
      setState(() {
        _historyId = id;
        _messages = msgs.isEmpty ? [_Msg(role: 'assistant', text: widget.welcome)] : msgs;
        _typedDone = true;
        _typedIndex = -1;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not load that chat.')));
    }
  }

  Future<void> _persist() async {
    final payload = _messages.map((m) => {'role': m.role, 'content': m.text}).toList();
    var title = widget.title;
    for (final m in _messages) {
      if (m.role == 'user' && m.text.isNotEmpty) {
        title = m.text.characters.take(42).toString();
        break;
      }
    }
    try {
      _historyId = await context.read<AiService>().saveChatHistory(
            id: _historyId,
            title: title,
            messages: payload,
          );
      await _loadHistories();
    } catch (_) {}
  }

  Future<void> _send(String text) async {
    final trimmed = text.trim();
    final ready = _files.where((f) => f.ready).toList();
    if ((trimmed.isEmpty && ready.isEmpty) || _sending) return;
    _typeTimer?.cancel();
    final userText = trimmed.isEmpty ? 'Please analyze the attached file(s).' : trimmed;
    setState(() {
      _messages.add(_Msg(role: 'user', text: userText, files: ready.map((e) => e.name).toList()));
      _sending = true;
      _thinkingStep = 0;
      _typedDone = true;
      _typedIndex = -1;
      _files.clear();
    });
    _ctrl.clear();
    _thinkTimer?.cancel();
    _thinkTimer = Timer.periodic(const Duration(milliseconds: 1400), (_) {
      if (!mounted) return;
      setState(() => _thinkingStep = (_thinkingStep + 1) % widget.thinking.length);
    });
    _scrollToEnd();
    try {
      final history = _messages
          .map((m) => {'role': m.role, 'content': m.text})
          .toList();
      if (history.isNotEmpty) history.removeLast();
      final trimmedHistory = history.length > 8 ? history.sublist(history.length - 8) : history;
      final outgoing = widget.instruction.isEmpty
          ? userText
          : '${widget.instruction}\n\nStudent message:\n$userText';
      final reply = await context.read<AiService>().chat(
            message: outgoing,
            history: trimmedHistory,
            attachments: ready.map((f) => {'filename': f.name, 'text': f.text}).toList(),
          );
      if (!mounted) return;
      final body = reply.trim().isEmpty ? 'I couldn\'t generate a response. Please try again.' : reply;
      setState(() {
        _messages.add(_Msg(role: 'assistant', text: body));
        _sending = false;
      });
      _startTypewriter(body, _messages.length - 1);
      unawaited(_persist());
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add(_Msg(role: 'assistant', text: 'I couldn\'t reach the AI engine right now. Please try again.'));
        _sending = false;
        _typedDone = true;
      });
    } finally {
      _thinkTimer?.cancel();
      _scrollToEnd();
    }
  }

  void _startTypewriter(String full, int index) {
    _typeTimer?.cancel();
    var i = 0;
    setState(() {
      _typedIndex = index;
      _typedText = '';
      _typedDone = false;
    });
    void tick() {
      if (!mounted) return;
      final step = full.length > 1800 ? 10 : 3;
      i = (i + step).clamp(0, full.length);
      setState(() {
        _typedText = full.substring(0, i);
        _typedDone = i >= full.length;
      });
      _scrollToEnd();
      if (i < full.length) _typeTimer = Timer(const Duration(milliseconds: 14), tick);
    }

    tick();
  }

  Future<void> _pickFile() async {
    if (_files.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You can attach up to 3 files.')));
      return;
    }
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'docx', 'txt', 'md', 'csv'],
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if (file.path == null) return;
    if (!mounted) return;
    final attach = _Attach(name: file.name, path: file.path!);
    setState(() => _files.add(attach));
    try {
      final data = await context.read<AiService>().chatFile(filePath: file.path!, filename: file.name);
      attach.text = (data['text'] ?? '').toString();
      attach.ready = attach.text.isNotEmpty;
      if (mounted) setState(() {});
    } catch (_) {
      if (!mounted) return;
      setState(() => _files.remove(attach));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not read that file.')));
    }
  }

  Future<void> _toggleVoice() async {
    if (_listening) {
      await _speech.stop();
      setState(() => _listening = false);
      return;
    }
    final ok = await _speech.initialize(
      onError: (_) {
        if (mounted) setState(() => _listening = false);
      },
      onStatus: (s) {
        if (s == 'done' || s == 'notListening') {
          if (mounted) setState(() => _listening = false);
        }
      },
    );
    if (!ok) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Microphone is not available. Check permission in Settings.')),
      );
      return;
    }
    if (!mounted) return;
    setState(() => _listening = true);
    await _speech.listen(
      onResult: (r) {
        _ctrl.text = r.recognizedWords;
        _ctrl.selection = TextSelection.collapsed(offset: _ctrl.text.length);
      },
    );
  }

  Future<void> _speak(int index, String markdown) async {
    if (_speakingIndex == index) {
      await _tts.stop();
      setState(() => _speakingIndex = -1);
      return;
    }
    final plain = markdown
        .replaceAll(RegExp(r'```[\s\S]*?```'), ' ')
        .replaceAll(RegExp(r'[`*_#>-]'), ' ')
        .replaceAll(RegExp(r'\[(.*?)\]\((.*?)\)'), r'$1')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (plain.isEmpty) return;
    await _tts.stop();
    setState(() => _speakingIndex = index);
    _tts.setCompletionHandler(() {
      if (mounted) setState(() => _speakingIndex = -1);
    });
    await _tts.speak(plain.characters.take(1200).toString());
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 180), curve: Curves.easeOut);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    _thinkTimer?.cancel();
    _typeTimer?.cancel();
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F8),
      drawer: const AppDrawer(),
      endDrawer: _HistoryDrawer(
        items: _histories,
        currentId: _historyId,
        onNew: () {
          Navigator.pop(context);
          _newChat();
        },
        onOpen: _openHistory,
        onDelete: (id) async {
          await context.read<AiService>().deleteChatHistory(id);
          if (_historyId == id) _newChat();
          await _loadHistories();
        },
      ),
      appBar: AppBar(
        leading: const ShellMenuButton(),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text(widget.subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w400)),
          ],
        ),
        actions: [
          IconButton(tooltip: 'New chat', onPressed: _newChat, icon: const Icon(Icons.add_comment_outlined)),
          Builder(
            builder: (ctx) => IconButton(
              tooltip: 'Chat history',
              onPressed: () => Scaffold.of(ctx).openEndDrawer(),
              icon: const Icon(Icons.history),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: [
                if (_empty) _hero(),
                if (!_empty)
                  ...List.generate(_messages.length, (i) {
                    if (_messages.length == 1 && i == 0) return const SizedBox.shrink();
                    final m = _messages[i];
                    final streaming = _typedIndex == i && !_typedDone;
                    return _ChatRow(
                      mine: m.role == 'user',
                      markdown: streaming ? _typedText : m.text,
                      files: m.files,
                      showCaret: streaming,
                      showSpeak: m.role == 'assistant' && _typedDone,
                      speaking: _speakingIndex == i,
                      onSpeak: () => _speak(i, m.text),
                    );
                  }),
                if (_sending) _ThinkingCard(step: widget.thinking[_thinkingStep]),
              ],
            ),
          ),
          SafeArea(
            child: Container(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Column(
                children: [
                  if (_files.isNotEmpty)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Wrap(
                        spacing: 6,
                        children: _files
                            .map((f) => Chip(
                                  label: Text('${f.name}${f.ready ? '' : ' · reading…'}',
                                      style: const TextStyle(fontSize: 11)),
                                  onDeleted: () => setState(() => _files.remove(f)),
                                ))
                            .toList(),
                      ),
                    ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      IconButton(tooltip: 'Attach file', onPressed: _sending ? null : _pickFile, icon: const Icon(Icons.attach_file)),
                      IconButton(
                        tooltip: 'Voice input',
                        onPressed: _sending ? null : _toggleVoice,
                        icon: Icon(_listening ? Icons.mic : Icons.mic_none, color: _listening ? AppColors.danger : null),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _ctrl,
                          minLines: 1,
                          maxLines: 5,
                          enabled: !_sending,
                          decoration: InputDecoration(
                            hintText: _listening ? 'Listening…' : 'Ask or attach a resume…',
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          onSubmitted: _send,
                        ),
                      ),
                      const SizedBox(width: 6),
                      IconButton.filled(
                        onPressed: _sending ? null : () => _send(_ctrl.text),
                        icon: const Icon(Icons.send_rounded, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hero() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(colors: AppColors.gradientPrimary),
          ),
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
        ),
        const SizedBox(height: 14),
        Text(widget.title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 16),
        ...widget.prompts.map((p) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: AppColors.border),
                ),
                tileColor: Colors.white,
                title: Text(p, style: const TextStyle(fontSize: 13)),
                onTap: () => _send(p),
              ),
            )),
      ],
    );
  }
}

class _HistoryDrawer extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final String? currentId;
  final VoidCallback onNew;
  final ValueChanged<String> onOpen;
  final ValueChanged<String> onDelete;
  const _HistoryDrawer({
    required this.items,
    required this.currentId,
    required this.onNew,
    required this.onOpen,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: FilledButton.icon(
                onPressed: onNew,
                icon: const Icon(Icons.add),
                label: const Text('New chat'),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: items.isEmpty
                  ? const Center(child: Text('Your conversations will show up here.', textAlign: TextAlign.center))
                  : ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (_, i) {
                        final h = items[i];
                        final id = (h['_id'] ?? h['id'] ?? '').toString();
                        return ListTile(
                          selected: id == currentId,
                          leading: const Icon(Icons.chat_bubble_outline, size: 18),
                          title: Text((h['title'] ?? 'Chat').toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18),
                            onPressed: () => onDelete(id),
                          ),
                          onTap: () => onOpen(id),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatRow extends StatelessWidget {
  final bool mine;
  final String markdown;
  final List<String> files;
  final bool showCaret;
  final bool showSpeak;
  final bool speaking;
  final VoidCallback onSpeak;
  const _ChatRow({
    required this.mine,
    required this.markdown,
    required this.files,
    required this.showCaret,
    required this.showSpeak,
    required this.speaking,
    required this.onSpeak,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: mine ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!mine) const _Avatar(ai: true),
          if (!mine) const SizedBox(width: 8),
          Flexible(
            child: mine
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(6),
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(markdown, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.45)),
                        if (files.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(files.join(', '), style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          ),
                      ],
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _MarkdownBody(text: markdown),
                      if (showCaret)
                        Container(
                          width: 8,
                          height: 18,
                          margin: const EdgeInsets.only(top: 4),
                          color: AppColors.primary,
                        ),
                      if (showSpeak)
                        IconButton(
                          tooltip: speaking ? 'Stop' : 'Read aloud',
                          onPressed: onSpeak,
                          icon: Icon(speaking ? Icons.volume_off : Icons.volume_up_outlined, size: 20, color: AppColors.textMuted),
                        ),
                    ],
                  ),
          ),
          if (mine) const SizedBox(width: 8),
          if (mine) const _Avatar(ai: false),
        ],
      ),
    );
  }
}

class _MarkdownBody extends StatelessWidget {
  final String text;
  const _MarkdownBody({required this.text});

  @override
  Widget build(BuildContext context) {
    return MarkdownBody(
      data: text.isEmpty ? ' ' : text,
      selectable: true,
      onTapLink: (text, href, title) async {
        if (href == null) return;
        final uri = Uri.tryParse(href);
        if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
      },
      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
        p: const TextStyle(fontSize: 15, height: 1.75, color: Color(0xFF334155)),
        pPadding: const EdgeInsets.only(bottom: 10),
        h1: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
        h2: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
        h3: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
        strong: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
        listBullet: const TextStyle(fontSize: 15, color: Color(0xFF334155), height: 1.55),
        code: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: Color(0xFF3730A3), backgroundColor: Color(0xFFEEF2FF)),
        codeblockDecoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
        a: const TextStyle(color: AppColors.primary, decoration: TextDecoration.underline),
      ),
    );
  }
}

class _ThinkingCard extends StatelessWidget {
  final String step;
  const _ThinkingCard({required this.step});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const _Avatar(ai: true),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFE0E7FF)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(step, style: const TextStyle(color: Color(0xFF4338CA), fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  const LinearProgressIndicator(minHeight: 6, color: Color(0xFFC7D2FE), backgroundColor: Color(0xFFF1F5F9)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final bool ai;
  const _Avatar({required this.ai});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: ai ? const LinearGradient(colors: AppColors.gradientPrimary) : null,
        color: ai ? null : const Color(0xFF1E293B),
      ),
      child: Icon(ai ? Icons.auto_awesome : Icons.person, color: Colors.white, size: 16),
    );
  }
}

class _Msg {
  final String role;
  final String text;
  final List<String> files;
  _Msg({required this.role, required this.text, this.files = const []});
}

class _Attach {
  final String name;
  final String path;
  String text = '';
  bool ready = false;
  _Attach({required this.name, required this.path});
}
