# Phase 2 — Configuration

## Google Maps

1. Créer une clé API sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activer : Maps SDK for iOS, Maps SDK for Android, Geocoding API
3. Remplacer `VOTRE_CLE_GOOGLE_MAPS` dans :
   - `mobile/ios/Runner/Info.plist` → `GMSApiKey`
   - `mobile/android/app/src/main/AndroidManifest.xml` → `com.google.android.geo.API_KEY`
   - `mobile/lib/core/config/app_config.dart` → `googleMapsApiKey`

## Firebase FCM (notifications push)

1. Créer un projet Firebase : https://console.firebase.google.com
2. Ajouter les apps iOS et Android
3. Télécharger `GoogleService-Info.plist` → `mobile/ios/Runner/`
4. Télécharger `google-services.json` → `mobile/android/app/`
5. Mettre `firebaseEnabled: true` dans `app_config.dart`
6. Backend `.env` :
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```
7. Installer firebase-admin côté backend : `npm install firebase-admin`

## Stripe (phase 3)

Structure prête dans `backend/src/models/Payment.js` et `paymentController.js`.
Variables à ajouter plus tard : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
