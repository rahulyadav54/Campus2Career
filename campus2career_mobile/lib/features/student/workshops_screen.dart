import 'package:flutter/material.dart';
import 'collaboration_catalog_screen.dart';

class WorkshopsScreen extends StatelessWidget {
  const WorkshopsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Workshops & lectures'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Workshops'),
            Tab(text: 'Guest lectures'),
          ]),
        ),
        body: const TabBarView(
          children: [
            CollaborationCatalogScreen(title: 'Workshops', type: 'workshops', icon: Icons.cast_for_education, nested: true),
            CollaborationCatalogScreen(title: 'Guest lectures', type: 'guest-lectures', icon: Icons.record_voice_over_outlined, nested: true),
          ],
        ),
      ),
    );
  }
}
