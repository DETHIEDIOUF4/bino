class AppConfig {
  static const String apiBaseUrl = 'http://127.0.0.1:3001/api';
  static const String socketUrl = 'http://127.0.0.1:3001';
  static const double minFare = 4.0;
  static const double maxFare = 9.99;

  // Remplacer par votre clé Google Maps
  // https://console.cloud.google.com/apis/credentials
  static const String googleMapsApiKey = 'AIzaSyDHVGtF2AOo7V6Vd-seIEIzdNlTbCWuH2A';

  static const bool firebaseEnabled = false;
}
