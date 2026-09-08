import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// Subtle press-scale feedback for tappable cards.
class ScaleTap extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  const ScaleTap({super.key, required this.child, this.onTap, this.scale = 0.97});

  @override
  State<ScaleTap> createState() => _ScaleTapState();
}

class _ScaleTapState extends State<ScaleTap> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 100));
    _anim = Tween(begin: 1.0, end: widget.scale).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) {
        _ctrl.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(scale: _anim, child: widget.child),
    );
  }
}

/// Shimmer skeleton for loading states.
class ShimmerBox extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerBox({super.key, required this.width, required this.height, this.borderRadius});

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            gradient: LinearGradient(
              begin: Alignment(-1 + _ctrl.value * 2, 0),
              end: Alignment(_ctrl.value * 2, 0),
              colors: const [
                Color(0xFFE2E8F0),
                Color(0xFFF8FAFC),
                Color(0xFFE2E8F0),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Live / speaking pulse indicator.
class LivePulse extends StatefulWidget {
  final Color color;
  final double size;
  final bool active;

  const LivePulse({super.key, this.color = AppColors.danger, this.size = 12, this.active = true});

  @override
  State<LivePulse> createState() => _LivePulseState();
}

class _LivePulseState extends State<LivePulse> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    if (widget.active) _ctrl.repeat();
  }

  @override
  void didUpdateWidget(covariant LivePulse oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !_ctrl.isAnimating) _ctrl.repeat();
    if (!widget.active) _ctrl.stop();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.active) {
      return Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(color: AppColors.textMuted, shape: BoxShape.circle),
      );
    }
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final scale = 1 + _ctrl.value * 0.6;
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: widget.size * scale,
              height: widget.size * scale,
              decoration: BoxDecoration(
                color: widget.color.withValues(alpha: 0.25 * (1 - _ctrl.value)),
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
            ),
          ],
        );
      },
    );
  }
}

class TypingDots extends StatefulWidget {
  const TypingDots({super.key});

  @override
  State<TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<TypingDots> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final delay = i * 0.2;
            final v = ((_ctrl.value + delay) % 1.0);
            final opacity = 0.3 + (v < 0.5 ? v * 1.4 : (1 - v) * 1.4);
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: opacity.clamp(0.3, 1.0)),
                  shape: BoxShape.circle,
                ),
              ),
            );
          }),
        );
      },
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Gradient? gradient;

  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.gradient});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        gradient: gradient ?? const LinearGradient(colors: AppColors.gradientPrimary),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class CopilotBanner extends StatelessWidget {
  final VoidCallback onResume;
  final VoidCallback onInterview;

  const CopilotBanner({super.key, required this.onResume, required this.onInterview});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    LivePulse(size: 8, color: Colors.white),
                    SizedBox(width: 6),
                    Text('AI COPILOT', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Your career command center',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Build resumes, practice interviews, and match jobs — all in one place.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.88), fontSize: 13, height: 1.35)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: onResume,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(42),
                  ),
                  child: const Text('Resume Center'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: onInterview,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white70),
                    minimumSize: const Size.fromHeight(42),
                  ),
                  child: const Text('Interview'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
