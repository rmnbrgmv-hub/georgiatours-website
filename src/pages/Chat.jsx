import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { isProviderUser } from '../hooks/useAppData';

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function Chat() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: adminRow } = await supabase.from('users').select('id, name, avatar, color').eq('role', 'admin').maybeSingle();
      const supportPartner = adminRow ? { id: adminRow.id, name: adminRow.name || 'Support', avatar: adminRow.avatar, color: adminRow.color || 'var(--cyan)', isSupport: true } : null;

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
        navigate('/app/chat', { replace: true, state: {} });
      }
    } else if (partnerId && user?.role === 'admin') {
      const p = partners.find((x) => String(x.id) === String(partnerId));
      if (p) {
        setSelected(p);
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
      setMessages(
        (data || []).map((r) => ({
          from: r.from_id,
          text: r.text,
          time: fmtTime(r.created_at),
          isMe: String(r.from_id) === String(uid),
        }))
      );
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
          setMessages((prev) => [
            ...prev,
            { from: r.from_id, text: r.text, time: fmtTime(r.created_at), isMe: String(r.from_id) === String(uid) },
          ]);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selected?.id]);

  const send = () => {
    if (!input.trim() || !selected) return;
    const text = input.trim();
    setInput('');
    supabase.from('messages').insert({
      from_id: user.id,
      to_id: selected.id,
      text,
    });
    setMessages((prev) => [...prev, { from: user.id, text, time: fmtTime(new Date()), isMe: true }]);
  };

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
            onClick={() => setSelected(null)}
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.time}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
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
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{t('chat.subtitle')}</p>
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : partners.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('chat.noPartners')}</p>
          <Link to="/app/bookings" style={{ color: 'var(--gold)', marginTop: 12, display: 'inline-block' }}>{t('nav.bookings')}</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {partners.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: p.color || 'var(--gold)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {(p.avatar || p.name || '').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
