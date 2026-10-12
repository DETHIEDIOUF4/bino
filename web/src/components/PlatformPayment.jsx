import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Paiement plateforme : actif quand Stripe est configuré côté backend (PLATFORM_PAYMENTS + clés).
 */
export default function PlatformPayment({ bookingId, fareAmount, bookingStatus }) {
  const [config, setConfig] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

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
          'Paiement Stripe prêt. Intégrez Stripe Elements avec le clientSecret ou testez via l’app mobile. ' +
            'En attendant, vous pouvez payer le conducteur directement.'
        );
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

      {!completed && platformOn && canPay && (
        <>
          <p className="hint">Paiement sécurisé Stripe (carte).</p>
          <button type="button" className="btn btn-primary" disabled={paying} onClick={payOnPlatform}>
            {paying ? 'Préparation…' : 'Payer sur bino'}
          </button>
        </>
      )}

      {!completed && !platformOn && (
        <p className="hint">
          Paiement plateforme <strong>non activé</strong> — réglez {fareAmount?.toFixed(2)} $ directement au conducteur.
          {config?.stripeEnabled === false && (
            <span> Ajoutez les clés Stripe dans le backend pour activer.</span>
          )}
        </p>
      )}

      {message && <p className="msg">{message}</p>}

      <style>{`
        .payment-block { margin-top: 16px; }
        .payment-block h2 { font-size: 1.1rem; margin-bottom: 10px; }
        .hint { color: var(--muted); font-size: 0.9rem; margin: 10px 0; }
        .ok { color: #007a5c; font-weight: 600; margin: 10px 0; }
        .msg { font-size: 0.85rem; margin-top: 10px; color: var(--encre); }
      `}</style>
    </div>
  );
}
