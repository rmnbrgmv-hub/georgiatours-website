import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import ExpandableItem from '../../components/ExpandableItem';

export default function ProviderDashboard() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const tick = async () => {
      const { data } = await supabase.from('bookings').select('*').eq('provider_id', user.id);
      setJobs((data || []).map(mapBookingRow));
      setLoading(false);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [user?.id]);

  const accept = async (id) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: 'confirmed' } : x)));
  };
  const decline = async (id) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)));
  };

  if (!user) return null;
  if (user.role !== 'provider') return <Navigate to="/app" replace />;
  if (loading && jobs.length === 0) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.dashboard')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{user.type === 'guide' ? 'Guide' : 'Driver'} · {t('nav.appName')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Earnings</div>
          <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.75rem', color: 'var(--gold)' }}>{user.earnings ?? '₾0'}</div>
        </div>
        <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Bookings</div>
          <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.75rem', color: 'var(--text)' }}>{user.totalBookings ?? jobs.length}</div>
        </div>
        <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Rating</div>
          <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.75rem', color: 'var(--gold)' }}>⭐ {user.rating ?? '—'}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Pending / New</h2>
      {jobs.filter((j) => j.status === 'pending' || j.status === 'confirmed').length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No pending bookings.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.filter((j) => j.status === 'pending' || j.status === 'confirmed').map((j) => (
            <ExpandableItem
              key={j.id}
              summary={
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                  <span style={{ fontWeight: 600 }}>{j.service}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{j.tourist} · {j.date}</span>
                  <span style={{ fontFamily: 'var(--font-classic)', color: 'var(--gold)' }}>₾{j.amount}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: 'var(--gold-soft)', color: 'var(--gold)' }}>{j.status}</span>
                  {j.status === 'pending' && (
                    <span style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => accept(j.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Accept</button>
                      <button type="button" onClick={() => decline(j.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Decline</button>
                    </span>
                  )}
                </span>
              }
            >
              <p style={{ margin: '0 0 8px' }}><strong>Tourist:</strong> {j.tourist}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Service:</strong> {j.service}</p>
              <p style={{ margin: 0 }}><strong>Date:</strong> {j.date} · <strong>Amount:</strong> ₾{j.amount}</p>
            </ExpandableItem>
          ))}
        </div>
      )}
    </div>
  );
}
