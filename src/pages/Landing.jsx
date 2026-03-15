import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import Layout from '../components/Layout';

const HERO_IMAGES = 30;
const imageSrcs = Array.from({ length: HERO_IMAGES }, (_, i) => `/geoimages/${i + 1}.jpg`);

const REGIONS = [
  { name: 'Tbilisi', emoji: '🏙️', desc: 'Old Town & Wine' },
  { name: 'Kazbegi', emoji: '⛰️', desc: 'Mountains & Trails' },
  { name: 'Kakheti', emoji: '🍇', desc: 'Wine & History' },
  { name: 'Svaneti', emoji: '🗼', desc: 'Medieval Towers' },
  { name: 'Batumi', emoji: '🌊', desc: 'Black Sea Coast' },
  { name: 'Kutaisi', emoji: '🏛️', desc: 'Ancient Capital' },
];

const TESTIMONIALS = [
  { name: 'Sarah Mitchell', flag: '🇺🇸', rating: 5, text: 'Our guide Giorgi was absolutely incredible. He took us to hidden spots we never would have found on our own. Georgia completely blew my mind!', tour: 'Tbilisi Old Town Walking Tour' },
  { name: 'Hans Weber', flag: '🇩🇪', rating: 5, text: 'The van tour to Kazbegi was breathtaking. Professional driver, comfortable vehicle, and perfect English. Worth every penny.', tour: 'Kazbegi Day Trip' },
  { name: 'Yuki Tanaka', flag: '🇯🇵', rating: 5, text: 'Booked a wine tour in Kakheti through this platform. The guide knew every vineyard personally. Best wine experience of my life!', tour: 'Kakheti Wine Country Tour' },
];

