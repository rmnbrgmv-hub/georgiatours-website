import { useState } from 'react';

export default function AvailabilityCalendar({ unavailableDates = [], onToggleDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const formatDate = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isUnavailable = (d) => unavailableDates.includes(formatDate(d));
  const isPast = (d) => new Date(year, month, d) < new Date(new Date().toDateString());

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: 'var(--text)',
            padding: 4,
          }}
        >
          ◀
        </button>
        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{monthName}</span>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: 'var(--text)',
            padding: 4,
          }}
        >
          ▶
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const unavail = isUnavailable(d);
          const past = isPast(d);
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              onClick={() => onToggleDate(formatDate(d))}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 6,
                border: unavail ? '2px solid #f44336' : '1px solid var(--border)',
                background: unavail ? '#f4433622' : past ? 'var(--surface)' : 'var(--surface-hover)',
                color: past ? 'var(--text-muted)' : unavail ? '#f44336' : 'var(--text)',
                fontWeight: unavail ? 600 : 400,
                fontSize: '0.85rem',
                cursor: past ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>Tap dates to mark unavailable</span>
        <span style={{ color: '#f44336' }}>■ Unavailable</span>
      </div>
    </div>
  );
}
