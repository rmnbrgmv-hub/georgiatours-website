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

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.messages')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Open a chat with any user.</p>

      <CollapsibleSection title={`Users (${users.length})`} icon="💬" defaultOpen={true}>
        {users.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No users.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {users.map((u) => (
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.role}{u.provider_type ? ` · ${u.provider_type}` : ''}</div>
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
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
