import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/app_navigator.dart';
import '../providers/auth_provider.dart';

Future<void> signOut(BuildContext context) async {
  final auth = context.read<AuthProvider>();
  final overlayContext = appNavigatorKey.currentContext ?? context;
  final ok = await showDialog<bool>(
    context: overlayContext,
    useRootNavigator: true,
    builder: (ctx) => AlertDialog(
      title: const Text('Sign out?'),
      content: const Text('You will need to sign in again to use Campus2Career.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign out')),
      ],
    ),
  );
  if (ok != true) return;

  await auth.logout();

  WidgetsBinding.instance.addPostFrameCallback((_) {
    final nav = appNavigatorKey.currentContext;
    if (nav != null && nav.mounted) {
      GoRouter.of(nav).go('/login');
    }
  });
}

class SignOutIconButton extends StatelessWidget {
  const SignOutIconButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Sign out',
      icon: const Icon(Icons.logout_rounded),
      onPressed: () => signOut(context),
    );
  }
}
