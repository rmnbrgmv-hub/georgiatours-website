import { useState, useEffect } from 'react';
import { useOutletContext, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminTours() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('services').select('*').then(({ data }) => {
      setTours((data || []).map(mapServiceRow));
      setLoading(false);
    });
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.tours')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All tours and services.</p>

      <CollapsibleSection title={`Tours (${tours.length})`} icon="🗺️">
        {tours.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No tours.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tours.map((s) => (
              <div key={s.id} className="glass" style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{s.provider} · {s.region} · {s.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--gold)' }}>₾{s.price}</span>
                  <Link to={`/app/tour/${s.id}`} style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
