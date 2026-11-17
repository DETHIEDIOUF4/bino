import PublicLayout from '../components/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout>
      <article className="container page-section privacy-page">
        <header className="page-head">
          <h1>Protection des données personnelles</h1>
          <p className="page-lead">
            bino traite vos informations pour le covoiturage quotidien. Ce volet sera approfondi avec un avocat /
            DPO ; les méthodes ci-dessous décrivent l’intention actuelle.
          </p>
        </header>
        <div className="card">
          <h2>Ce que nous collectons</h2>
          <ul>
            <li>Identité et contact : nom, courriel, téléphone.</li>
            <li>Compte conducteur : numéro de permis, infos véhicule (validation humaine).</li>
            <li>Trajets : adresses, horaires, contribution, positions de suivi pendant le trajet.</li>
            <li>Paiement : si carte, via Stripe (bino ne stocke pas le numéro de carte).</li>
          </ul>
          <h2>Pourquoi</h2>
          <ul>
            <li>Créer le compte, matcher passagers et conducteurs, assurer le suivi.</li>
            <li>Valider les conducteurs et la sécurité de la communauté.</li>
            <li>Payer (carte) ou enregistrer un paiement en espèces.</li>
          </ul>
          <h2>Méthodes prévues</h2>
          <ul>
            <li>Chiffrement en transit (HTTPS) et accès restreint à l’administration.</li>
            <li>Mots de passe hachés (jamais stockés en clair).</li>
            <li>Séparation des espaces admin / passager / conducteur.</li>
            <li>Droit d’accès, de correction et de suppression — à formaliser (formulaire / courriel).</li>
            <li>Conservation limitée aux besoins du service et obligations légales (Québec / Loi 25).</li>
          </ul>
          <h2>À préciser ensuite</h2>
          <p className="muted">
            Politique complète, durée de conservation GPS, sous-traitants (hébergeurs, Stripe, Google Places),
            et procédure de plainte. Contact : via l’administration bino.
          </p>
        </div>
      </article>
      <style>{`
        .privacy-page h2 { font-size: 1.15rem; margin: 20px 0 8px; }
        .privacy-page ul { padding-left: 1.2rem; color: var(--muted); }
        .privacy-page li { margin-bottom: 6px; }
      `}</style>
    </PublicLayout>
  );
}
