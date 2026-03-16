import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapUserRow } from '../hooks/useAppData';
import DriverVehicleForm from '../components/DriverVehicleForm';

/** Fetch user from users table by Supabase Auth id (auth.uid()). Never throws. Normalizes type/provider_type. */
async function fetchUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,role,provider_type,avatar,color,bio,rating,total_bookings,earnings,vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_plate,max_seats,profile_picture,gallery')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const u = mapUserRow(data);
    u.type = u.provider_type ?? u.type;
    return u;
  } catch (_) {
    return null;
  }
}

const ROLES = [
  { id: 'tourist', icon: '/images/tourist-icon-200.png', key: 'roleTourist' },
  { id: 'guide', icon: '/images/guide-icon-200.png', key: 'roleGuide' },
  { id: 'driver', icon: '/images/driver-icon-200.png', key: 'roleDriver' },
  { id: 'admin', icon: '⚙️', key: 'roleAdmin' },
];

/** Insert user row with id = Supabase Auth user id (required for signup). Sets role + provider_type. Optional vehicle fields for drivers. */
async function insertUser({ id, name, email, role, providerType, vehicleMake, vehicleModel, vehicleYear, vehicleColor, vehiclePlate, maxSeats }) {
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
    vehicle_make: vehicleMake ?? null,
    vehicle_model: vehicleModel ?? null,
    vehicle_year: vehicleYear ?? null,
    vehicle_color: vehicleColor ?? null,
    vehicle_plate: vehiclePlate ?? null,
    max_seats: maxSeats ?? null,
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
  const roleRef = useRef('tourist');
  roleRef.current = role;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicleStep, setVehicleStep] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
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
        const selectedRole = roleRef.current;
        if (process.env.NODE_ENV !== 'production') console.log('Signing up with role:', selectedRole);
        const apiSignup = async () => {
          const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password,
              name: name.trim() || undefined,
              role: selectedRole === 'admin' ? 'tourist' : selectedRole, // use ref to avoid stale closure
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: data.error || `Signup failed (${res.status})` };
          return { ok: true, userId: data.userId };
        };
        const apiResult = await apiSignup();
        if (apiResult.ok) {
          const formRole = selectedRole === 'admin' ? 'tourist' : selectedRole;
          if (formRole === 'driver') {
            try { sessionStorage.setItem('driverVehiclePending', '1'); } catch (_) {}
            let userId = apiResult.userId;
            if (!userId) {
              const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
              if (signInErr) {
                try { sessionStorage.removeItem('driverVehiclePending'); } catch (_) {}
                setError('Account created. Please sign in.');
                setLoading(false);
                return;
              }
              userId = signInData.user.id;
            }
            setPendingUser({
              id: userId,
              name: name.trim() || email.split('@')[0],
              email: email.trim(),
              role: 'provider',
              type: 'transfer',
              provider_type: 'transfer',
              avatar: (name.trim() || email).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
              color: '#c9a84c',
              _fromApiSignup: true,
            });
            setVehicleStep(true);
            setLoading(false);
            return;
          }
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (signInErr) {
            setError('Account created. Please sign in.');
            setLoading(false);
            setMode('login');
            return;
          }
          await new Promise((r) => setTimeout(r, 500));
          let u = await fetchUserById(signInData.user.id);
          if (!u) {
            await new Promise((r) => setTimeout(r, 1000));
            u = await fetchUserById(signInData.user.id);
          }
          const authEmail = signInData.user?.email || '';
          const isProviderRole = formRole === 'guide' || formRole === 'driver';
          let resolved = u
            ? (authEmail === 'admin@tourbid.ge' ? { ...u, role: 'admin' } : u)
            : {
                id: signInData.user.id,
                name: name.trim() || authEmail.split('@')[0],
                email: authEmail,
                role: authEmail === 'admin@tourbid.ge' ? 'admin' : isProviderRole ? 'provider' : formRole,
                type: formRole === 'guide' ? 'guide' : undefined,
                provider_type: formRole === 'guide' ? 'guide' : undefined,
                avatar: (name.trim() || authEmail).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
                color: formRole === 'guide' ? '#5b8dee' : undefined,
              };
          if (formRole === 'guide') {
            resolved = { ...resolved, role: 'provider', type: 'guide', provider_type: 'guide', color: resolved.color ?? '#5b8dee' };
          }
          if (u && (u.provider_type === 'guide' || u.provider_type === 'transfer' || u.type === 'guide' || u.type === 'transfer')) {
            resolved = { ...resolved, role: 'provider', type: u.type ?? u.provider_type, provider_type: u.provider_type ?? u.type };
          }
          onLogin(resolved);
          setError('');
          setLoading(false);
          const isProvider = resolved?.role === 'provider' || resolved?.type === 'guide' || resolved?.type === 'transfer' || resolved?.provider_type === 'guide' || resolved?.provider_type === 'transfer';
          const goTo = (redirect === '/app' || redirect === '/app/') && isProvider ? '/app/dashboard' : redirect;
          setTimeout(() => navigate(goTo), 0);
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
        const selectedRoleFallback = roleRef.current;
        if (selectedRoleFallback === 'driver') {
          try { sessionStorage.setItem('driverVehiclePending', '1'); } catch (_) {}
          const nu = {
            id: authData.user.id,
            name: name.trim() || email.split('@')[0],
            email: authData.user?.email || email.trim(),
            role: 'provider',
            type: 'transfer',
            provider_type: 'transfer',
            avatar: (name.trim() || email).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
            color: '#c9a84c',
            _fromApiSignup: false,
          };
          setPendingUser(nu);
          setVehicleStep(true);
          setLoading(false);
          return;
        }
        const insertErr = await insertUser({
          id: authData.user.id,
          name: name.trim() || email.split('@')[0],
          email: authData.user?.email || email.trim(),
          role: selectedRoleFallback === 'admin' ? 'tourist' : selectedRoleFallback,
          providerType: selectedRoleFallback === 'guide' ? 'guide' : selectedRoleFallback === 'driver' ? 'transfer' : null,
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
      let resolved = u
        ? (authEmail === 'admin@tourbid.ge' ? { ...u, role: 'admin' } : u)
        : { id: authData.user.id, name: authEmail.split('@')[0], email: authEmail, role: authEmail === 'admin@tourbid.ge' ? 'admin' : 'tourist' };
      if (resolved && (resolved.provider_type === 'guide' || resolved.provider_type === 'transfer' || resolved.type === 'guide' || resolved.type === 'transfer')) {
        resolved = { ...resolved, role: 'provider', type: resolved.type ?? resolved.provider_type, provider_type: resolved.provider_type ?? resolved.type };
      }
      onLogin(resolved);
      const isProvider = resolved?.role === 'provider' || resolved?.type === 'guide' || resolved?.type === 'transfer' || resolved?.provider_type === 'guide' || resolved?.provider_type === 'transfer';
      const goTo = (redirect === '/app' || redirect === '/app/') && isProvider ? '/app/dashboard' : redirect;
      setTimeout(() => navigate(goTo), 0);
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

  if (vehicleStep && pendingUser) {
    return (
      <div className="login-page" style={{ maxWidth: 420, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <button type="button" onClick={() => { setVehicleStep(false); setPendingUser(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>← Back</button>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button type="button" onClick={() => setLangOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>🌐 {localeNames[locale]} ▾</button>
            {langOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 120, padding: 4, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 }}>
                {Object.entries(localeNames).map(([lang, label]) => (
                  <button key={lang} type="button" onClick={() => { setLocale(lang); setLangOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'start', background: locale === lang ? 'var(--gold-soft)' : 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem' }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 16 }}>{error}</p>}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <DriverVehicleForm
            onComplete={async (vehicleData) => {
              setLoading(true);
              setError('');
              const { _fromApiSignup, ...userWithoutFlag } = pendingUser;
              const fullUser = { ...userWithoutFlag, ...vehicleData };
              const err = await insertUser({
                id: pendingUser.id,
                name: pendingUser.name,
                email: pendingUser.email,
                role: 'provider',
                providerType: 'transfer',
                vehicleMake: vehicleData.vehicleMake,
                vehicleModel: vehicleData.vehicleModel,
                vehicleYear: vehicleData.vehicleYear,
                vehicleColor: vehicleData.vehicleColor,
                vehiclePlate: vehicleData.vehiclePlate,
                maxSeats: vehicleData.maxSeats,
              });
              if (err) {
                setLoading(false);
                setError(err.message || 'Could not save vehicle.');
                return;
              }
              try { sessionStorage.removeItem('driverVehiclePending'); } catch (_) {}
              if (_fromApiSignup) {
                const { error: signInErr } = await supabase.auth.signInWithPassword({ email: pendingUser.email, password });
                if (signInErr) {
                  setLoading(false);
                  setError('Saved. Please sign in.');
                  return;
                }
                setVehicleStep(false);
                setPendingUser(null);
                onLogin(fullUser);
                setLoading(false);
                setTimeout(() => navigate('/app/dashboard'), 0);
              } else {
                setVehicleStep(false);
                setPendingUser(null);
                setLoading(false);
                setTimeout(() => navigate('/login'), 0);
              }
            }}
            onBack={() => { try { sessionStorage.removeItem('driverVehiclePending'); } catch (_) {} setVehicleStep(false); setPendingUser(null); }}
          />
        </div>
      </div>
    );
  }

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
              onClick={() => { setRole(r.id); roleRef.current = r.id; }}
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
              <img
                src={r.icon}
                alt={t('login.' + r.key)}
                style={{
                  width: 64,
                  height: 64,
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 4,
                  objectFit: 'cover',
                  opacity: 0.9,
                }}
              />
              <span>{t('login.' + r.key)}</span>
            </button>
          ))}
        </div>
        {mode === 'signup' && role === 'driver' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>🚐 You'll register your vehicle on the next step.</p>
        )}
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
