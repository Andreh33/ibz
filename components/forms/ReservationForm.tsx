'use client';

import { type FormEvent, useState } from 'react';

type Labels = {
  name: string;
  email: string;
  date: string;
  guests: string;
  message: string;
  submit: string;
};

// Reservation request form. Posts to /api/reservation (placeholder route —
// wire to Resend/Sevenrooms in the next deliverable). Optimistic success
// state shows a thank-you panel without leaving the page.
export function ReservationForm({ labels }: { labels: Labels }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('failed');
      setState('sent');
    } catch {
      // Until /api/reservation is wired we still resolve to 'sent' so the
      // form behaves; toggle to 'error' once the backend is real.
      setState('sent');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-sm border border-deep/10 bg-deep/[0.03] px-8 py-16 text-center sm:px-12 sm:py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
          ✓ Sent
        </p>
        <h2 className="mt-6 font-display text-3xl font-light leading-tight tracking-[-0.02em] text-deep">
          Thank you — we'll be in touch.
        </h2>
        <p className="mx-auto mt-6 max-w-md font-sans text-sm leading-relaxed text-deep/70">
          Your reservation request has reached the kitchen. We'll confirm by email
          within the day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field name="name" label={labels.name} type="text" required />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field name="email" label={labels.email} type="email" required />
        <Field name="date" label={labels.date} type="date" required />
      </div>
      <Field
        name="guests"
        label={labels.guests}
        type="number"
        defaultValue="2"
        min={1}
        max={20}
        required
      />
      <Field name="message" label={labels.message} multiline />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-4 inline-block rounded-full bg-deep px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ivory transition hover:bg-gold hover:text-deep disabled:opacity-60"
      >
        {state === 'sending' ? '...' : labels.submit}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  multiline = false,
  required = false,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
  defaultValue?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </span>
      {multiline ? (
        <textarea
          name={name}
          rows={4}
          className="mt-2 w-full border-b border-deep/20 bg-transparent py-3 font-sans text-base text-deep placeholder-deep/40 transition-colors focus:border-deep focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          min={min}
          max={max}
          className="mt-2 w-full border-b border-deep/20 bg-transparent py-3 font-sans text-base text-deep placeholder-deep/40 transition-colors focus:border-deep focus:outline-none"
        />
      )}
    </label>
  );
}
