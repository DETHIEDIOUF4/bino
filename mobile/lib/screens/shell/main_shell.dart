import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class MainShell extends StatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  void _navigate(int i, bool isDriver) {
    setState(() => _index = i);
    if (isDriver) {
      switch (i) {
        case 0:
          context.go('/home');
        case 1:
          context.go('/bookings');
        case 2:
          context.go('/driver-requests');
        case 3:
          context.go('/profile');
      }
    } else {
      switch (i) {
        case 0:
          context.go('/home');
        case 1:
          context.go('/bookings');
        case 2:
          context.go('/profile');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isDriver = user?.isDriver == true;

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => _navigate(i, isDriver),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Accueil'),
          const NavigationDestination(icon: Icon(Icons.route_outlined), selectedIcon: Icon(Icons.route), label: 'Trajets'),
          if (isDriver)
            const NavigationDestination(icon: Icon(Icons.inbox_outlined), selectedIcon: Icon(Icons.inbox), label: 'Demandes'),
          const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
      floatingActionButton: user?.isApprovedDriver == true
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/create-trip'),
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.add_road, color: Colors.white),
              label: const Text('Proposer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            )
          : null,
    );
  }
}