export default function Landing() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .limit(6)
      .then(({ data, error }) => {
        if (error) {
          setTours([]);
          return;
        }
        const rows = (data || []).filter((row) => row.suspended !== true);
        const byRating = (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0);
        setTours(
          rows.sort(byRating).slice(0, 6).map((row) => {
            let photos = [];
            try { if (row.photos) photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos; } catch (_) {}
            return { id: row.id, name: row.name, region: row.region, price: row.price, duration: row.duration, type: row.type, emoji: row.emoji, rating: row.rating, photo: photos?.[0]?.base64 || photos?.[0] };
          })
        );
      })
      .catch(() => setTours([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/explore?q=${encodeURIComponent(searchQuery.trim())}` : '/explore');
  };

  const STATS = [
    { value: '500+', label: t('stats.guides') },
    { value: '12K+', label: t('stats.travelers') },
    { value: '4.9★', label: t('stats.rating') },
    { value: '60+', label: t('stats.destinations') },
  ];

  const HOW_IT_WORKS = [
    { step: '01', icon: '🔍', title: t('howItWorks.s1t'), desc: t('howItWorks.s1d') },
    { step: '02', icon: '📅', title: t('howItWorks.s2t'), desc: t('howItWorks.s2d') },
    { step: '03', icon: '🏔️', title: t('howItWorks.s3t'), desc: t('howItWorks.s3d') },
  ];

  return (
    <Layout>
      <Helmet>
        <title>TourBid — Your Georgia Tour Marketplace</title>
        <meta name="description" content="Discover tours and experiences across Georgia. Van tours, local guides, and transfers." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '92vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Collage background */}
        <div className="landing-hero-collage" aria-hidden>
          <div className="landing-hero-collage-inner">
            {imageSrcs.map((src, i) => (
              <div key={i} className="landing-hero-tile" style={{ '--i': i }}>
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="landing-hero-fade landing-hero-fade-t" />
          <div className="landing-hero-fade landing-hero-fade-b" />
          <div className="landing-hero-fade landing-hero-fade-l" />
          <div className="landing-hero-fade landing-hero-fade-r" />
        </div>

        <div style={{ position: 'relative', zIndex: 2, padding: '100px 24px 160px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: 680 }} className="animate-fade-up">
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--gold-soft)', border: '1px solid var(--gold)',
              color: 'var(--gold)', padding: '6px 16px', borderRadius: 100,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 28,
              backdropFilter: 'blur(8px)',
            }}>
              🇬🇪 {t('hero.badge')}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6vw, 74px)',
              fontWeight: 700, color: 'var(--text)', lineHeight: 1.08, marginBottom: 24,
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}>
              {t('hero.headline1')}{' '}
              <span style={{ color: 'var(--gold)' }}>{t('hero.headline2')}</span>
              <br />{t('hero.headline3')}
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)',
              lineHeight: 1.75, marginBottom: 44, maxWidth: 520,
              textShadow: '0 1px 10px rgba(0,0,0,0.4)',
            }}>
              {t('hero.sub')}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{
              display: 'flex', gap: 8, background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)', padding: 8,
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)', maxWidth: 560,
              border: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
                <input
                  type="text"
                  placeholder={t('hero.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', background: 'transparent' }}
                />
              </div>
              <button type="submit" className="layout-btn-primary" style={{ borderRadius: 12, padding: '11px 22px' }}>
                {t('hero.searchBtn')}
              </button>
            </form>

            {/* Quick filters */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { label: t('hero.guided'), type: 'guide' },
                { label: t('hero.van'), type: 'van' },
                { label: t('hero.transfer'), type: 'transfer' },
              ].map(({ label, type }) => (
                <button
                  key={type}
                  onClick={() => navigate(`/explore?type=${type}`)}
                  style={{
                    padding: '9px 18px', borderRadius: 100,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px 24px', gap: 8 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('howItWorks.label')}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)' }}>{t('howItWorks.title')}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>{t('howItWorks.sub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} className="glass" style={{
                padding: '36px 32px', borderRadius: 'var(--radius)', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}>
                <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 88, fontWeight: 900, color: 'var(--surface)', fontFamily: 'var(--font-display)', lineHeight: 1, userSelect: 'none' }}>{step}</div>
                <div style={{
                  width: 60, height: 60, borderRadius: 16, background: 'var(--gold-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20,
                }}>{icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED TOURS ─── */}
      {tours.length > 0 && (
        <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('home.tagline')}</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)' }}>{t('home.featured')}</h2>
            </div>
            <Link to="/explore" className="layout-btn-outline" style={{ padding: '12px 24px' }}>{t('home.viewAll')} →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {tours.map((tour, i) => (
              <Link
                key={tour.id}
                to={`/tour/${tour.id}`}
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 0.08}s`, display: 'block',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'var(--transition)',
                }}
              >
                <div style={{ aspectRatio: '16/10', background: 'var(--bg-elevated)', position: 'relative' }}>
                  {tour.photo ? (
                    <img src={tour.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>{tour.emoji || '🗺️'}</span>
                  )}
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--gold-soft)', color: 'var(--gold)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                    {tour.type === 'van' ? '🚐 Van' : tour.type === 'guide' ? '🗺️ Guide' : '✈️ Transfer'}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>{tour.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{tour.region} · {tour.duration} · ⭐ {tour.rating || '—'}</p>
                  <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.4rem', color: 'var(--gold)' }}>₾{tour.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── EXPLORE REGIONS ─── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('regions.label')}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)' }}>{t('regions.title')}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>{t('regions.sub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {REGIONS.map(({ name, emoji, desc }) => (
              <Link key={name} to={`/explore?region=${encodeURIComponent(name)}`}>
                <div className="glass" style={{
                  padding: '22px 20px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, background: 'var(--gold-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                  }}>{emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text-dim)', flexShrink: 0 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('testimonials.label')}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)' }}>{t('testimonials.title')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {TESTIMONIALS.map(({ name, flag, text, rating, tour }) => (
            <div key={name} className="glass" style={{ padding: 30, borderRadius: 'var(--radius)', position: 'relative', transition: 'transform 0.25s' }}>
              <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 64, lineHeight: 1, fontFamily: 'Georgia, serif', color: 'var(--gold-soft)', fontWeight: 700 }}>"</div>
              <div style={{ fontSize: 18, marginBottom: 14, color: 'var(--gold)' }}>{'★'.repeat(rating)}</div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text)', marginBottom: 22, fontStyle: 'italic' }}>"{text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{flag}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{tour}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROVIDER CTA ─── */}
      <section style={{ padding: '88px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-elevated) 100%)' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🧭</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>{t('providerCta.title')}</h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.65 }}>{t('providerCta.sub')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="layout-btn-primary" style={{ padding: '15px 32px', fontSize: 15 }}>{t('providerCta.apply')}</Link>
            <Link to="/explore" className="layout-btn-outline" style={{ padding: '15px 32px', fontSize: 15 }}>{t('providerCta.learn')}</Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '72px 24px', background: 'var(--bg-elevated)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)', marginBottom: 14 }}>{t('finalCta.title')}</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 32px' }}>{t('finalCta.sub')}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/explore" className="layout-btn-primary" style={{ padding: '14px 32px' }}>{t('finalCta.browse')}</Link>
          <Link to="/login" className="layout-btn-outline" style={{ padding: '14px 32px' }}>{t('finalCta.create')}</Link>
        </div>
      </section>
    </Layout>
  );
}
