import { type NextRequest, NextResponse } from 'next/server';

// Reservation intake endpoint. Currently logs to the server console — the
// next deliverable wires this to Resend (transactional email) +
// Sevenrooms (PMS) so a confirmation lands in the guest's inbox and a
// pending booking opens in the front-of-house system. Schema-validated
// with a tiny inline guard to keep the endpoint honest.

type Payload = {
  name: string;
  email: string;
  date: string;
  guests: number;
  message?: string;
};

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.email === 'string' &&
    typeof o.date === 'string' &&
    !Number.isNaN(Number(o.guests))
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const raw = {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    date: String(form.get('date') ?? ''),
    guests: Number(form.get('guests') ?? 0),
    message: form.get('message') ? String(form.get('message')) : undefined,
  };
  if (!isPayload(raw)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }
  // TODO: replace with Resend send + Sevenrooms create-booking when keys
  // land in env. For now we accept the request and log it so the form
  // can be tested end-to-end against a real network call.
  if (process.env.NODE_ENV !== 'production') {
    // biome-ignore lint/suspicious/noConsole: dev only
    console.log('[reservation]', raw);
  }
  return NextResponse.json({ ok: true });
}
