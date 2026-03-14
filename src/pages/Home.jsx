import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Home() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('suspended', false)
      .limit(6)
      .then(({ data }) => {
        const mapped = (data || []).map((row) => {
          let photos = [];
          try {
            if (row.photos) photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos;
          } catch (_) {}
          return {
            id: row.id,
            name: row.name,
            region: row.region,
            price: row.price,
            duration: row.duration,
            type: row.type,
            emoji: row.emoji,
            photo: photos?.[0]?.base64 || photos?.[0],
          };
        });
        setTours(mapped);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: '80px 24px 100px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-classic)',
            fontSize: '1.1rem',
            color: 'var(--gold)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Explore Georgia
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 700,
            margin: '0 auto 20px',
          }}
        >
          Discover tours & experiences across Georgia
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto 36px' }}>
          Van tours, local guides, and transfers. One platform — the same trusted app, reimagined for the web.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/explore"
            style={{
              background: 'var(--gold)',
              color: 'var(--bg)',
              padding: '14px 28px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'var(--transition)',
            }}
          >
            Explore tours
          </Link>
          <Link
            to="/explore"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
              padding: '14px 28px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              fontSize: '1rem',
            }}
          >
            View all
          </Link>
        </div>
      </section>

      {/* Featured tours */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.75rem',
            marginBottom: 28,
            color: 'var(--text)',
          }}
        >
          Featured experiences
        </h2>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading…</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {tours.map((t, i) => (
              <Link
                key={t.id}
                to={`/tour/${t.id}`}
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  display: 'block',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ aspectRatio: '16/10', background: 'var(--bg-elevated)', position: 'relative' }}>
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                      {t.emoji || '🗺️'}
                    </span>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'var(--gold-soft)',
                      color: 'var(--gold)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {t.type === 'van' ? '🚐 Van' : t.type === 'guide' ? '🗺️ Guide' : '✈️ Transfer'}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>
                    {t.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                    {t.region} · {t.duration}
                  </p>
                  <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.4rem', color: 'var(--gold)' }}>
                    ₾{t.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
