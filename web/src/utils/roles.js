export function isDriverRole(user) {
  return user?.role === 'driver' || user?.role === 'both';
}

export function isPassengerRole(user) {
  return user?.role === 'passenger' || user?.role === 'both';
}

export function homePathForUser(user) {
  if (isDriverRole(user) && !isPassengerRole(user)) return '/conducteur';
  if (isDriverRole(user)) return '/conducteur';
  return '/app';
}
