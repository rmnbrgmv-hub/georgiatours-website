import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useRequests } from '../hooks/useAppData';

export default function Requests() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const { requests: dbRequests, loading: requestsLoading, refetch: refetchRequests } = useRequests();
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', region: 'Tbilisi', type: 'guide', date: '', budget: '' });

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
      .then(({ data: offData }) => {
        const byReq = {};
        (offData || []).forEach((o) => {
          if (!byReq[o.request_id]) byReq[o.request_id] = [];
          byReq[o.request_id].push({
            id: o.id,
            provider_id: o.provider_id,
            providerId: o.provider_id,
            provider_name: o.provider_name,
            provider: o.provider_name,
            price: o.price,
            description: o.description,
            status: o.status,
          });
        });
        setOffersByRequestId(byReq);
      });
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
    const payload = {
      tourist_id: user.id,
      tourist_name: user.name,
      avatar: user.avatar ?? (user.name || '').slice(0, 2).toUpperCase(),
      title: form.title.trim(),
      description: form.desc.trim() || null,
      region: form.region,
      type: form.type,
      date: form.date || null,
      budget: Number(form.budget) || 0,
      status: 'open',
    };
    const { error } = await supabase.from('requests').insert(payload).select('*').single();
    if (error) return;
    refetchRequests();
    setForm({ title: '', desc: '', region: 'Tbilisi', type: 'guide', date: '', budget: '' });
    setShowForm(false);
  };

  const acceptOffer = async (requestId, offer) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r || r.status !== 'open') return;
    const parts = (user?.name || '').trim().split(/\s+/);
    const shortName = parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1][0] + '.' : (parts[0] || 'Tourist');
    const bookingPayload = {
      tourist_id: user.id,
      tourist_name: shortName,
      service_name: r.title || 'Custom request',
      provider_id: offer.providerId ?? offer.provider_id,
      provider_name: offer.provider ?? offer.provider_name,
      date: r.date || 'TBD',
      amount: offer.price,
      status: 'confirmed',
      reviewed: false,
    };
    await supabase.from('bookings').insert(bookingPayload);
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id);
    await supabase.from('offers').update({ status: 'declined' }).eq('request_id', requestId).neq('id', offer.id);
    await supabase.from('requests').update({ status: 'booked' }).eq('id', requestId);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 4 }}>{t('requests.title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('requests.subtitle')}</p>
        </div>
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
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
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
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{t('requests.noRequests')}</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600 }}
          >
            {t('requests.newRequest')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map((r) => (
            <div key={r.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.region} · {r.type} · {r.date || '—'} · Budget ₾{r.budget || '—'}</p>
                  {r.desc && <p style={{ fontSize: '0.85rem', marginTop: 8 }}>{r.desc}</p>}
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: r.status === 'booked' ? 'var(--cyan-soft)' : 'var(--gold-soft)', color: r.status === 'booked' ? 'var(--cyan)' : 'var(--gold)' }}>
                  {r.status}
                </span>
              </div>
              {(offersByRequestId[r.id] || []).length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
