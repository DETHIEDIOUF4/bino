import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../services/onboarding_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  final _pages = const [
    _OnboardingPage(
      icon: Icons.people_alt_rounded,
      iconColor: Color(0xFF1A6B4A),
      bgColor: Color(0xFFE8F5EF),
      title: 'Voyagez ensemble',
      subtitle: 'Partagez vos trajets quotidiens et divisez les frais entre voisins et collègues.',
      tag: 'Économique',
    ),
    _OnboardingPage(
      icon: Icons.auto_awesome_rounded,
      iconColor: Color(0xFF0D9488),
      bgColor: Color(0xFFCCFBF1),
      title: 'Matching intelligent',
      subtitle: 'Notre IA trouve le conducteur idéal selon votre trajet, horaire et budget.',
      tag: 'IA',
    ),
    _OnboardingPage(
      icon: Icons.verified_user_rounded,
      iconColor: Color(0xFF2563EB),
      bgColor: Color(0xFFDBEAFE),
      title: 'Simple et sécurisé',
      subtitle: 'Conducteurs vérifiés, suivi GPS en direct et évaluations après chaque trajet.',
      tag: 'Fiable',
    ),
    _OnboardingPage(
      icon: Icons.eco_rounded,
      iconColor: Color(0xFF059669),
      bgColor: Color(0xFFD1FAE5),
      title: 'Prêt à partir ?',
      subtitle: 'Rejoignez la communauté AidaFALL et commencez à économiser dès aujourd\'hui.',
      tag: 'Communauté',
      isLast: true,
    ),
  ];

  Future<void> _finish() async {
    await OnboardingService.markCompleted();
    if (mounted) context.go('/login');
  }

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeOutCubic);
    } else {
      _finish();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white, Color(0xFFF0FDF4)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.directions_car_filled, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Text('AidaFALL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary)),
                      ],
                    ),
                    if (_page < _pages.length - 1)
                      TextButton(onPressed: _finish, child: const Text('Passer', style: TextStyle(color: AppColors.textMuted))),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) => _pages[i],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_pages.length, (i) {
                        final active = i == _page;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: active ? 28 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: active ? AppColors.primary : const Color(0xFFD1D5DB),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _next,
                        child: Text(
                          _page == _pages.length - 1 ? 'Commencer' : 'Continuer',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;
  final String subtitle;
  final String tag;
  final bool isLast;

  const _OnboardingPage({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
    required this.subtitle,
    required this.tag,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: double.infinity,
            height: 280,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(32),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(top: 30, right: 30, child: _dot(60, iconColor.withValues(alpha: 0.1))),
                Positioned(bottom: 40, left: 40, child: _dot(40, iconColor.withValues(alpha: 0.08))),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: iconColor.withValues(alpha: 0.2), blurRadius: 30, offset: const Offset(0, 10))],
                      ),
                      child: Icon(icon, size: 48, color: iconColor),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(tag, style: TextStyle(fontWeight: FontWeight.w700, color: iconColor, fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.2, color: AppColors.text),
          ),
          const SizedBox(height: 14),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, color: AppColors.textMuted, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _dot(double size, Color color) {
    return Container(width: size, height: size, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  }
}
