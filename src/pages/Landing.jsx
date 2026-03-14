import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import Layout from '../components/Layout';

const HERO_IMAGES = 30;
const imageSrcs = Array.from({ length: HERO_IMAGES }, (_, i) => `/geoimages/${i + 1}.jpg`);

export default function Landing() {
  const { t } = useLocale();
  const [tours, setTours] = useState([]);

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('suspended', false)
      .limit(6)
      .then(({ data }) => {
        setTours(
          (data || []).map((row) => {
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
          })
        );
      });
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>GeorgiaTours — Explore Georgia</title>
        <meta name="description" content="Discover tours and experiences across Georgia. Van tours, local guides, and transfers." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section
        style={{
          padding: '80px 24px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Collage background */}
        <div className="landing-hero-collage" aria-hidden>
          <div className="landing-hero-collage-inner">
            {imageSrcs.map((src, i) => (
              <div key={i} className="landing-hero-tile" style={{ ['--i']: i }}>
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="landing-hero-fade landing-hero-fade-t" />
          <div className="landing-hero-fade landing-hero-fade-b" />
          <div className="landing-hero-fade landing-hero-fade-l" />
          <div className="landing-hero-fade landing-hero-fade-r" />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700 }}>
          <p
            style={{
              fontFamily: 'var(--font-classic)',
              fontSize: '1.1rem',
              color: 'var(--gold)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 16,
              textShadow: '0 1px 10px rgba(0,0,0,0.4)',
            }}
          >
            {t('home.tagline')}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              color: 'var(--text)',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {t('home.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto 36px', textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>
            {t('home.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/explore" className="layout-btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              {t('home.exploreTours')}
            </Link>
            <Link
              to="/login"
              className="layout-btn-outline"
              style={{ padding: '16px 32px', fontSize: '1.05rem' }}
            >
              {t('nav.signIn')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURED TOURS ─── */}
      {tours.length > 0 && (
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
            {t('home.featured')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {tours.map((tour, i) => (
              <Link
                key={tour.id}
                to={`/tour/${tour.id}`}
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
                  {tour.photo ? (
                    <img src={tour.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                      {tour.emoji || '🗺️'}
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
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {tour.type === 'van' ? '🚐 Van' : tour.type === 'guide' ? '🗺️ Guide' : '✈️ Transfer'}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>
                    {tour.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                    {tour.region} · {tour.duration}
                  </p>
                  <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.4rem', color: 'var(--gold)' }}>
                    ₾{tour.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/explore" className="layout-btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
              {t('home.viewAll')} →
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}
