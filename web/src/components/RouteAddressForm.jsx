import { useEffect, useState } from 'react';
import AddressSearch from './AddressSearch';
import api from '../services/api';
import { DEFAULT_QUEBEC_LOCATION } from '../constants/quebec';
import { PRESET_PLACES } from '../services/places';

/**
 * Départ / arrivée partagés passager & conducteur, défaut Québec, tarif suggéré auto.
 */
export default function RouteAddressForm({
  departure,
  destination,
  onDepartureChange,
  onDestinationChange,
  fare,
  onFareChange,
  showFareSlider = true,
  children,
}) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);

  useEffect(() => {
    if (departure == null) {
      onDepartureChange(DEFAULT_QUEBEC_LOCATION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init défaut une fois
  }, []);

  useEffect(() => {
    if (departure?.lat == null || destination?.lat == null) {
      setDistanceKm(null);
      return;
    }

    let cancelled = false;
    api
      .get('/trips/fare-estimate', {
        params: {
          lat: departure.lat,
          lng: departure.lng,
          destLat: destination.lat,
          destLng: destination.lng,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setDistanceKm(data.data.distanceKm);
        onFareChange(data.data.suggestedFare);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalc tarif quand l'itinéraire change
  }, [departure?.lat, departure?.lng, destination?.lat, destination?.lng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onDepartureChange({
          label: 'Ma position (Québec)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        onDepartureChange(DEFAULT_QUEBEC_LOCATION);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      }
    );
  };

  return (
    <div className="route-form">
      <div className="loc-row">
        <AddressSearch
          label="Départ"
          value={departure}
          onChange={onDepartureChange}
          placeholder="Centre-ville, Québec…"
        />
        <button type="button" className="geo-btn" onClick={useMyLocation} disabled={geoLoading}>
          {geoLoading ? '…' : 'Ma position'}
        </button>
      </div>
      <AddressSearch
        label="Arrivée"
        value={destination}
        onChange={onDestinationChange}
        placeholder="Destination à Québec…"
      />

      <div className="presets">
        <span>Raccourcis Québec :</span>
        {PRESET_PLACES.map((p) => (
          <button
            key={p.label}
            type="button"
            className="preset-btn"
            onClick={() => {
              if (!departure?.lat) onDepartureChange(p);
              else onDestinationChange(p);
            }}
          >
            {p.label.split(',')[0]}
          </button>
        ))}
      </div>

      {showFareSlider && departure?.lat != null && destination?.lat != null && (
        <div className="fare-block">
          <label className="fare-label">
            Contribution suggérée
            {distanceKm != null && (
              <span className="dist"> · ~{distanceKm} km</span>
            )}
            <strong>{Number(fare).toFixed(2)} $</strong>
            <input
              type="range"
              min={4}
              max={9.99}
              step={0.1}
              value={fare}
              onChange={(e) => onFareChange(Number(e.target.value))}
            />
          </label>
          <p className="fare-hint">Ajustez après la suggestion — le matching utilise les trajets les plus proches.</p>
        </div>
      )}

      {children}

      <style>{`
        .route-form { display: grid; gap: 18px; }
        .loc-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
        .geo-btn {
          border: 1px solid var(--border);
          background: var(--white);
          padding: 12px 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8rem;
          white-space: nowrap;
        }
        .presets { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 0.85rem; }
        .preset-btn {
          border: 1px solid var(--border);
          background: var(--creme);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .fare-label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; }
        .dist { font-weight: 500; color: var(--muted); font-size: 0.85rem; }
        .fare-hint { font-size: 0.8rem; color: var(--muted); margin-top: -6px; }
      `}</style>
    </div>
  );
}
