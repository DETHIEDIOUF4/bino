import { Link } from 'react-router-dom';
import { isDriverRole, isPassengerRole } from '../utils/roles';

export default function RoleSwitch({ user, as = 'passenger' }) {
  if (!user) return null;

  if (as === 'passenger' && isDriverRole(user)) {
    return (
      <p className="role-switch">
        Vous conduisez aussi ? <Link to="/conducteur">Aller à l’espace conducteur</Link>
      </p>
    );
  }

  if (as === 'passenger' && !isDriverRole(user)) {
    return (
      <p className="role-switch">
        Envie de partager votre voiture ?{' '}
        <Link to="/inscription-conducteur" state={{ becomeDriver: true }}>
          Devenir conducteur
        </Link>
      </p>
    );
  }

  if (as === 'driver' && isPassengerRole(user)) {
    return (
      <p className="role-switch">
        Vous voyagez aussi en passager ? <Link to="/app">Espace passager</Link>
      </p>
    );
  }

  if (as === 'driver' && !isPassengerRole(user)) {
    return (
      <p className="role-switch">
        Besoin d’un trajet ? <Link to="/app">Activer l’espace passager</Link> — même compte.
      </p>
    );
  }

  return null;
}
