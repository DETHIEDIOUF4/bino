const KEY = 'bino_pending_booking';

export function savePendingBooking(payload) {
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadPendingBooking() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingBooking() {
  sessionStorage.removeItem(KEY);
}

/** @returns {Promise<string|null>} booking id if created */
export async function fulfillPendingBooking(api) {
  const pending = loadPendingBooking();
  if (!pending?.tripId) return null;

  const { data } = await api.post(`/trips/${pending.tripId}/book`, {
    pickup: pending.pickup,
    dropoff: pending.dropoff,
    requestedTime: pending.requestedTime || new Date().toISOString(),
    timeFlexibilityMinutes: pending.timeFlexibilityMinutes ?? 15,
    fareAmount: pending.fareAmount,
  });
  clearPendingBooking();
  return data.data._id;
}
