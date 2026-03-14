import { useState } from 'react';

export default function CollapsibleSection({ title, children, defaultOpen = true, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'var(--surface)',
          border: 'none',
          color: 'var(--text)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </button>
      {open && <div style={{ padding: 16, background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>{children}</div>}
    </div>
  );
}
