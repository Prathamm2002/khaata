/* Khaata — relay a note from the Advisor into email.
 *
 * Why this exists: the app writes notes to `assistant_notes`, but reading that
 * table needs a key that bypasses row-level security, and Claude's sandbox
 * refuses to transmit one. Email is a channel Claude already reads, so the note
 * takes that route instead. The database row stays the record; this is delivery.
 *
 * Vercel serverless function -> POST /api/send-note
 *
 * Environment variables (set in Vercel -> Settings -> Environment Variables):
 *   RESEND_API_KEY   an API key from resend.com (free tier is plenty)
 *   KHAATA_NOTE_TO   the COLLECTOR inbox, khaata.ledger@gmail.com — not a
 *                    personal address. Two reasons: the collector is the
 *                    mailbox Claude's Gmail connector actually reads, and the
 *                    personal inbox is deliberately kept clear of this traffic.
 *   KHAATA_NOTE_FROM optional; defaults to Resend's shared onboarding sender,
 *                    which works without verifying a domain
 *
 * If either of the first two is missing this returns 200 with sent:false rather
 * than an error — the note is already saved in the database by then, and email
 * is an enhancement, not the thing that must not fail.
 *
 * Note on exposure: this endpoint is public, because the page calling it is. It
 * can only ever send to KHAATA_NOTE_TO — an address it reads from the
 * environment, never from the request — so the worst a stranger can do is put
 * junk in that one inbox. Body length is capped to blunt that. If it ever gets
 * abused, rotate the path or put Vercel's auth in front of it.
 */

const MAX_BODY = 4000;
const MAX_CONTEXT = 8000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.KHAATA_NOTE_TO;
  const from = process.env.KHAATA_NOTE_FROM || 'Khaata <onboarding@resend.dev>';

  if (!apiKey || !to) {
    // Not configured yet. Not an error: the note is already in the database.
    return res.status(200).json({ sent: false, reason: 'email relay not configured' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (_) { payload = {}; }
  }
  payload = payload || {};

  const noteBody = String(payload.body || '').slice(0, MAX_BODY).trim();
  if (!noteBody) return res.status(400).json({ error: 'empty note' });

  let contextText = '';
  try {
    contextText = JSON.stringify(payload.context || {}, null, 2).slice(0, MAX_CONTEXT);
  } catch (_) {
    contextText = '(context could not be serialised)';
  }

  // Plain text on purpose: this is read by a person and by Claude, and both do
  // better with the figures laid out than with markup.
  const text = [
    noteBody,
    '',
    '--- what was on screen ---',
    contextText,
    '',
    `sent ${new Date().toISOString()} from the Khaata advisor`
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        // The subject is the search handle: "Khaata note" is what Claude looks
        // for, so keep the prefix stable even if the rest changes.
        subject: 'Khaata note — ' + noteBody.slice(0, 60).replace(/\s+/g, ' '),
        // The collector also feeds the 6 AM transaction parser, which matches on
        // a list of bank senders. A note is not from one of those, so it is
        // already ignored there — this header makes the distinction explicit
        // rather than incidental, for filters and for anything reading later.
        headers: { 'X-Khaata-Kind': 'advisor-note' },
        text
      })
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      // Surfaced, not thrown: the app shows "saved, email failed" rather than
      // making the user think the note was lost.
      return res.status(200).json({ sent: false, reason: 'resend rejected', status: r.status, detail: detail.slice(0, 300) });
    }
    return res.status(200).json({ sent: true });
  } catch (e) {
    return res.status(200).json({ sent: false, reason: String(e && e.message || e).slice(0, 200) });
  }
}