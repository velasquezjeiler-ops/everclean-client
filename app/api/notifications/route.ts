import { NextRequest, NextResponse } from 'next/server';

type NotificationPayload = {
  event?: string;
  booking?: any;
  professional?: any;
  client?: any;
  eta?: any;
  channel?: 'email' | 'sms' | 'both';
};

const EVENT_COPY: Record<string, { subject: string; text: (p: NotificationPayload) => string }> = {
  BOOKING_CREATED: {
    subject: 'EverClean booking received',
    text: p => `Your booking ${bookingRef(p)} was received. We are matching it with eligible professionals.`,
  },
  BOOKING_CLAIMED: {
    subject: 'EverClean professional confirmed',
    text: p => `${professionalName(p)} confirmed your booking ${bookingRef(p)}.`,
  },
  ETA_SENT: {
    subject: 'EverClean ETA update',
    text: p => `${professionalName(p)} is on the way. ETA: ${etaText(p)}.`,
  },
  CHECKIN_DONE: {
    subject: 'EverClean service started',
    text: p => `Your EverClean service ${bookingRef(p)} has started.`,
  },
  BOOKING_COMPLETED: {
    subject: 'EverClean service completed',
    text: p => `Your EverClean service ${bookingRef(p)} is complete.`,
  },
  NEW_AVAILABLE_BOOKING_FOR_PRO: {
    subject: 'New EverClean booking available',
    text: p => `A new booking is available in your service area and rate tier. Open Available Jobs to claim it.`,
  },
};

function bookingRef(payload: NotificationPayload) {
  return payload.booking?.id ? `#${String(payload.booking.id).slice(0, 8)}` : '';
}

function professionalName(payload: NotificationPayload) {
  return payload.professional?.fullName || payload.professional?.full_name || 'Your professional';
}

function etaText(payload: NotificationPayload) {
  return payload.eta?.etaText || payload.eta?.eta || payload.eta?.duration || 'available in your dashboard';
}

function clientEmail(payload: NotificationPayload) {
  return payload.client?.email || payload.booking?.client?.email || payload.booking?.email || payload.booking?.customer_email || '';
}

function clientPhone(payload: NotificationPayload) {
  return payload.client?.phone || payload.booking?.client?.phone || payload.booking?.phone || payload.booking?.customer_phone || '';
}

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@everclean.app';
}

async function sendResend(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return 'skipped';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail(), to, subject, text }),
  });
  return res.ok ? 'sent' : 'failed';
}

async function sendSendGrid(to: string, subject: string, text: string) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key || !to) return 'skipped';

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail() },
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  });
  return res.ok ? 'sent' : 'failed';
}

async function sendEmail(to: string, subject: string, text: string) {
  const resend = await sendResend(to, subject, text);
  if (resend !== 'skipped') return resend;
  return sendSendGrid(to, subject, text);
}

async function sendSms(to: string, text: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !to) return 'skipped';

  const body = new URLSearchParams({ To: to, From: from, Body: text });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return res.ok ? 'sent' : 'failed';
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as NotificationPayload;
  const event = payload.event || '';
  const copy = EVENT_COPY[event];

  if (!copy) {
    return NextResponse.json({ ok: false, error: 'Unknown notification event' }, { status: 400 });
  }

  const subject = copy.subject;
  const text = copy.text(payload);
  const channel = payload.channel || 'both';
  const results: Record<string, string> = {};

  if (channel === 'email' || channel === 'both') {
    results.email = await sendEmail(clientEmail(payload), subject, text);
  }
  if (channel === 'sms' || channel === 'both') {
    results.sms = await sendSms(clientPhone(payload), text);
  }

  return NextResponse.json({ ok: true, event, results });
}
