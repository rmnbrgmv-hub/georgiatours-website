import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { isProviderUser } from '../hooks/useAppData';
import { buildBadgesWithSettings, getUserSettingsFromBadges } from '../utils/providerSettings';
import ViewControls, { loadViewPrefs, saveViewPref } from '../components/ViewControls';

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function saveLastChatPreview(text) {
  try { localStorage.setItem('tourbid-last-chat-msg', text || ''); } catch {}
}
export function getLastChatPreview() {
  try { return localStorage.getItem('tourbid-last-chat-msg') || ''; } catch { return ''; }
}

export default function Chat() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cameFromOutside, setCameFromOutside] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  const cSavedViews = loadViewPrefs();
  const [chatView, setChatView] = useState(cSavedViews.chat || 'list');
  const [chatSort, setChatSort] = useState('new');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [offerGroupSize, setOfferGroupSize] = useState('1');
  const [offerTourName, setOfferTourName] = useState('');
  const [offerDetails, setOfferDetails] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const ADMIN_ID = 'ecded33c-be0b-4c27-a87f-ab5f7f4f952f';
      let supportPartner = null;
      try {
        const { data: adminRow, error } = await supabase.from('users').select('id, name, avatar, color').eq('id', ADMIN_ID).maybeSingle();
        if (error) console.error('Failed to load support user (web):', error);
        if (adminRow) {
          supportPartner = {
            id: adminRow.id,
            name: adminRow.name || 'Support',
            avatar: adminRow.avatar,
            color: adminRow.color || 'var(--cyan)',
            isSupport: true,
          };
        } else {
          supportPartner = {
            id: ADMIN_ID,
            name: 'Support',
            avatar: 'GT',
            color: 'var(--cyan)',
            isSupport: true,
          };
        }
      } catch (e) {
        console.error('Exception loading support user (web):', e);
      }

      if (isProviderUser(user)) {
        const { data: bookingData } = await supabase.from('bookings').select('tourist_id, tourist_name').eq('provider_id', user.id);
        const ids = [...new Set((bookingData || []).map((b) => b.tourist_id).filter(Boolean))];
        const { data: users } = await supabase.from('users').select('id, name, avatar, color').in('id', ids);
        const byId = {};
        (users || []).forEach((u) => { byId[u.id] = u; });
        const list = (bookingData || [])
          .filter((b, i, arr) => arr.findIndex((x) => x.tourist_id === b.tourist_id) === i)
          .map((b) => ({
            id: b.tourist_id,
            name: byId[b.tourist_id]?.name || b.tourist_name || 'Tourist',
            avatar: byId[b.tourist_id]?.avatar,
            color: byId[b.tourist_id]?.color || 'var(--gold)',
          }));
        setPartners(supportPartner ? [supportPartner, ...list] : list);
      } else if (user.role === 'admin') {
        const { data: allUsers } = await supabase.from('users').select('id, name, avatar, color').neq('role', 'admin');
        const list = (allUsers || []).map((u) => ({ id: u.id, name: u.name || 'User', avatar: u.avatar, color: u.color || 'var(--gold)' }));
        setPartners(list);
      } else {
        const { data: bookingData } = await supabase.from('bookings').select('provider_id, provider_name').eq('tourist_id', user.id);
        const ids = [...new Set((bookingData || []).map((b) => b.provider_id).filter(Boolean))];
        const { data: users } = await supabase.from('users').select('id, name, avatar, color').in('id', ids);
        const byId = {};
        (users || []).forEach((u) => { byId[u.id] = u; });
        const list = (bookingData || [])
          .filter((b, i, arr) => arr.findIndex((x) => x.provider_id === b.provider_id) === i)
          .map((b) => ({
            id: b.provider_id,
            name: byId[b.provider_id]?.name || b.provider_name || 'Provider',
            avatar: byId[b.provider_id]?.avatar,
            color: byId[b.provider_id]?.color || 'var(--gold)',
          }));
        setPartners(supportPartner ? [supportPartner, ...list] : list);
      }
      setLoading(false);
    })();
  }, [user?.id, user?.role, user?.provider_type, user?.type]);

  useEffect(() => {
    if (loading || partners.length === 0) return;
    const openSupport = location.state?.openSupport;
    const partnerId = location.state?.partnerId;
    if (openSupport && user?.role !== 'admin') {
      const supportUser = partners.find((p) => p.isSupport);
      if (supportUser) {
        setSelected(supportUser);
        setCameFromOutside(true);
        navigate('/app/chat', { replace: true, state: {} });
      }
    } else if (partnerId) {
      const p = partners.find((x) => String(x.id) === String(partnerId));
      if (p) {
        setSelected(p);
        setCameFromOutside(true);
        navigate('/app/chat', { replace: true, state: {} });
      }
    }
  }, [loading, partners, location.state, user?.role, navigate]);

  useEffect(() => {
    if (!user?.id || !selected?.id) return;
    const uid = user.id;
    const pid = selected.id;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_id.eq."${uid}",to_id.eq."${pid}"),and(from_id.eq."${pid}",to_id.eq."${uid}")`)
        .order('created_at', { ascending: true });
      if (!alive) return;
      if (error) {
        setMessages([]);
        return;
      }
      const mapped = (data || []).map((r) => ({
          id: r.id,
          from: r.from_id,
          from_id: r.from_id,
          to_id: r.to_id,
          text: r.text,
          time: fmtTime(r.created_at),
          isMe: String(r.from_id) === String(uid),
        }));
      setMessages(mapped);
      if (mapped.length > 0) saveLastChatPreview(mapped[mapped.length - 1].text);
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, selected?.id]);

  useEffect(() => {
    if (!user?.id || !selected?.id) return () => {};
    const uid = user.id;
    const pid = selected.id;
    const channel = supabase
      .channel('messages-' + [uid, pid].sort().join('-'))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const r = payload.new;
          if (!r) return;
          if (String(r.from_id) !== String(pid) && String(r.from_id) !== String(uid)) return;
          if (String(r.to_id) !== String(uid) && String(r.to_id) !== String(pid)) return;
          const newMsg = { id: r.id, from: r.from_id, from_id: r.from_id, to_id: r.to_id, text: r.text, time: fmtTime(r.created_at), isMe: String(r.from_id) === String(uid) };
          setMessages((prev) => [...prev, newMsg]);
          saveLastChatPreview(r.text);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selected?.id]);

  const send = async () => {
    if (!input.trim() || !selected) return;
    const text = input.trim();
    setInput('');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session [web:Chat.send]:', session ? 'ACTIVE' : 'NONE', session?.user?.id);
    if (!session) {
      return;
    }
    supabase.from('messages').insert({
      from_id: user.id,
      to_id: selected.id,
      text,
    });
    setMessages((prev) => [...prev, { id: 'optimistic-' + Date.now(), from: user.id, from_id: user.id, to_id: selected.id, text, time: fmtTime(new Date()), isMe: true }]);
  };

  function detectTourFromChat(chatMessages, chatPartnerId) {
    const inquiry = (chatMessages || []).find(
      (m) => String(m.from_id ?? m.from) === String(chatPartnerId) && m.text && String(m.text).includes('interested in your tour')
    );
    if (!inquiry?.text) return null;
    const txt = String(inquiry.text);
    const match = txt.match(/tour\s+["']([^"']+)["']/i);
    const dateMatch = txt.match(/on\s+(\d{4}-\d{2}-\d{2})/i);
    const groupMatch = txt.match(/for\s+(\d+)\s+people/i);
    return {
      tourName: match ? match[1] : 'Tour',
      date: dateMatch ? dateMatch[1] : '',
      groupSize: groupMatch ? groupMatch[1] : '1',
    };
  }

  function parseOfferText(text) {
    const raw = String(text || '');
    const isAccepted = raw.startsWith('[ACCEPTED]');
    const isOffer = raw.startsWith('[OFFER]');
    if (!isOffer && !isAccepted) return null;
    const parts = raw.replace('[OFFER]', '').replace('[ACCEPTED]', '').split('|');
    // Expected: [OFFER]|price|date|groupSize|tourId|tourName|details
    return {
      isAccepted,
      price: parts[1] || '0',
      date: parts[2] || '',
      groupSize: parts[3] || '1',
      tourId: parts[4] || '',
      tourName: parts[5] || 'Tour',
      details: parts[6] || '',
    };
  }

  async function acceptOffer(msg, offer) {
    if (!user?.id || user.role !== 'tourist') return;
    const providerId = msg.from_id ?? msg.from;
    const qty = Math.max(1, Math.min(20, parseInt(offer.groupSize, 10) || 1));
    const price = Number(offer.price) || 0;

    // Create booking (new schema first; fallback to legacy)
    const newPayload = {
      tourist_id: user.id,
      provider_id: providerId,
      service_id: offer.tourId || null,
      date: offer.date,
      group_size: qty,
      total_price: price,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    const { error: e1 } = await supabase.from('bookings').insert(newPayload);
    if (e1) {
      const legacyPayload = {
        tourist_id: user.id,
        tourist_name: user.name,
        provider_id: providerId,
        provider_name: selected?.name,
        service_id: offer.tourId || undefined,
        service_name: offer.tourName,
        date: offer.date,
        amount: price,
        total_price: price,
        group_size: qty,
        status: 'confirmed',
        reviewed: false,
      };
      const { error: e2 } = await supabase.from('bookings').insert(legacyPayload);
      if (e2) {
        alert('Booking failed: ' + (e2.message || e1.message));
        return;
      }
    }

    // Update offer message to accepted
    if (msg.id && String(msg.id).startsWith('optimistic-') === false) {
      const updatedText = String(msg.text || '').replace('[OFFER]', '[ACCEPTED]');
      await supabase.from('messages').update({ text: updatedText }).eq('id', msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, text: updatedText } : m)));
    }

    // Send confirmation message
    await supabase.from('messages').insert({
      from_id: user.id,
      to_id: providerId,
      text: `✅ Offer accepted! Booking confirmed for ${offer.tourName} on ${offer.date} for ${qty} people. Total: ₾${offer.price}`,
    });

    // Auto-block date for individual providers (settings badge)
    const { data: providerRow } = await supabase.from('users').select('badges').eq('id', providerId).maybeSingle();
    const settings = getUserSettingsFromBadges(providerRow?.badges);
    if (settings.provider_mode !== 'company') {
      const nextDates = Array.from(new Set([...(settings.availability.unavailable_dates || []), offer.date])).sort();
      const nextSettings = { ...settings, availability: { ...settings.availability, unavailable_dates: nextDates } };
      await supabase
        .from('users')
        .update({ badges: JSON.stringify(buildBadgesWithSettings(providerRow?.badges, nextSettings)) })
        .eq('id', providerId);
    }
  }

  async function declineOffer(msg) {
    const providerId = msg.from_id ?? msg.from;
    await supabase.from('messages').insert({
      from_id: user.id,
      to_id: providerId,
      text: "Thanks for the offer, but I'll pass on this one.",
    });
  }

  function renderOfferCard(msg, offer) {
    const isFromMe = String(msg.from_id ?? msg.from) === String(user.id);
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          maxWidth: '85%',
          border: offer.isAccepted ? '2px solid #4CAF50' : '2px solid var(--gold,#C9A84C)',
          background: offer.isAccepted ? '#4CAF5015' : 'var(--gold,#C9A84C)15',
          margin: '8px 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: offer.isAccepted ? '#4CAF50' : 'var(--gold,#C9A84C)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {offer.isAccepted ? '✅ Accepted offer' : '💰 Price offer'}
          </span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>₾{offer.price}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div>🗓 {offer.date}</div>
          <div>👥 {offer.groupSize} people</div>
          <div>🏔 {offer.tourName}</div>
          {offer.details && <div style={{ marginTop: 4 }}>📋 {offer.details}</div>}
        </div>
        {!isFromMe && !offer.isAccepted && user.role === 'tourist' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => acceptOffer(msg, offer)}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
            >
              Accept & Book
            </button>
            <button
              type="button"
              onClick={() => declineOffer(msg)}
              style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Decline
            </button>
          </div>
        )}
        {offer.isAccepted && (
          <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: '#4CAF5022', color: '#4CAF50', fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' }}>
            Booking confirmed!
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>{t('tour.signInToBook')}</p>
        <Link to="/login?redirect=/app/chat" style={{ color: 'var(--gold)' }}>{t('nav.signIn')}</Link>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="chat-conversation" style={{ padding: '24px', maxWidth: 600, margin: '0 auto', minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => { if (cameFromOutside) { navigate(-1); } else { setSelected(null); } }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: selected.color || 'var(--gold)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {(selected.avatar || selected.name || '').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{selected.name}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {messages.map((m, i) => (
            <div key={i} className="chat-message" style={{ alignSelf: m.isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              {(() => {
                const offer = parseOfferText(m.text);
                if (offer) return renderOfferCard(m, offer);
                return (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: m.isMe ? 'var(--gold-soft)' : 'var(--surface-hover)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {m.text}
                  </div>
                );
              })()}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.time}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {user.role === 'provider' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => {
                const info = detectTourFromChat(messages, selected.id);
                if (info) {
                  setOfferDate(info.date);
                  setOfferGroupSize(info.groupSize);
                  setOfferTourName(info.tourName);
                }
                setShowOfferForm(true);
              }}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gold,#C9A84C)', background: 'var(--gold,#C9A84C)22', color: 'var(--gold,#C9A84C)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              💰 Send Offer
            </button>
          </div>
        )}
        {showOfferForm && (
          <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--gold,#C9A84C)', background: 'var(--surface)', margin: '8px 0' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: 10 }}>Send a price offer</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Price (₾)</label>
                <input type="number" placeholder="200" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</label>
                <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)' }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Group size</label>
              <input type="number" min="1" value={offerGroupSize} onChange={(e) => setOfferGroupSize(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>What's included? (optional)</label>
              <textarea value={offerDetails} onChange={(e) => setOfferDetails(e.target.value)} rows={2} placeholder="Transport, lunch, entrance fees..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!offerPrice) {
                    alert('Enter a price');
                    return;
                  }
                  const { data: tours } = await supabase
                    .from('services')
                    .select('id')
                    .eq('provider_id', user.id)
                    .ilike('name', '%' + (offerTourName || '') + '%')
                    .limit(1);
                  const tourId = tours?.[0]?.id || '';
                  const offerText = `[OFFER]|${offerPrice}|${offerDate}|${offerGroupSize}|${tourId}|${offerTourName || 'Tour'}|${offerDetails || 'Standard tour'}`;
                  await supabase.from('messages').insert({ from_id: user.id, to_id: selected.id, text: offerText });
                  setShowOfferForm(false);
                  setOfferPrice('');
                  setOfferDetails('');
                }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--gold,#C9A84C)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}
              >
                Send Offer{offerPrice ? ` — ₾${offerPrice}` : ''}
              </button>
              <button type="button" onClick={() => setShowOfferForm(false)} style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="chat-input-row" style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={t('chat.placeholder')}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            type="button"
            onClick={send}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('chat.send')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 4 }}>{t('chat.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{t('chat.subtitle')}</p>
      <ViewControls view={chatView} setView={(v) => { setChatView(v); saveViewPref('chat', v); }} sort={chatSort} setSort={setChatSort} />
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : partners.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('chat.noPartners')}</p>
          <Link to="/app/bookings" style={{ color: 'var(--gold)', marginTop: 12, display: 'inline-block' }}>{t('nav.bookings')}</Link>
        </div>
      ) : (
        <div style={chatView === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 } : { display: 'flex', flexDirection: 'column', gap: chatView === 'compact' ? 2 : 8 }}>
          {partners.map((p) => {
            if (chatView === 'grid') {
              return (
                <button key={p.id} type="button" onClick={() => setSelected(p)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1rem' }}>
                    {(p.avatar || p.name || '').slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>{p.name}</span>
                  {p.isSupport && <span style={{ fontSize: '0.65rem', background: 'var(--gold-soft)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 20, fontWeight: 600 }}>Support</span>}
                </button>
              );
            }
            if (chatView === 'compact') {
              return (
                <button key={p.id} type="button" onClick={() => setSelected(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover, var(--surface))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }}>
                    {(p.avatar || p.name || '').slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{p.name}{p.isSupport ? ' ★' : ''}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>›</span>
                </button>
              );
            }
            return (
              <button key={p.id} type="button" onClick={() => setSelected(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1rem' }}>
                  {(p.avatar || p.name || '').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.isSupport && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'var(--gold-soft)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Support</span>}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
