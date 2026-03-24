import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import Layout from '../components/Layout';
import TourCard from '../components/TourCard';
import { mapServiceRow } from '../hooks/useAppData';

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
  const [realStats, setRealStats] = useState(null);

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .limit(6)
      .then(({ data, error }) => {
        if (error) { setTours([]); return; }
        const rows = (data || []).filter((row) => row.suspended !== true);
        const byRating = (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0);
        setTours(rows.sort(byRating).slice(0, 6).map((row) => mapServiceRow ? mapServiceRow(row) : ({
          id: row.id, name: row.name, region: row.region, price: row.price,
          duration: row.duration, type: row.type, emoji: row.emoji, rating: row.rating,
          reviews: row.reviews, total_bookings: row.total_bookings,
          provider_name: row.provider_name || row.provider, provider: row.provider_name || row.provider,
          description: row.description, photos: row.photos ? JSON.parse(row.photos) : [],
          tags: row.tags ? JSON.parse(row.tags) : [], verified: row.verified,
          created_at: row.created_at,
        })));
      })
      .catch(() => setTours([]));
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
    ]).then(([usersRes, toursRes, providersRes]) => {
      const travelers = usersRes.count ?? 0;
      const toursCount = toursRes.count ?? 0;
      const providers = providersRes.count ?? 0;
      setRealStats([
        { value: travelers > 10 ? `${travelers}+` : '12K+', label: 'Active Travelers' },
        { value: toursCount > 5 ? `${toursCount}+` : '60+', label: 'Tours Available' },
        { value: providers > 3 ? `${providers}+` : '500+', label: 'Local Providers' },
      ]);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/explore?q=${encodeURIComponent(searchQuery.trim())}` : '/explore');
  };

  const STATS = realStats || [
    { value: '12K+', label: 'Active Travelers' },
    { value: '60+', label: 'Tours Available' },
    { value: '500+', label: 'Local Providers' },
  ];

  const HOW_IT_WORKS = [
    { step: '01', icon: '/images/map-explore-200.png', title: t('howItWorks.s1t'), desc: t('howItWorks.s1d') },
    { step: '02', icon: '/images/booking-connect-200.png', title: t('howItWorks.s2t'), desc: t('howItWorks.s2d') },
    { step: '03', icon: '/images/chat-icon-200.png', title: t('howItWorks.s3t'), desc: t('howItWorks.s3d') },
  ];

  return (
    <Layout>
      <Helmet>
        <title>TourBid — Your Georgia Tour Marketplace</title>
        <meta name="description" content="Discover tours and experiences across Georgia. Van tours, local guides, and transfers." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{
        position: 'relative', minHeight: '85vh',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
      }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/hero-landscape-1200.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.55)',
        }} />

        {/* Content overlay */}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 700, margin: '0 auto',
          textAlign: 'center', padding: '0 24px', color: '#fff',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 400, lineHeight: 1.15,
            marginBottom: 16,
          }}>
            Discover Georgia with local guides
          </h1>
          <p style={{
            fontSize: '1.15rem', opacity: 0.9,
            marginBottom: 32, lineHeight: 1.6,
          }}>
            Book verified local guides and drivers. Private tours, wine tastings, mountain adventures — all at fair local prices.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: 0,
            background: '#fff', borderRadius: 50,
            padding: 6, maxWidth: 560, margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '14px 24px', fontSize: '1rem',
                borderRadius: '44px 0 0 44px',
                color: '#1A1A2E', background: 'transparent',
              }}
            />
            <button type="submit" style={{
              padding: '14px 32px', borderRadius: 44,
              background: 'var(--accent, #0D9373)', color: '#fff',
              border: 'none', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.15s',
              fontFamily: 'var(--font-body)',
            }}>
              Search
            </button>
          </form>

          {/* Quick filters */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12,
            marginTop: 20, flexWrap: 'wrap',
          }}>
            {['🗺️ Guided tours', '🚐 Day trips', '🍷 Wine tours', '🏔️ Mountains'].map((f) => (
              <button key={f} onClick={() => navigate('/explore')} style={{
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '0.85rem', cursor: 'pointer',
                transition: 'background 0.15s',
                fontFamily: 'var(--font-body)',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
        }}>
          <div className="landing-stats-grid" style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'grid', gridTemplateColumns: `repeat(${STATS.length}, 1fr)`,
            padding: '20px 24px', gap: 8,
          }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontFamily: 'var(--font-body)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary, var(--bg-elevated))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent, var(--gold))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{t('howItWorks.label')}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(24px, 4vw, 2.2rem)' }}>{t('howItWorks.title')}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 16, maxWidth: 500, margin: '16px auto 0', fontSize: '0.95rem' }}>{t('howItWorks.sub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} style={{
                padding: '36px 32px', borderRadius: 'var(--radius)',
                position: 'relative', overflow: 'hidden',
                background: 'var(--bg-elevated, var(--surface))',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 88, fontWeight: 900, color: 'var(--border-light, var(--surface))', fontFamily: 'var(--font-display)', lineHeight: 1, userSelect: 'none', opacity: 0.3 }}>{step}</div>
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: 'var(--accent-light, var(--gold-soft))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, overflow: 'hidden',
                }}>
                  <img src={icon} alt="" style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 16, padding: 4, objectFit: 'cover', opacity: 0.9 }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, fontFamily: 'var(--font-body)' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
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
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent, var(--gold))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{t('home.tagline')}</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(24px, 4vw, 2.2rem)' }}>{t('home.featured')}</h2>
            </div>
            <Link to="/explore" style={{
              padding: '12px 24px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: 'var(--font-body)',
            }}>{t('home.viewAll')} →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} linkTo={`/tour/${tour.id}`} />
            ))}
          </div>
        </section>
      )}

      {/* ─── EXPLORE REGIONS ─── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary, var(--bg-elevated))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent, var(--gold))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{t('regions.label')}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(24px, 4vw, 2.2rem)' }}>{t('regions.title')}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 16, maxWidth: 500, margin: '16px auto 0', fontSize: '0.95rem' }}>{t('regions.sub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {REGIONS.map(({ name, emoji, desc }) => (
              <Link key={name} to={`/explore?region=${encodeURIComponent(name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  padding: '22px 20px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  background: 'var(--bg-elevated, var(--surface))',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, background: 'var(--accent-light, var(--gold-soft))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                  }}>{emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', fontFamily: 'var(--font-body)' }}>{name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
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
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent, var(--gold))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, fontFamily: 'var(--font-body)' }}>{t('testimonials.label')}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(24px, 4vw, 2.2rem)' }}>{t('testimonials.title')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {TESTIMONIALS.map(({ name, flag, text, rating, tour }) => (
            <div key={name} style={{
              padding: 30, borderRadius: 'var(--radius)',
              position: 'relative',
              background: 'var(--bg-elevated, var(--surface))',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 64, lineHeight: 1, fontFamily: 'Georgia, serif', color: 'var(--border-light, var(--gold-soft))', fontWeight: 700, opacity: 0.3 }}>"</div>
              <div style={{ fontSize: 18, marginBottom: 14, color: '#F59E0B' }}>{'★'.repeat(rating)}</div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text)', marginBottom: 22, fontStyle: 'italic' }}>"{text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-light, var(--gold-soft))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{flag}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>{name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{tour}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROVIDER CTA ─── */}
      <section style={{ padding: '88px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary, var(--bg-elevated)) 100%)' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🧭</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 2.5rem)', fontWeight: 400, marginBottom: 16, lineHeight: 1.2 }}>{t('providerCta.title')}</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.65 }}>{t('providerCta.sub')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              padding: '15px 32px', fontSize: '1rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent, var(--gold))', color: '#fff', textDecoration: 'none',
              fontWeight: 600, fontFamily: 'var(--font-body)',
              transition: 'transform 0.15s, box-shadow 0.2s',
            }}>{t('providerCta.apply')}</Link>
            <Link to="/explore" style={{
              padding: '15px 32px', fontSize: '1rem', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-muted)', textDecoration: 'none',
              fontFamily: 'var(--font-body)',
            }}>{t('providerCta.learn')}</Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '72px 24px', background: 'var(--bg-secondary, var(--bg-elevated))', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(24px, 4vw, 2.2rem)', marginBottom: 14 }}>{t('finalCta.title')}</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 32px', fontSize: '0.95rem' }}>{t('finalCta.sub')}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/explore" style={{
            padding: '14px 32px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent, var(--gold))', color: '#fff', textDecoration: 'none',
            fontWeight: 600, fontFamily: 'var(--font-body)',
          }}>{t('finalCta.browse')}</Link>
          <Link to="/login" style={{
            padding: '14px 32px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-muted)', textDecoration: 'none',
            fontFamily: 'var(--font-body)',
          }}>{t('finalCta.create')}</Link>
        </div>
      </section>
    </Layout>
  );
}
