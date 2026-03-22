import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useRequests } from '../hooks/useAppData';
import {
  bookingInsertFromOffer,
  indexOffersByRequestId,
  newRequestInsertPayload,
} from '../utils/supabaseMappers';
import ExpandableItem from '../components/ExpandableItem';
import ViewControls, { loadViewPrefs, saveViewPref } from '../components/ViewControls';

export default function Requests() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const { requests: dbRequests, loading: requestsLoading, error: requestsError, refetch: refetchRequests } = useRequests();
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', region: 'Tbilisi', type: 'guide', date: '', budget: '' });
  const [toast, setToast] = useState('');
  const rSavedViews = loadViewPrefs();
  const [viewMode, setViewMode] = useState(rSavedViews.requests || 'list');
  const [sortMode, setSortMode] = useState('new');
  useEffect(() => {
    if (requestsError) {
      setToast('Could not load requests. Try again.');
      const id = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(id);
    }
  }, [requestsError]);

  const requests = (dbRequests || []).filter((r) => String(r.touristId) === String(user?.id));

  useEffect(() => {
    if (!user?.id || requests.length === 0) {
      setOffersByRequestId({});
      setLoading(false);
      return;
    }
    const ids = requests.map((r) => r.id);
    supabase
      .from('offers')
      .select('*')
      .in('request_id', ids)
      .then(({ data: offData }) => setOffersByRequestId(indexOffersByRequestId(offData)));
    setLoading(requestsLoading);
  }, [user?.id, requests.length, requestsLoading]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel('requests-tourist-web')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, () => refetchRequests())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, () => refetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, refetchRequests]);

  const handlePostRequest = async (e) => {
    e.preventDefault();
    const payload = newRequestInsertPayload(user, form);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session [web:handlePostRequest]:', session ? 'ACTIVE' : 'NONE', session?.user?.id);
      if (!session) {
        setToast('You are signed out. Please sign in again.');
        const id = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(id);
      }
      console.log('Inserting web request payload', payload);
      const { error } = await supabase.from('requests').insert(payload).select('*').single();
      if (error) {
        console.error('Failed to insert web request:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        const msg = error.message || 'Could not post request. Please try again.';
        setToast(msg);
        const id = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(id);
      }
      refetchRequests();
      setForm({ title: '', desc: '', region: 'Tbilisi', type: 'guide', date: '', budget: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Exception inserting web request:', err);
      setToast('Could not post request. Please try again.');
      const id = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(id);
    }
  };

  const confirmRequestCompleted = async (requestId) => {
    const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', requestId);
    if (!error) refetchRequests();
  };

  const acceptOffer = async (requestId, offer) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r || r.status !== 'open') return;
    const bookingPayload = bookingInsertFromOffer(user, r, offer);
    const { error: bookErr } = await supabase.from('bookings').insert(bookingPayload);
    if (bookErr) return;
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id);
    await supabase.from('offers').update({ status: 'declined' }).eq('request_id', requestId).neq('id', offer.id);
    await supabase.from('requests').update({ status: 'booked' }).eq('id', requestId);
    refetchRequests();
    setOffersByRequestId((prev) => ({ ...prev, [requestId]: (prev[requestId] || []).map((o) => (o.id === offer.id ? { ...o, status: 'accepted' } : { ...o, status: 'declined' })) }));
  };

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>{t('tour.signInToBook')}</p>
        <Link to="/login?redirect=/app/requests" style={{ color: 'var(--gold)' }}>{t('nav.signIn')}</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 700, margin: '0 auto' }}>
      {toast && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(224,92,92,.1)', border: '1px solid rgba(224,92,92,.3)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{toast}</span>
          <button type="button" onClick={() => { refetchRequests(); setToast(''); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 4 }}>{t('requests.title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('requests.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ViewControls view={viewMode} setView={(v) => { setViewMode(v); saveViewPref('requests', v); }} sort={sortMode} setSort={setSortMode} />
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--gold)',
            color: 'var(--bg)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {t('requests.newRequest')}
        </button>
        </div>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', marginBottom: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 16 }}>{t('requests.postRequest')}</h3>
          <form onSubmit={handlePostRequest}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Day trip to Mtskheta"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', marginBottom: 12 }}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Description</label>
            <textarea
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Region</label>
                <input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }}>
                  <option value="guide">Guide</option>
                  <option value="van">Van</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date</label>
                <input type="text" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="e.g. Mar 20" style={{ display: 'block', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Budget (₾)</label>
                <input type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ title: '', desc: '', region: 'Tbilisi', type: 'guide', date: '', budget: '' });
                }}
                style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button type="submit" style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600 }}>
                {t('requests.postRequest')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : requests.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>{t('requests.noRequests')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...requests].sort((a, b) => sortMode === 'new' ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0) : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).map((r) => (
            <ExpandableItem
              key={r.id}
              summary={
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                  <span style={{ fontWeight: 600 }}>{r.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.region} · {r.type} · {r.date || '—'}</span>
                  <span style={{ color: 'var(--gold)' }}>₾{r.budget || '—'}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: r.status === 'completed' ? 'var(--cyan-soft)' : r.status === 'booked' ? 'var(--cyan-soft)' : 'var(--gold-soft)', color: r.status === 'completed' ? 'var(--cyan)' : r.status === 'booked' ? 'var(--cyan)' : 'var(--gold)' }}>
                    {r.status}
                  </span>
                  {(offersByRequestId[r.id] || []).length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({(offersByRequestId[r.id] || []).length} offers)</span>
                  )}
                </span>
              }
            >
              {r.desc && <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>{r.desc}</p>}
              {(offersByRequestId[r.id] || []).length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>{t('requests.offers')}</div>
                  {(offersByRequestId[r.id] || []).map((o) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-hover)', borderRadius: 8, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{o.provider}</span>
                        <span style={{ color: 'var(--gold)', marginLeft: 8 }}>₾{o.price}</span>
                        {o.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{o.description}</p>}
                      </div>
                      {r.status === 'open' && o.status !== 'accepted' && (
                        <button
                          type="button"
                          onClick={() => acceptOffer(r.id, o)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          {t('requests.acceptOffer')}
                        </button>
                      )}
                      {o.status === 'accepted' && <span style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>Accepted</span>}
                      {o.status === 'provider_confirmed' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provider marked done</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No offers yet.</p>
              )}
              {r.status === 'booked' && (offersByRequestId[r.id] || []).some((o) => o.status === 'provider_confirmed') && (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => confirmRequestCompleted(r.id)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Confirm completed
                  </button>
                </div>
              )}
            </ExpandableItem>
          ))}
        </div>
      )}
    </div>
  );
}
