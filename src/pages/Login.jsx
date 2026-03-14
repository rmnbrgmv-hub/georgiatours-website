import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapUserRow } from '../hooks/useAppData';

const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

/** Same columns and user shape as app (admin App.jsx login) for role, totalBookings, etc. */
async function fetchUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,role,provider_type,avatar,color,bio,rating,total_bookings,earnings,vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_plate,max_seats')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return null;
  return mapUserRow(data);
}

const ROLES = [
  { id: 'tourist', icon: '🧳', key: 'roleTourist' },
  { id: 'guide', icon: '🗺️', key: 'roleGuide' },
  { id: 'driver', icon: '🚐', key: 'roleDriver' },
];

export default function Login({ onLogin }) {
  const { t } = useLocale();
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
    } catch (_) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 8 }}>
        {t('login.title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {t('login.subtitle')}
      </p>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('login.iAm')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ROLES.map((r) => (
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
          {loading ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </div>
  );
}
