import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminBookings() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setBookings((data || []).map(mapBookingRow));
      setLoading(false);
    });
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.bookings')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All bookings.</p>

      <CollapsibleSection title={`Bookings (${bookings.length})`} icon="📅" defaultOpen={false}>
        {bookings.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings.</div>
        ) : (
          <div className="glass" style={{ overflow: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tourist</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 12 }}>{b.tourist}</td>
                    <td style={{ padding: 12 }}>{b.service}</td>
                    <td style={{ padding: 12 }}>{b.provider}</td>
                    <td style={{ padding: 12 }}>{b.date}</td>
                    <td style={{ padding: 12, color: 'var(--gold)' }}>₾{b.amount}</td>
                    <td style={{ padding: 12 }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: 'var(--gold-soft)', color: 'var(--gold)' }}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
