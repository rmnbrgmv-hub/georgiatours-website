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

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const tourists = users.filter((u) => u.role === 'tourist');
  const pt = (u) => (u.provider_type || '').toLowerCase();
  const guides = users.filter((u) => u.role === 'provider' && pt(u) === 'guide');
  const drivers = users.filter((u) => u.role === 'provider' && (pt(u) === 'van' || pt(u) === 'transfer'));

  const UserCard = ({ u }) => (
    <div key={u.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          }}
        >
          {(u.avatar || u.name || '?').slice(0, 2).toUpperCase()}
        </span>
        <div>
          <div style={{ fontWeight: 600 }}>{u.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
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
