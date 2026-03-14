import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminOverview() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [counts, setCounts] = useState({ bookings: 0, requests: 0, providers: 0, tours: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
      supabase.from('services').select('id', { count: 'exact', head: true }),
    ]).then(([b, r, p, s]) => {
      setCounts({
        bookings: b.count ?? 0,
        requests: r.count ?? 0,
        providers: p.count ?? 0,
        tours: s.count ?? 0,
      });
    });
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.overview')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Admin dashboard · {t('nav.appName')}</p>

      <CollapsibleSection title="Stats" icon="◈" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Bookings</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--gold)' }}>{counts.bookings}</div>
          </div>
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Requests</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--cyan)' }}>{counts.requests}</div>
          </div>
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Providers</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--text)' }}>{counts.providers}</div>
          </div>
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Tours</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--text)' }}>{counts.tours}</div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
