import { useEffect, useState } from 'react';
import api from '../services/api';

export default function PlatformPayment({ bookingId, fareAmount, bookingStatus, paymentMethod: initialMethod }) {
  const [config, setConfig] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState(initialMethod || 'cash');

  const canPay = ['confirmed', 'pickup_pending', 'in_progress'].includes(bookingStatus);

  useEffect(() => {
    Promise.all([
      api.get('/payments/config'),
      api.get(`/payments/${bookingId}`).catch(() => ({ data: { data: null } })),
    ])
      .then(([cfg, pay]) => {
        setConfig(cfg.data.data);
        setPayment(pay.data.data);
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const payOnPlatform = async () => {
    setPaying(true);
    setMessage('');
    try {
      const { data } = await api.post('/payments/intent', { bookingId });
      if (data.data?.clientSecret && config?.publishableKey) {
        setMessage(
          'Paiement carte prêt (Stripe). Le module carte Stripe Elements sera finalisé ; en test, utilisez une carte Stripe test.'
        );
      } else {
        setMessage('Stripe n’est pas encore configuré sur le serveur. Choisissez espèces ou contactez bino.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Paiement indisponible');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return null;

  const platformOn = config?.platformPaymentsEnabled;
  const completed = payment?.status === 'completed';

  return (
    <div className="card payment-block">
      <h2>Paiement</h2>
      <p>
        Contribution : <strong>{fareAmount?.toFixed(2)} $ CAD</strong>
      </p>

      {completed && <p className="ok">Paiement enregistré sur la plateforme.</p>}

      {!completed && (
        <>
          <p className="hint">Le passager choisit : espèces au conducteur, ou carte via Stripe.</p>
          <div className="pay-choice">
            <label>
              <input type="radio" name="pm" checked={method === 'cash'} onChange={() => setMethod('cash')} />
              Espèces
            </label>
            <label>
              <input type="radio" name="pm" checked={method === 'card'} onChange={() => setMethod('card')} />
              Carte
            </label>
          </div>
        </>
      )}

      {!completed && method === 'cash' && (
        <p className="hint">Réglez {fareAmount?.toFixed(2)} $ en main propre au conducteur à la prise en charge.</p>
      )}

      {!completed && method === 'card' && canPay && (
        <>
          {platformOn ? (
            <button type="button" className="btn btn-primary" disabled={paying} onClick={payOnPlatform}>
              {paying ? 'Préparation…' : 'Payer par carte'}
            </button>
          ) : (
            <p className="hint">
              Paiement carte bientôt actif (clés Stripe côté serveur). En attendant, utilisez les espèces.
            </p>
          )}
        </>
      )}

      {message && <p className="msg">{message}</p>}

      <style>{`
        .payment-block { margin-top: 16px; }
        .payment-block h2 { font-size: 1.1rem; margin-bottom: 10px; }
        .hint { color: var(--muted); font-size: 0.9rem; margin: 10px 0; }
        .ok { color: #007a5c; font-weight: 600; margin: 10px 0; }
        .msg { font-size: 0.85rem; margin-top: 10px; }
        .pay-choice { display: flex; gap: 16px; margin: 12px 0; font-weight: 600; }
        .pay-choice label { display: flex; gap: 8px; align-items: center; }
      `}</style>
    </div>
  );
}
