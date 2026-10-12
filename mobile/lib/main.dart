import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/shell/main_shell.dart';
import 'screens/home/home_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/trips/search_trip_screen.dart';
import 'screens/trips/create_trip_screen.dart';
import 'screens/trips/trip_tracking_screen.dart';
import 'screens/trips/rating_screen.dart';
import 'screens/trips/driver_requests_screen.dart';
import 'screens/trips/my_bookings_screen.dart';
import 'screens/trips/booking_detail_screen.dart';
import 'widgets/booking_alert_listener.dart';

import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_CA', null);
  runApp(const AidaFallApp());
}

class AidaFallApp extends StatelessWidget {
  const AidaFallApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp.router(
        title: 'AidaFALL',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        builder: (context, child) => BookingAlertListener(child: child),
        routerConfig: _router,
      ),
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/bookings', builder: (context, state) => const MyBookingsScreen()),
        GoRoute(path: '/driver-requests', builder: (context, state) => const DriverRequestsScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
      ],
    ),
    GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
    GoRoute(path: '/search', builder: (context, state) => const SearchTripScreen()),
    GoRoute(path: '/create-trip', builder: (context, state) => const CreateTripScreen()),
    GoRoute(path: '/ratings', builder: (context, state) => const RatingScreen()),
    GoRoute(
      path: '/booking/:id',
      builder: (context, state) => BookingDetailScreen(bookingId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/tracking/:tripId/:role',
      builder: (context, state) {
        final tripId = state.pathParameters['tripId']!;
        final role = state.pathParameters['role']!;
        final bookingId = state.uri.queryParameters['bookingId'];
        return TripTrackingScreen(
          tripId: tripId,
          isDriver: role == 'driver',
          bookingId: bookingId,
        );
      },
    ),
  ],
);
