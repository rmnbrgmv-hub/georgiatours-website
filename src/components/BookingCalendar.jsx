import { useState } from 'react';

export default function BookingCalendar({ unavailableDates = [], onSelectDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const formatDate = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isUnavailable = (d) => unavailableDates.includes(formatDate(d));
  const isPast = (d) => new Date(year, month, d) < new Date(new Date().toDateString());
  const isSelected = (d) => selectedDate === formatDate(d);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text)', padding: 4 }}
        >
          ◀
        </button>
        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{monthName}</span>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text)', padding: 4 }}
        >
          ▶
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const unavail = isUnavailable(d);
          const past = isPast(d);
          const disabled = unavail || past;
          const selected = isSelected(d);
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(formatDate(d))}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 6,
                border: selected ? '2px solid #4CAF50' : '1px solid var(--border)',
                background: selected ? '#4CAF5033' : disabled ? 'var(--surface)' : 'var(--surface-hover)',
                color: selected ? '#4CAF50' : disabled ? 'var(--text-muted)' : 'var(--text)',
                fontWeight: selected ? 600 : 400,
                fontSize: '0.85rem',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.4 : 1,
                textDecoration: unavail && !past ? 'line-through' : 'none',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ color: '#4CAF50' }}>■ Selected</span>
        <span style={{ opacity: 0.4 }}>■ Unavailable</span>
      </div>
    </div>
  );
}

