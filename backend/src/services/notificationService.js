const prisma = require('../lib/prisma');
const { mapNotification } = require('../utils/mapApi');
const { sendPushNotification } = require('./fcmService');

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const sendNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  relatedTrip = null,
  relatedBooking = null,
}) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
      relatedTripId: relatedTrip,
      relatedBookingId: relatedBooking,
    },
  });

  const mapped = mapNotification(notification);

  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification', {
      id: mapped._id,
      type,
      title,
      message,
      data,
      relatedTrip,
      relatedBooking,
      createdAt: notification.createdAt,
    });
  }

  await sendPushNotification(userId, { title, body: message, data });

  return mapped;
};

module.exports = { setIO, sendNotification };
