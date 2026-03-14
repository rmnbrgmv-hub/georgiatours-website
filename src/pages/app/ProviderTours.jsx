import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CreateTourModal from '../../components/CreateTourModal';
import TourCard from '../../components/TourCard';

export default function ProviderTours() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTour, setEditTour] = useState(null);

  const refetch = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('services')
      .select('*')
      .eq('provider_id', user.id)
      .then(({ data }) => {
        setTours((data || []).map(mapServiceRow));
        setLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (!user) return null;
  if (user.role !== 'provider') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.myTours')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Tours and services you offer.</p>
        </div>
        <button type="button" onClick={() => { setEditTour(null); setShowCreate(true); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Create Tour</button>
      </div>

      {showCreate && <CreateTourModal user={user} initialTour={editTour} onSave={() => { refetch(); setShowCreate(false); setEditTour(null); }} onClose={() => { setShowCreate(false); setEditTour(null); }} />}

      {tours.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No tours yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {tours.map((s) => (
            <TourCard
              key={s.id}
              tour={s}
              linkTo={`/app/tour/${s.id}`}
              actions={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => { setEditTour(s); setShowCreate(true); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                  <Link to={`/app/tour/${s.id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 500 }}>View →</Link>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
