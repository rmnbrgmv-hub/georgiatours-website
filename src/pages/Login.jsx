import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapUserRow } from '../hooks/useAppData';

const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

/** Same columns and user shape as app (admin App.jsx login) for role, totalBookings, etc. */
async function fetchUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,role,provider_type,avatar,color,bio,rating,total_bookings,earnings,vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_plate,max_seats,profile_picture,gallery')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return null;
  return mapUserRow(data);
}

const ROLES = [
  { id: 'tourist', icon: '🧳', key: 'roleTourist' },
  { id: 'guide', icon: '🗺️', key: 'roleGuide' },
  { id: 'driver', icon: '🚐', key: 'roleDriver' },
  { id: 'admin', icon: '⚙️', key: 'roleAdmin' },
];

/** Insert user row (same shape as app insertUser). */
async function insertUser({ name, email, role, providerType }) {
  const avatar = (name || email || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const isProvider = role === 'guide' || role === 'driver';
  const payload = {
    name: (name || email?.split('@')[0] || '').trim(),
    email: (email || '').trim(),
    role: isProvider ? 'provider' : role,
    provider_type: isProvider ? (role === 'driver' ? 'transfer' : 'guide') : null,
    avatar,
    color: role === 'guide' ? '#5b8dee' : role === 'driver' ? '#c9a84c' : null,
    bio: '',
    rating: 0,
    total_bookings: 0,
    earnings: '₾0',
  };
  const { error } = await supabase.from('users').insert(payload);
  return error;
}

export default function Login({ onLogin }) {
  const { t } = useLocale();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tourist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (useSupabaseAuth && password) {
        if (mode === 'signup') {
          const { data: authData, error: authErr } = await supabase.auth.signUp({ email: email.trim(), password });
          if (authErr) {
            setError(authErr.message || 'Sign up failed');
            setLoading(false);
            return;
          }
          const insertErr = await insertUser({
            name: name.trim() || email.split('@')[0],
            email: authData.user?.email || email,
            role: role === 'admin' ? 'tourist' : role,
            providerType: role === 'guide' ? 'guide' : role === 'driver' ? 'transfer' : null,
          });
          if (insertErr) {
            const u = await fetchUserByEmail(authData.user?.email || email);
            if (u) {
              onLogin(u);
              navigate(redirect);
            } else {
              setError(insertErr.message || 'Account created but user row failed. Try signing in.');
            }
          } else {
            const u = await fetchUserByEmail(authData.user?.email || email);
            if (u) {
              onLogin(u);
              navigate(redirect);
            } else {
              onLogin({
                id: authData.user?.id,
                name: (name || email).trim().split('@')[0],
                email: authData.user?.email || email,
                role: role === 'guide' || role === 'driver' ? 'provider' : 'tourist',
                type: role === 'guide' ? 'guide' : role === 'driver' ? 'transfer' : undefined,
              });
              navigate(redirect);
            }
          }
        } else {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
          if (authErr) {
            setError(authErr.message || 'Invalid email or password');
            setLoading(false);
            return;
          }
          const u = await fetchUserByEmail(authData.user?.email || email);
          if (u) {
            onLogin(u);
            navigate(redirect);
          } else {
            onLogin({ id: authData.user?.id, name: authData.user?.email?.split('@')[0], email: authData.user?.email, role: 'tourist' });
            navigate(redirect);
          }
        }
      } else {
        if (mode === 'signup') {
          const insertErr = await insertUser({
            name: name.trim() || email.split('@')[0],
            email: email.trim(),
            role: role === 'admin' ? 'tourist' : role,
            providerType: role === 'guide' ? 'guide' : role === 'driver' ? 'transfer' : null,
          });
          if (insertErr) {
            setError(insertErr.message || 'Sign up failed. Email may already be in use.');
            setLoading(false);
            return;
          }
          const u = await fetchUserByEmail(email);
          if (u) {
            onLogin(u);
            navigate(redirect);
          } else {
            setError('Account created but could not sign in. Try signing in.');
            setLoading(false);
          }
        } else {
          const u = await fetchUserByEmail(email);
          if (!u) {
            setError(useSupabaseAuth ? 'Invalid email or password' : 'No account found for this email');
            setLoading(false);
            return;
          }
          onLogin(u);
          navigate(redirect);
        }
      }
    } catch (_) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '60px 24px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, textDecoration: 'none' }}>
        ← {t('login.backToHome')}
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 8 }}>
        {t('login.title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {t('login.subtitle')}
      </p>
      {useSupabaseAuth && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quick Demo</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Tourist', email: 'tourist@demo.com', pass: 'demo123', icon: '🧳' },
              { label: 'Guide', email: 'guide@demo.com', pass: 'demo123', icon: '🗺️' },
              { label: 'Driver', email: 'driver@demo.com', pass: 'demo123', icon: '🚐' },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => { setEmail(d.email); setPassword(d.pass); setRole(d.label.toLowerCase()); setMode('login'); setError(''); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>{d.icon}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${mode === 'login' ? 'var(--gold)' : 'var(--border)'}`, background: mode === 'login' ? 'var(--gold-soft)' : 'var(--surface)', color: mode === 'login' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: mode === 'login' ? 600 : 500, cursor: 'pointer' }}>Sign in</button>
        <button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${mode === 'signup' ? 'var(--gold)' : 'var(--border)'}`, background: mode === 'signup' ? 'var(--gold-soft)' : 'var(--surface)', color: mode === 'signup' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: mode === 'signup' ? 600 : 500, cursor: 'pointer' }}>Create account</button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('login.iAm')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(mode === 'signup' ? ROLES.filter((r) => r.id !== 'admin') : ROLES.filter((r) => r.id !== 'admin')).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${role === r.id ? 'var(--gold)' : 'var(--border)'}`,
                background: role === r.id ? 'var(--gold-soft)' : 'var(--surface)',
                color: role === r.id ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: role === r.id ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
              <span>{t('login.' + r.key)}</span>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem', marginBottom: 20 }} />
          </>
        )}
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{t('login.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '1rem',
            marginBottom: 20,
          }}
        />
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{t('login.password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={!useSupabaseAuth ? '(optional)' : ''}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '1rem',
            marginBottom: 24,
          }}
        />
        {error && <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 16 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--gold)',
            color: 'var(--bg)',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {loading ? (mode === 'signup' ? 'Creating…' : t('login.signingIn')) : mode === 'signup' ? 'Create account' : t('login.signIn')}
        </button>
      </form>
    </div>
  );
}
