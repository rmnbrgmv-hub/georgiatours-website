import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapBookingRow, isProviderUser } from '../hooks/useAppData';

const MAX_GALLERY = 12;

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [profilePic, setProfilePic] = useState(user?.profile_picture || user?.profilePic || null);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState(() => (Array.isArray(user?.gallery) ? user.gallery : []));
  const [gallerySaving, setGallerySaving] = useState(false);
  const [profileReviews, setProfileReviews] = useState([]);
  const fileInputRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('bookings')
      .select('*')
      .eq('tourist_id', user.id)
      .then(({ data }) => setBookings((data || []).map(mapBookingRow)));
  }, [user?.id]);

  useEffect(() => {
    setProfilePic(user?.profile_picture || user?.profilePic || null);
  }, [user?.profile_picture, user?.profilePic]);

  useEffect(() => {
    setGallery(Array.isArray(user?.gallery) ? user.gallery : []);
  }, [user?.gallery]);

  useEffect(() => {
    if (!isProviderUser(user) || !user?.id) return;
    supabase.from('reviews').select('rating, text, tourist_name, date, created_at').eq('provider_id', user.id).order('created_at', { ascending: false }).limit(20).then(({ data }) => setProfileReviews(data || []));
  }, [user?.id, user?.role, user?.provider_type, user?.type]);

  const handlePhotoChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !user?.id || !isProviderUser(user)) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result;
      if (!base64 || typeof base64 !== 'string') {
        setUploading(false);
        return;
      }
      const { error } = await supabase.from('users').update({ profile_picture: base64 }).eq('id', user.id);
      setUploading(false);
      if (error) return;
      setProfilePic(base64);
      setUser?.((prev) => (prev ? { ...prev, profile_picture: base64 } : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_GALLERY - gallery.length;
    if (remaining <= 0) return;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setGallery((g) => [...g, ev.target?.result].slice(0, MAX_GALLERY));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeGalleryPhoto = (idx) => setGallery((g) => g.filter((_, i) => i !== idx));

  const saveGallery = async () => {
    if (!user?.id || !isProviderUser(user)) return;
    setGallerySaving(true);
    const { error } = await supabase.from('users').update({ gallery: JSON.stringify(gallery) }).eq('id', user.id);
    setGallerySaving(false);
    if (!error) setUser?.((prev) => (prev ? { ...prev, gallery } : prev));
  };

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>{t('tour.signInToBook')}</p>
        <Link to="/login?redirect=/app/profile" style={{ color: 'var(--gold)' }}>{t('nav.signIn')}</Link>
      </div>
    );
  }

  const completed = bookings.filter((b) => b.status === 'completed').length;
  const reviewsLeft = bookings.filter((b) => b.status === 'completed' && !b.reviewed).length;

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 4 }}>{t('profile.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{t('profile.subtitle')}</p>

      <div className="glass" style={{ padding: 28, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            {profilePic ? (
              <img src={profilePic} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${user.color || 'var(--gold)'}` }} />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: user.color || 'var(--gold)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                }}
              >
                {(user.avatar || user.name || '').slice(0, 2).toUpperCase()}
              </div>
            )}
            {isProviderUser(user) && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--surface)', background: 'var(--gold)', color: 'var(--bg)', cursor: uploading ? 'wait' : 'pointer', fontSize: 14 }}>{uploading ? '…' : '📷'}</button>
              </>
            )}
          </div>
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 4 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 600 }}>{bookings.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.bookings')}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--cyan)', fontWeight: 600 }}>{completed}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.completed')}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 600 }}>{reviewsLeft}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.reviewsLeft')}</div>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 20 }}>{t('profile.memberSince')} Mar 2024</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/app/chat', { state: { openSupport: true } })}
          style={{
            display: 'block',
            width: '100%',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          💬 Message Support
        </button>
        <Link
          to="/app/bookings"
          style={{
            display: 'block',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          📅 {t('nav.bookings')}
        </Link>
        <Link
          to="/app/requests"
          style={{
            display: 'block',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          📢 {t('nav.requests')}
        </Link>
      </div>

      {isProviderUser(user) && (
        <div className="glass" style={{ padding: 28, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Gallery ({gallery.length}/{MAX_GALLERY})</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>Photos shown on your public profile.</p>
          <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryAdd} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginBottom: 12 }}>
            {gallery.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-hover)' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => removeGalleryPhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {gallery.length < MAX_GALLERY && (
              <button type="button" onClick={() => galleryRef.current?.click()} style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>+</button>
            )}
          </div>
          <button type="button" onClick={saveGallery} disabled={gallerySaving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: gallerySaving ? 'wait' : 'pointer' }}>{gallerySaving ? 'Saving…' : 'Save gallery'}</button>
        </div>
      )}

      {isProviderUser(user) && (
        <div className="glass" style={{ padding: 28, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Ratings ({profileReviews.length})</h3>
          {profileReviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet. They will appear here when tourists leave reviews after completed bookings.</p>
          ) : (
            <>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Average: {(profileReviews.reduce((s, r) => s + (r.rating || 0), 0) / profileReviews.length).toFixed(1)} ★
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profileReviews.map((r, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--surface-hover)', borderRadius: 8, borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.tourist_name || 'Guest'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : '')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gold)', marginBottom: 6 }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</div>
                    {r.text && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>{r.text}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
