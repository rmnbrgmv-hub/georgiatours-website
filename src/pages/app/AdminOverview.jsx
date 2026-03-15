import { useState, useEffect } from 'react';
import { useOutletContext, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminOverview() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [counts, setCounts] = useState({ bookings: 0, requests: 0, providers: 0, tours: 0 });
  const [expandedStat, setExpandedStat] = useState(null);
  const [extended, setExtended] = useState({ bookings: null, requests: null, providers: null, tours: null });

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

  useEffect(() => {
    if (!expandedStat) return;
    if (extended[expandedStat]) return;
    if (expandedStat === 'bookings') {
      supabase.from('bookings').select('status').then(({ data }) => {
        const byStatus = {};
        (data || []).forEach((row) => { byStatus[row.status] = (byStatus[row.status] || 0) + 1; });
        setExtended((e) => ({ ...e, bookings: byStatus }));
      });
    } else if (expandedStat === 'requests') {
      supabase.from('requests').select('status').then(({ data }) => {
        const byStatus = {};
        (data || []).forEach((row) => { byStatus[row.status] = (byStatus[row.status] || 0) + 1; });
        setExtended((e) => ({ ...e, requests: byStatus }));
      });
    } else if (expandedStat === 'providers') {
      supabase.from('users').select('provider_type').eq('role', 'provider').then(({ data }) => {
        const byType = {};
        (data || []).forEach((row) => { const t = row.provider_type || '—'; byType[t] = (byType[t] || 0) + 1; });
        setExtended((e) => ({ ...e, providers: byType }));
      });
    } else if (expandedStat === 'tours') {
      supabase.from('services').select('type', 'suspended').then(({ data }) => {
        const byType = {};
        let suspended = 0;
        (data || []).forEach((row) => { byType[row.type] = (byType[row.type] || 0) + 1; if (row.suspended) suspended++; });
        setExtended((e) => ({ ...e, tours: { byType, suspended } }));
      });
    }
  }, [expandedStat, extended]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;

  const cardStyle = (key) => ({
    padding: 24,
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: expandedStat === key ? 'var(--surface-hover)' : 'var(--surface)',
    transition: 'background 0.2s',
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.overview')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Admin dashboard · {t('nav.appName')}</p>

      <CollapsibleSection title="Stats" icon="◈" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          <div className="glass" style={cardStyle('bookings')} onClick={() => setExpandedStat(expandedStat === 'bookings' ? null : 'bookings')}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{t('nav.bookings')}</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--gold)' }}>{counts.bookings}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{(t && t('overview.clickForBreakdown')) || 'Click for breakdown'}</div>
          </div>
          <div className="glass" style={cardStyle('requests')} onClick={() => setExpandedStat(expandedStat === 'requests' ? null : 'requests')}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{t('nav.requests')}</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--cyan)' }}>{counts.requests}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{(t && t('overview.clickForBreakdown')) || 'Click for breakdown'}</div>
          </div>
          <div className="glass" style={cardStyle('providers')} onClick={() => setExpandedStat(expandedStat === 'providers' ? null : 'providers')}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{t('nav.providers')}</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--text)' }}>{counts.providers}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{(t && t('overview.clickForBreakdown')) || 'Click for breakdown'}</div>
          </div>
          <div className="glass" style={cardStyle('tours')} onClick={() => setExpandedStat(expandedStat === 'tours' ? null : 'tours')}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{t('nav.tours')}</div>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '2rem', color: 'var(--text)' }}>{counts.tours}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{(t && t('overview.clickForBreakdown')) || 'Click for breakdown'}</div>
          </div>
        </div>

        {expandedStat && (
          <div style={{ marginTop: 20, padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: '1rem' }}>{(t && t('overview.extendedInfo')) || 'Extended info'}: {t(`nav.${expandedStat}`)}</strong>
              <button type="button" onClick={() => setExpandedStat(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.85rem' }}>{(t && t('overview.close')) || 'Close'}</button>
            </div>
            {expandedStat === 'bookings' && (
              <div>
                {extended.bookings ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {Object.entries(extended.bookings).map(([status, n]) => (
                      <li key={status} style={{ marginBottom: 4 }}><strong>{status}</strong>: {n}</li>
                    ))}
                  </ul>
                ) : <span style={{ color: 'var(--text-muted)' }}>{(t && t('overview.loading')) || 'Loading…'}</span>}
                <p style={{ marginTop: 12, marginBottom: 0 }}><Link to="/app/admin-bookings" style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{(t && t('overview.viewAllBookings')) || 'View all bookings →'}</Link></p>
              </div>
            )}
            {expandedStat === 'requests' && (
              <div>
                {extended.requests ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {Object.entries(extended.requests).map(([status, n]) => (
                      <li key={status} style={{ marginBottom: 4 }}><strong>{status}</strong>: {n}</li>
                    ))}
                  </ul>
                ) : <span style={{ color: 'var(--text-muted)' }}>{(t && t('overview.loading')) || 'Loading…'}</span>}
                <p style={{ marginTop: 12, marginBottom: 0 }}><Link to="/app/admin-requests" style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{(t && t('overview.viewAllRequests')) || 'View all requests →'}</Link></p>
              </div>
            )}
            {expandedStat === 'providers' && (
              <div>
                {extended.providers ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {Object.entries(extended.providers).map(([type, n]) => (
                      <li key={type} style={{ marginBottom: 4 }}><strong>{type}</strong>: {n}</li>
                    ))}
                  </ul>
                ) : <span style={{ color: 'var(--text-muted)' }}>{(t && t('overview.loading')) || 'Loading…'}</span>}
                <p style={{ marginTop: 12, marginBottom: 0 }}><Link to="/app/admin-providers" style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{(t && t('overview.viewAllProviders')) || 'View all providers →'}</Link></p>
              </div>
            )}
            {expandedStat === 'tours' && (
              <div>
                {extended.tours ? (
                  <>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {Object.entries(extended.tours.byType).map(([type, n]) => (
                        <li key={type} style={{ marginBottom: 4 }}><strong>{type}</strong>: {n}</li>
                      ))}
                    </ul>
                    <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{(t && t('overview.suspended')) || 'Suspended'}: {extended.tours.suspended}</p>
                  </>
                ) : <span style={{ color: 'var(--text-muted)' }}>{(t && t('overview.loading')) || 'Loading…'}</span>}
                <p style={{ marginTop: 12, marginBottom: 0 }}><Link to="/app/admin-tours" style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{(t && t('overview.viewAllTours')) || 'View all tours →'}</Link></p>
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
