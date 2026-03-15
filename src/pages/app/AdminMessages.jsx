import { useState, useEffect } from 'react';
import { useOutletContext, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminMessages() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [lastMessageByUserId, setLastMessageByUserId] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, email, avatar, color, role, provider_type')
      .neq('role', 'admin')
      .then(({ data }) => {
        setUsers(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('messages')
      .select('from_id, to_id, text, created_at')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        const byPartner = {};
        (data || []).forEach((m) => {
          const otherId = String(m.from_id) === String(user.id) ? m.to_id : m.from_id;
          if (!byPartner[otherId]) byPartner[otherId] = { text: m.text, created_at: m.created_at };
        });
        setLastMessageByUserId(byPartner);
      });
  }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const tourists = users.filter((u) => u.role === 'tourist');
  const pt = (u) => (u.provider_type || '').toLowerCase();
  const guides = users.filter((u) => u.role === 'provider' && pt(u) === 'guide');
  const drivers = users.filter((u) => u.role === 'provider' && (pt(u) === 'van' || pt(u) === 'transfer'));

  const lastPreview = (uid) => {
    const m = lastMessageByUserId[uid];
    if (!m?.text) return null;
    const txt = String(m.text).slice(0, 50);
    return txt + (m.text.length > 50 ? '…' : '');
  };
  const lastTime = (uid) => {
    const m = lastMessageByUserId[uid];
    if (!m?.created_at) return '';
    const d = new Date(m.created_at);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const UserCard = ({ u }) => (
    <div key={u.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: u.color || 'var(--gold)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.9rem',
            flexShrink: 0,
          }}
        >
          {(u.avatar || u.name || '?').slice(0, 2).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{u.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
          {lastPreview(u.id) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lastMessageByUserId[u.id]?.text}>
              {lastPreview(u.id)}
              {lastTime(u.id) && <span style={{ marginLeft: 6, opacity: 0.8 }}> · {lastTime(u.id)}</span>}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/app/chat', { state: { partnerId: u.id } })}
        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
      >
        Open chat
      </button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.messages')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Open a chat with any user.</p>

      <CollapsibleSection title={`Tourists (${tourists.length})`} icon="🧳" defaultOpen={true}>
        {tourists.length === 0 ? (
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tourists.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {tourists.map((u) => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={`Guides (${guides.length})`} icon="🗺️" defaultOpen={true}>
        {guides.length === 0 ? (
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No guides.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {guides.map((u) => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={`Drivers (${drivers.length})`} icon="🚐" defaultOpen={true}>
        {drivers.length === 0 ? (
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No drivers.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {drivers.map((u) => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
