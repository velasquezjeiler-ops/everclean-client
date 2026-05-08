export type BookingEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CLAIMED'
  | 'ETA_SENT'
  | 'CHECKIN_DONE'
  | 'BOOKING_COMPLETED'
  | 'REMINDER_24H'
  | 'NEW_AVAILABLE_BOOKING_FOR_PRO';

type NotifyPayload = {
  event: BookingEvent;
  booking?: any;
  professional?: any;
  client?: any;
  eta?: any;
  channel?: 'email' | 'sms' | 'both';
};

export async function notifyBookingEvent(payload: NotifyPayload) {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'both', ...payload }),
      keepalive: true,
    });
  } catch {
    // Notifications are best-effort and should never block booking operations.
  }
}
