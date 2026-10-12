import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class TripTrackingScreen extends StatefulWidget {
  final String tripId;
  final bool isDriver;
  final String? bookingId;
  const TripTrackingScreen({super.key, required this.tripId, required this.isDriver, this.bookingId});

  @override
  State<TripTrackingScreen> createState() => _TripTrackingScreenState();
}

class _TripTrackingScreenState extends State<TripTrackingScreen> {
  GoogleMapController? _mapController;
  LatLng? _driverPos;
  LatLng? _pickupPos;
  LatLng? _dropoffPos;
  Timer? _locationTimer;
  String _bookingStatus = '';
  String _tripStatus = '';
  bool _pickingUp = false;
  Map<String, dynamic>? _booking;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final auth = context.read<AuthProvider>();
    auth.socket.joinTrip(widget.tripId);
    auth.socket.onLocationUpdate(_onLocationUpdate);
    auth.socket.onBookingStatus(_onBookingStatus);

    if (widget.bookingId != null) await _loadBooking();

    if (widget.isDriver) _startDriverTracking();
  }

  Future<void> _loadBooking() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/bookings/${widget.bookingId}');
      final data = res['data'] as Map<String, dynamic>;
      final booking = data['booking'] as Map<String, dynamic>;
      final pickup = booking['pickup'] as Map<String, dynamic>?;
      final dropoff = booking['dropoff'] as Map<String, dynamic>?;
      setState(() {
        _booking = booking;
        _bookingStatus = booking['status']?.toString() ?? '';
        _tripStatus = booking['trip']?['status']?.toString() ?? '';
        if (pickup != null) _pickupPos = LatLng(pickup['lat'], pickup['lng']);
        if (dropoff != null) _dropoffPos = LatLng(dropoff['lat'], dropoff['lng']);
      });
      _fitMap();
    } catch (_) {}
  }

  void _onLocationUpdate(dynamic data) {
    if (!mounted || data['tripId']?.toString() != widget.tripId) return;
    setState(() {
      _driverPos = LatLng(data['lat'], data['lng']);
      _tripStatus = data['status']?.toString() ?? _tripStatus;
    });
    if (_driverPos != null) _mapController?.animateCamera(CameraUpdate.newLatLng(_driverPos!));
  }

  void _onBookingStatus(dynamic data) {
    if (!mounted) return;
    if (widget.bookingId != null && data['bookingId']?.toString() != widget.bookingId) return;
    setState(() {
      _bookingStatus = data['status']?.toString() ?? _bookingStatus;
      _tripStatus = data['tripStatus']?.toString() ?? _tripStatus;
      final pickup = data['pickup'] as Map<String, dynamic>?;
      final dropoff = data['dropoff'] as Map<String, dynamic>?;
      if (pickup != null) _pickupPos = LatLng(pickup['lat'], pickup['lng']);
      if (dropoff != null) _dropoffPos = LatLng(dropoff['lat'], dropoff['lng']);
    });
  }

  void _startDriverTracking() {
    _locationTimer = Timer.periodic(const Duration(seconds: 8), (_) async {
      final pos = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() => _driverPos = LatLng(pos.latitude, pos.longitude));
      try {
        await context.read<AuthProvider>().api.post('/notifications/tracking/${widget.tripId}/location', {
          'lat': pos.latitude,
          'lng': pos.longitude,
          'speed': pos.speed,
          'heading': pos.heading,
        });
      } catch (_) {}
    });
  }

  Future<void> _pickupPassenger() async {
    if (widget.bookingId == null) return;
    setState(() => _pickingUp = true);
    try {
      await context.read<AuthProvider>().api.patch('/bookings/${widget.bookingId}/pickup', {});
      setState(() {
        _bookingStatus = 'in_progress';
        _tripStatus = 'in_progress';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passager à bord confirmé !')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _pickingUp = false);
  }

  Future<void> _completeTrip() async {
    final id = widget.bookingId ?? widget.tripId;
    try {
      await context.read<AuthProvider>().api.patch('/reviews/complete/$id', {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trajet terminé !')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _fitMap() {
    final points = [_driverPos, _pickupPos, _dropoffPos].whereType<LatLng>().toList();
    if (points.isEmpty || _mapController == null) return;
    if (points.length == 1) {
      _mapController!.animateCamera(CameraUpdate.newLatLngZoom(points.first, 14));
      return;
    }
    double minLat = points.first.latitude, maxLat = points.first.latitude;
    double minLng = points.first.longitude, maxLng = points.first.longitude;
    for (final p in points) {
      minLat = minLat < p.latitude ? minLat : p.latitude;
      maxLat = maxLat > p.latitude ? maxLat : p.latitude;
      minLng = minLng < p.longitude ? minLng : p.longitude;
      maxLng = maxLng > p.longitude ? maxLng : p.longitude;
    }
    _mapController!.animateCamera(CameraUpdate.newLatLngBounds(
      LatLngBounds(southwest: LatLng(minLat, minLng), northeast: LatLng(maxLat, maxLng)),
      60,
    ));
  }

  String get _statusText {
    if (_bookingStatus == 'in_progress' || _tripStatus == 'in_progress') {
      return 'Trajet en cours — passager à bord';
    }
    if (_tripStatus == 'driver_en_route' || _bookingStatus == 'confirmed') {
      return 'Conducteur en route vers le passager';
    }
    return 'En attente';
  }

  Set<Marker> get _markers {
    final markers = <Marker>{};
    if (_driverPos != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: _driverPos!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Conducteur'),
      ));
    }
    if (_pickupPos != null) {
      markers.add(Marker(
        markerId: const MarkerId('pickup'),
        position: _pickupPos!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        infoWindow: InfoWindow(title: 'Prise en charge', snippet: _booking?['pickup']?['label']?.toString()),
      ));
    }
    if (_dropoffPos != null) {
      markers.add(Marker(
        markerId: const MarkerId('dropoff'),
        position: _dropoffPos!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: InfoWindow(title: 'Destination', snippet: _booking?['dropoff']?['label']?.toString()),
      ));
    }
    return markers;
  }

  Set<Polyline> get _polylines {
    if (_pickupPos == null || _dropoffPos == null) return {};
    return {
      Polyline(
        polylineId: const PolylineId('route'),
        points: [_pickupPos!, _dropoffPos!],
        color: AppColors.primary,
        width: 3,
        patterns: [PatternItem.dash(20), PatternItem.gap(10)],
      ),
    };
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    context.read<AuthProvider>().socket.leaveTrip(widget.tripId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final initial = _pickupPos ?? _driverPos ?? const LatLng(46.7815, -71.2771);

    return Scaffold(
      appBar: AppBar(title: const Text('Suivi en direct')),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: initial, zoom: 13),
            onMapCreated: (c) {
              _mapController = c;
              _fitMap();
            },
            myLocationEnabled: widget.isDriver,
            markers: _markers,
            polylines: _polylines,
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(children: [
                    Container(width: 10, height: 10, decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_statusText, style: const TextStyle(fontWeight: FontWeight.w700))),
                  ]),
                  const SizedBox(height: 8),
                  if (_booking?['pickup'] != null)
                    Text('📍 ${_booking!['pickup']['label']}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  if (_booking?['dropoff'] != null)
                    Text('🏁 ${_booking!['dropoff']['label']}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  const SizedBox(height: 8),
                  Text(
                    widget.isDriver ? 'Partagez votre position avec le passager' : 'Suivez votre conducteur jusqu\'à la prise en charge',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  ),
                  if (widget.isDriver && _bookingStatus == 'confirmed') ...[
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _pickingUp ? null : _pickupPassenger,
                      child: _pickingUp
                          ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Passager récupéré'),
                    ),
                  ],
                  if (widget.isDriver && _bookingStatus == 'in_progress') ...[
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _completeTrip,
                      child: const Text('Terminer le trajet'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
