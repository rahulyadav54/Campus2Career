import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool elevated;
  const AppLogo({super.key, this.size = 88, this.elevated = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.26),
        boxShadow: elevated
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.22),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ]
            : null,
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: EdgeInsets.all(size * 0.12),
        child: Image.asset(
          'assets/images/app_icon.png',
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => Icon(
            Icons.school_rounded,
            size: size * 0.5,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
