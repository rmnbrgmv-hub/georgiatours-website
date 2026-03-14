import { useOutletContext, Navigate } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminApprovals() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.approvals')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Pending approvals.</p>
      <CollapsibleSection title="Pending items" icon="✅">
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No pending items.</div>
      </CollapsibleSection>
    </div>
  );
}
