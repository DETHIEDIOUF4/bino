import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/config/app_config.dart';

class SocketService {
  io.Socket? _socket;

  void connect(String token) {
    disconnect();
    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .build(),
    );
    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void joinTrip(String tripId) => _socket?.emit('join_trip', tripId);
  void leaveTrip(String tripId) => _socket?.emit('leave_trip', tripId);

  void onNotification(void Function(dynamic) callback) {
    _socket?.on('notification', callback);
  }

  void onLocationUpdate(void Function(dynamic) callback) {
    _socket?.on('location_update', callback);
  }

  void onBookingStatus(void Function(dynamic) callback) {
    _socket?.on('booking_status', callback);
  }
}
