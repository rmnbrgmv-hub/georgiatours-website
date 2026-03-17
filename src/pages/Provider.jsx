import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { parseJsonArray, parsePhotosColumn, photoUrl } from '../utils/supabaseMappers';

export default function Provider() {
  const { id } = useParams();
  const { t } = useLocale();
  const [provider, setProvider] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, role, profile_picture, gallery, bio, provider_type')
        .eq('id', id)
        .eq('role', 'provider')
        .maybeSingle();
      if (!user) {
        setLoading(false);
        return;
      }
      setProvider(user);
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, region, duration, price, photos, type')
        .eq('provider_id', id);
      const services = (servicesData || []).filter((row) => row.suspended !== true);
      const withPhotos = services.map((row) => ({
        ...row,
        photo: photoUrl(parsePhotosColumn(row.photos)[0]),
      }));
      setTours(withPhotos);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (!provider) return <div style={{ padding: 80, textAlign: 'center' }}>Guide not found. <Link to="/explore">Explore tours</Link></div>;

  const pic = provider.profile_picture || provider.profilePic;
  const gallery = parseJsonArray(provider.gallery);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link to="/explore" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, display: 'inline-block' }}>← Explore</Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          {pic ? (
            <img src={photoUrl(pic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{provider.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{provider.provider_type || 'Guide'}</p>
          {provider.bio && <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>{provider.bio}</p>}
        </div>
      </div>

      {gallery.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>Gallery</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {gallery.slice(0, 8).map((img, i) => (
          <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: 'var(--s2, #1a1a2e)' }}>
            <img src={photoUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: 'var(--s2, #1a1a2e)' }} />
          </div>
        ))}
      </div>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>{t('provider.tours')}</h2>
      {tours.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('provider.noTours')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tours.map((tour) => (
            <Link
              key={tour.id}
              to={`/tour/${tour.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              {tour.photo ? (
                <div style={{ width: 72, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--s2, #1a1a2e)' }}>
                  <img src={tour.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: 'var(--s2, #1a1a2e)' }} />
                </div>
              ) : (
                <span style={{ width: 72, height: 48, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗺️</span>
              )}
              <div>
                <strong style={{ display: 'block' }}>{tour.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tour.region} · {tour.duration} · ₾{tour.price}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
