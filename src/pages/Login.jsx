import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapUserRow } from '../hooks/useAppData';

/** Fetch user from users table by Supabase Auth id (auth.uid()). Never throws. */
async function fetchUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,role,provider_type,avatar,color,bio,rating,total_bookings,earnings,vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_plate,max_seats,profile_picture,gallery')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapUserRow(data);
  } catch (_) {
    return null;
  }
}

const ROLES = [
  { id: 'tourist', icon: '🧳', key: 'roleTourist' },
  { id: 'guide', icon: '🗺️', key: 'roleGuide' },
  { id: 'driver', icon: '🚐', key: 'roleDriver' },
  { id: 'admin', icon: '⚙️', key: 'roleAdmin' },
];

/** Insert user row with id = Supabase Auth user id (required for signup). Sets role + provider_type from signup choice. */
async function insertUser({ id, name, email, role, providerType }) {
  const avatar = (name || email || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const formRole = role === 'admin' ? 'tourist' : role;
  const isProvider = formRole === 'guide' || formRole === 'driver';
  const provider_type = isProvider ? (formRole === 'driver' ? 'transfer' : 'guide') : null;
  const payload = {
    id,
    name: (name || email?.split('@')[0] || '').trim(),
    email: (email || '').trim(),
    role: isProvider ? 'provider' : formRole,
    provider_type,
    avatar,
    color: formRole === 'guide' ? '#5b8dee' : formRole === 'driver' ? '#c9a84c' : null,
    bio: '',
    rating: 0,
    total_bookings: 0,
    earnings: '₾0',
  };
  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
  return error;
}

export default function Login({ onLogin }) {
  const { t, locale, setLocale, localeNames } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
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
      if (mode === 'signup') {
        if (!email.trim() || !password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        // Try serverless signup first (no confirmation email → no rate limit)
        const apiSignup = async () => {
          const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password,
              name: name.trim() || undefined,
              role: role === 'admin' ? 'tourist' : role, // 'tourist' | 'guide' | 'driver' → API sets role + provider_type in Supabase
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: data.error || `Signup failed (${res.status})` };
          return { ok: true };
        };
        const apiResult = await apiSignup();
        if (apiResult.ok) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (signInErr) {
            setError('Account created. Please sign in.');
            setLoading(false);
            setMode('login');
            return;
          }
          await new Promise((r) => setTimeout(r, 300));
          let u = await fetchUserById(signInData.user.id);
          if (!u) {
            await new Promise((r) => setTimeout(r, 400));
            u = await fetchUserById(signInData.user.id);
          }
          const authEmail = signInData.user?.email || '';
          const formRole = role === 'admin' ? 'tourist' : role;
          const isProviderRole = formRole === 'guide' || formRole === 'driver';
          const resolved = u
            ? (authEmail === 'admin@tourbid.ge' ? { ...u, role: 'admin' } : u)
            : {
                id: signInData.user.id,
                name: name.trim() || authEmail.split('@')[0],
                email: authEmail,
                role: authEmail === 'admin@tourbid.ge' ? 'admin' : isProviderRole ? 'provider' : formRole,
                type: formRole === 'guide' ? 'guide' : formRole === 'driver' ? 'transfer' : undefined,
                avatar: (name.trim() || authEmail).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
                color: formRole === 'guide' ? '#5b8dee' : formRole === 'driver' ? '#c9a84c' : undefined,
              };
          onLogin(resolved);
          setError('');
          setLoading(false);
          navigate(redirect);
          return;
        }
        if (apiResult.error && !apiResult.error.includes('404') && !apiResult.error.includes('Signup not configured')) {
          const msg = apiResult.error;
          const isRateLimit = /rate|exceeded|limit|too many/i.test(msg);
          setError(isRateLimit ? 'Too many sign-up attempts. Try again later.' : msg);
          setLoading(false);
          return;
        }
        // Fallback: client-side signUp (may hit rate limit if confirmation email is on)
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authErr) {
          const msg = authErr.message || '';
          const isRateLimit = /rate|exceeded|limit|too many|try again later/i.test(msg);
          setError(isRateLimit
            ? 'Too many sign-up attempts. Wait ~1 hour, or in Supabase: Auth → Providers → Email → turn off Confirm email.'
            : (msg || 'Sign up failed'));
          setLoading(false);
          return;
        }
        const insertErr = await insertUser({
          id: authData.user.id,
          name: name.trim() || email.split('@')[0],
          email: authData.user?.email || email.trim(),
          role: role === 'admin' ? 'tourist' : role,
          providerType: role === 'guide' ? 'guide' : role === 'driver' ? 'transfer' : null,
        });
        if (insertErr) {
          setError(insertErr.message || 'Account created but profile could not be saved. Try signing in.');
          setLoading(false);
          return;
        }
        setError('');
        setLoading(false);
        navigate('/login');
        return;
      }

      if (!email.trim() || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) {
        setError(authErr.message || 'Invalid email or password');
        setLoading(false);
        return;
      }
      const u = await fetchUserById(authData.user.id);
      const authEmail = authData.user?.email || '';
      const resolved = u
        ? (authEmail === 'admin@tourbid.ge' ? { ...u, role: 'admin' } : u)
        : { id: authData.user.id, name: authEmail.split('@')[0], email: authEmail, role: authEmail === 'admin@tourbid.ge' ? 'admin' : 'tourist' };
      onLogin(resolved);
      navigate(redirect);
    } catch (err) {
      const msg = err?.message || err?.error_description || (typeof err === 'string' ? err : 'Something went wrong');
      setError(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  return (
    <div className="login-page" style={{ maxWidth: 400, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← {t('login.backToHome')}
        </Link>
        <div ref={langRef} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setLangOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
            🌐 {localeNames[locale]} ▾
          </button>
          {langOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 120, padding: 4, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 }}>
              {Object.entries(localeNames).map(([lang, label]) => (
                <button key={lang} type="button" onClick={() => { setLocale(lang); setLangOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'start', background: locale === lang ? 'var(--gold-soft)' : 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem' }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 8 }}>
        {t('login.title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {t('login.subtitle')}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${mode === 'login' ? 'var(--gold)' : 'var(--border)'}`, background: mode === 'login' ? 'var(--gold-soft)' : 'var(--surface)', color: mode === 'login' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: mode === 'login' ? 600 : 500, cursor: 'pointer' }}>Sign in</button>
        <button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${mode === 'signup' ? 'var(--gold)' : 'var(--border)'}`, background: mode === 'signup' ? 'var(--gold-soft)' : 'var(--surface)', color: mode === 'signup' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: mode === 'signup' ? 600 : 500, cursor: 'pointer' }}>Create account</button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('login.iAm')}</label>
        <div className="login-role-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
          required
          placeholder="••••••••"
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
