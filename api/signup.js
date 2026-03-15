/**
 * Serverless signup: creates user via Supabase Admin API (no confirmation email).
 * Bypasses the "email rate limit" by not sending any email.
 *
 * Set in Vercel: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    json(res, 503, { error: 'Signup not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const { email, password, name, role } = body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    json(res, 400, { error: 'Email and password required' });
    return;
  }

  const safeRole = ['tourist', 'guide', 'driver'].includes(role) ? role : 'tourist';
  const isProvider = safeRole === 'guide' || safeRole === 'driver';
  const providerType = safeRole === 'guide' ? 'guide' : safeRole === 'driver' ? 'transfer' : null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });

  if (authErr) {
    const msg = authErr.message || 'Create user failed';
    const status = msg.includes('already') ? 409 : 400;
    json(res, status, { error: msg });
    return;
  }

  const uid = authData.user?.id;
  if (!uid) {
    json(res, 500, { error: 'User created but no id returned' });
    return;
  }

  const displayName = (name && typeof name === 'string' && name.trim()) || email.split('@')[0] || 'User';
  const avatar = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const { error: dbErr } = await supabase.from('users').insert({
    id: uid,
    name: displayName.trim(),
    email: email.trim().toLowerCase(),
    role: isProvider ? 'provider' : safeRole,
    provider_type: providerType,
    avatar,
    color: safeRole === 'guide' ? '#5b8dee' : safeRole === 'driver' ? '#c9a84c' : null,
    bio: '',
    rating: 0,
    total_bookings: 0,
    earnings: '₾0',
  });

  if (dbErr) {
    json(res, 500, { error: dbErr.message || 'Profile save failed' });
    return;
  }

  json(res, 200, { ok: true, userId: uid });
}
