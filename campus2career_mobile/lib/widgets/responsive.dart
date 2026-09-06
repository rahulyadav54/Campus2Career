import 'package:flutter/material.dart';

class AppLayout {
  static double maxContentWidth(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= 1100) return 980;
    if (w >= 800) return 720;
    return w;
  }

  static int gridCount(BuildContext context, {int compact = 2, int medium = 3, int expanded = 4}) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= 900) return expanded;
    if (w >= 600) return medium;
    return compact;
  }

  static EdgeInsets pagePadding(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final h = w >= 600 ? 24.0 : 16.0;
    return EdgeInsets.fromLTRB(h, 12, h, 24);
  }
}

class ConstrainedPage extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const ConstrainedPage({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: AppLayout.maxContentWidth(context)),
        child: Padding(
          padding: padding ?? AppLayout.pagePadding(context),
          child: child,
        ),
      ),
    );
  }
}
