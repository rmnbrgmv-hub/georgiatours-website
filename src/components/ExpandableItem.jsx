import { useState } from 'react';

/**
 * A row/card that shows summary and expands on click to show detailed content.
 */
export default function ExpandableItem({ summary, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: open ? 'var(--surface-hover)' : 'var(--surface)',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <span style={{ flex: 1 }}>{summary}</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: 16, background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}
