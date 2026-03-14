import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';

export default function ProviderJobs() {
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
  const startJob = async (id) => {
    await supabase.from('bookings').update({ status: 'active' }).eq('id', id);
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: 'active' } : x)));
  };
  const markDone = async (id) => {
    await supabase.from('bookings').update({ status: 'provider_done' }).eq('id', id);
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: 'provider_done' } : x)));
  };
  const complete = async (id) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: 'completed' } : x)));
  };

  if (!user) return null;
  if (user.role !== 'provider') return <Navigate to="/app" replace />;
  if (loading && jobs.length === 0) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.jobs')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Bookings assigned to you.</p>

      {jobs.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((j) => (
            <div key={j.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{j.service}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{j.tourist} · {j.date}</div>
                  <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.2rem', color: 'var(--gold)', marginTop: 8 }}>₾{j.amount}</div>
                </div>
                <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: j.status === 'completed' ? 'var(--cyan-soft)' : 'var(--gold-soft)', color: j.status === 'completed' ? 'var(--cyan)' : 'var(--gold)' }}>{j.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {j.status === 'pending' && (
                  <>
                    <button type="button" onClick={() => accept(j.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Accept</button>
                    <button type="button" onClick={() => decline(j.id)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>Decline</button>
                  </>
                )}
                {j.status === 'confirmed' && (
                  <button type="button" onClick={() => startJob(j.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Start job</button>
                )}
                {j.status === 'active' && (
                  <button type="button" onClick={() => markDone(j.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Mark done</button>
                )}
                {j.status === 'provider_done' && (
                  <button type="button" onClick={() => complete(j.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
