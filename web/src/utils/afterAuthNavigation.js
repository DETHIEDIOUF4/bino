import api from '../services/api';
import { fulfillPendingBooking } from '../services/pendingBooking';
import { fulfillPendingTrip } from '../services/pendingTrip';
import { fulfillPendingRideRequest } from '../services/pendingRideRequest';
import { homePathForUser } from './roles';

/**
 * @returns {Promise<{ path: string, error?: string }>}
 */
export async function resolvePostAuthDestination(user, fromPath) {
  const defaultHome = fromPath || (user ? homePathForUser(user) : '/app');

  try {
    const bookingId = await fulfillPendingBooking(api);
    if (bookingId) {
      return { path: `/app/trajet/${bookingId}` };
    }
  } catch (err) {
    return {
      path: defaultHome,
      error: err.response?.data?.message || 'Impossible de finaliser la réservation en attente.',
    };
  }

  try {
    const requestId = await fulfillPendingRideRequest(api);
    if (requestId) {
      return { path: '/rechercher', error: 'Demande ouverte envoyée aux conducteurs.' };
    }
  } catch (err) {
    return {
      path: defaultHome,
      error: err.response?.data?.message || 'Impossible d\'envoyer la demande ouverte.',
    };
  }

  try {
    const tripId = await fulfillPendingTrip(api);
    if (tripId) {
      return { path: '/conducteur/trajets' };
    }
  } catch (err) {
    const msg = err.response?.data?.message || '';
    if (err.response?.status === 403 || msg.toLowerCase().includes('valid')) {
      return {
        path: '/conducteur',
        error:
          'Compte conducteur en validation par notre équipe. Votre trajet est enregistré et sera publié dès approbation.',
      };
    }
    return {
      path: '/conducteur',
      error: msg || 'Impossible de publier le trajet pour le moment.',
    };
  }

  return { path: user ? homePathForUser(user) : defaultHome };
}
