import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapRequestRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';

export default function ProviderRequests() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [openRequests, setOpenRequests] = useState([]);
  const [activeJobOffers, setActiveJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', msg: '' });

  const providerType = user?.type || user?.provider_type;

  useEffect(() => {
    if (!user?.id) return;
    const tick = async () => {
      const [openRes, offersRes] = await Promise.all([
        supabase.from('requests').select('*').eq('status', 'open'),
        supabase.from('offers').select('*').eq('provider_id', user.id).eq('status', 'accepted'),
      ]);
      const relevant = (openRes.data || []).filter((row) =>
        providerType === 'guide' ? row.type === 'guide' : (row.type === 'van' || row.type === 'transfer')
      );
      setOpenRequests(relevant.map(mapRequestRow));
      setActiveJobOffers(offersRes.data || []);
      setLoading(false);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [user?.id, providerType]);

  const markOfferCompleted = async (offerId) => {
    const { error } = await supabase.from('offers').update({ status: 'provider_confirmed' }).eq('id', offerId);
    if (!error) {
      setActiveJobOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'provider_confirmed' } : o)));
    }
  };

  const sendOffer = async () => {
    if (!offerModal || !user?.id || !offerForm.price) return;
    const { error } = await supabase.from('offers').insert({
      request_id: offerModal.id,
      provider_id: user.id,
      provider_name: user.name || '',
      provider_avatar: user.avatar ?? null,
      provider_color: user.color ?? null,
      price: Number(offerForm.price) || 0,
      duration: offerForm.duration || null,
      description: offerForm.msg || '',
      status: 'pending',
    });
    if (!error) {
      setOfferModal(null);
      setOfferForm({ price: '', msg: '' });
      setOpenRequests((prev) => prev.map((r) => (r.id === offerModal.id ? { ...r, offers: [...(r.offers || []), { price: offerForm.price }] } : r)));
    }
  };

  if (!user) return null;
  if (user.role !== 'provider') return <Navigate to="/app" replace />;
  if (loading && openRequests.length === 0) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.requests')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Open trip requests — send an offer.</p>

      {activeJobOffers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>My active jobs (accepted offers)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeJobOffers.map((o) => (
              <div key={o.id} className="glass" style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Request #{o.request_id}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>₾{o.price} · {o.description || '—'}</div>
                </div>
                {o.status !== 'provider_confirmed' ? (
                  <button type="button" onClick={() => markOfferCompleted(o.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Mark as completed</button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for tourist to confirm</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Open requests</h2>
      {openRequests.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No open requests matching your type.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {openRequests.map((r) => (
            <div key={r.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.tourist} · {r.region} · {r.type} · {r.date} · Budget ₾{r.budget}</div>
                  {r.desc && <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--text-dim)' }}>{r.desc}</p>}
                </div>
                <button type="button" onClick={() => setOfferModal(r)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Send offer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {offerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setOfferModal(null)}>
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', minWidth: 320, border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Offer for: {offerModal.title}</h3>
            <input type="number" placeholder="Price (₾)" value={offerForm.price} onChange={(e) => setOfferForm((f) => ({ ...f, price: e.target.value }))} style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }} />
            <textarea placeholder="Message (optional)" value={offerForm.msg} onChange={(e) => setOfferForm((f) => ({ ...f, msg: e.target.value }))} rows={3} style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setOfferModal(null)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={sendOffer} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Send offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
