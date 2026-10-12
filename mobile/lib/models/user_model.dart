class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String role;
  final String driverStatus;
  final double rating;
  final int tripCount;
  final Map<String, dynamic>? vehicle;
  final String? driverLicenseNumber;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.role,
    required this.driverStatus,
    this.rating = 0,
    this.tripCount = 0,
    this.vehicle,
    this.driverLicenseNumber,
  });

  String get fullName => '$firstName $lastName';

  bool get isDriver => role == 'driver' || role == 'both';
  bool get isPassenger => role == 'passenger' || role == 'both';
  bool get isApprovedDriver => driverStatus == 'approved';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'passenger',
      driverStatus: json['driverStatus'] ?? 'none',
      rating: (json['rating'] ?? 0).toDouble(),
      tripCount: json['tripCount'] ?? 0,
      vehicle: json['vehicle'] as Map<String, dynamic>?,
      driverLicenseNumber: json['driverLicenseNumber'] as String?,
    );
  }
}
