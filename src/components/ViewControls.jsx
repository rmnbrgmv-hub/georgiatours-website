import { useState } from 'react';

const VIEW_KEY = 'tourbid-view-prefs';

export function loadViewPrefs() {
  try {
    return JSON.parse(localStorage.getItem(VIEW_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveViewPref(tab, view) {
  const prefs = loadViewPrefs();
  prefs[tab] = view;
  localStorage.setItem(VIEW_KEY, JSON.stringify(prefs));
}

export default function ViewControls({ view, setView, sort, setSort, showSort = true }) {
  const modes = [
    { id: 'list', icon: '☰', label: 'List' },
    { id: 'compact', icon: '▤', label: 'Compact' },
    { id: 'grid', icon: '▦', label: 'Grid' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          background: 'var(--surface-hover, var(--surface))',
          borderRadius: 8,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setView(m.id)}
            title={m.label}
            style={{
              padding: '6px 10px',
              border: 'none',
              background: view === m.id ? 'var(--gold)' : 'transparent',
              color: view === m.id ? 'var(--bg, #fff)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {m.icon}
          </button>
        ))}
      </div>
      {showSort && (
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'new' ? 'old' : 'new'))}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {sort === 'new' ? '↓ Newest' : '↑ Oldest'}
        </button>
      )}
    </div>
  );
}
