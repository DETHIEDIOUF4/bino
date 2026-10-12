const prisma = require('../lib/prisma');

let firebaseAdmin = null;

const initFCM = () => {
  if (firebaseAdmin || !process.env.FIREBASE_PROJECT_ID) return;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseAdmin = admin;
  } catch (err) {
    console.warn('FCM non configuré:', err.message);
  }
};

const sendPushNotification = async (userId, { title, body, data = {} }) => {
  initFCM();
  if (!firebaseAdmin) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });
  if (!user?.fcmToken) return false;

  try {
    await firebaseAdmin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    });
    return true;
  } catch (err) {
    console.warn('Push FCM échoué:', err.message);
    return false;
  }
};

module.exports = { sendPushNotification, initFCM };
