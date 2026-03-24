import { useState, useEffect, useRef } from 'react';
import { supabase, compressImage } from '../supabase';
import { toServicesRow } from '../hooks/useAppData';
import AvailabilityCalendar from './AvailabilityCalendar';
import { LocationPicker, REGION_COORDS } from './MapUtils';
import { buildBadgesWithSettings, getUserSettingsFromBadges } from '../utils/providerSettings';

const MAX_PHOTOS = 4;

function normalizePhotos(photos) {
  let arr = Array.isArray(photos) ? photos.slice(0, MAX_PHOTOS) : [];
  if (arr.length && !arr.some((p) => p.isMain)) arr = arr.map((p, i) => ({ ...p, isMain: i === 0 }));
  return arr;
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '0.9rem',
};

export default function CreateTourModal({ user, initialTour, onSave, onClose }) {
  const isGuide = (user?.provider_type || user?.type) === 'guide';
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    type: isGuide ? 'guide' : 'van',
    region: 'Tbilisi',
    duration: '',
    price: '',
    pricingType: 'fixed',
    desc: '',
    emoji: '🏛️',
    maxSeats: 8,
    bookedSeats: 0,
    available: [],
    tags: [],
    photos: [],
    lat: null,
    lng: null,
  });
  const [tourUnavailableDates, setTourUnavailableDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTour) {
      const photos = Array.isArray(initialTour.photos) ? initialTour.photos : [];
      const mappedPhotos = photos.map((p) =>
        typeof p === 'object' && p != null
          ? { id: p.id || Math.random().toString(36).slice(2), base64: p.base64, isMain: !!p.isMain }
          : { id: Math.random().toString(36).slice(2), base64: p, isMain: false }
      ).slice(0, MAX_PHOTOS);
      const rawTags = Array.isArray(initialTour.tags) ? initialTour.tags : [];
      const hasAsk = (initialTour.price == null || Number(initialTour.price) <= 0) || rawTags.includes('ask');
      const pricingType = hasAsk
        ? 'ask'
        : rawTags.includes('per_person')
          ? 'per_person'
          : rawTags.includes('starting_from')
            ? 'starting_from'
            : 'fixed';
      setForm({
        name: initialTour.name || '',
        type: initialTour.type || (isGuide ? 'guide' : 'van'),
        region: initialTour.region || 'Tbilisi',
        duration: initialTour.duration || '',
        price: initialTour.price != null ? String(initialTour.price) : '',
        pricingType,
        desc: initialTour.desc || initialTour.description || '',
        emoji: initialTour.emoji || '🏛️',
        maxSeats: initialTour.maxSeats ?? initialTour.max_seats ?? 8,
        bookedSeats: initialTour.bookedSeats ?? initialTour.booked_seats ?? 0,
        available: Array.isArray(initialTour.available) ? initialTour.available : [],
        tags: Array.isArray(initialTour.tags) ? initialTour.tags : [],
        photos: mappedPhotos,
        lat: initialTour.lat ?? null,
        lng: initialTour.lng ?? null,
      });
    }
  }, [initialTour, isGuide]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('badges')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const settings = getUserSettingsFromBadges(data?.badges);
        setTourUnavailableDates(Array.isArray(settings.availability.unavailable_dates) ? settings.availability.unavailable_dates : []);
      });
  }, [user?.id]);

  const persistProviderUnavailableDates = async (nextDates) => {
    if (!user?.id) return;
    const { data: providerRow } = await supabase.from('users').select('badges').eq('id', user.id).maybeSingle();
    const settings = getUserSettingsFromBadges(providerRow?.badges);
    const nextSettings = {
      ...settings,
      availability: { ...settings.availability, unavailable_dates: nextDates },
    };
    await supabase
      .from('users')
      .update({ badges: JSON.stringify(buildBadgesWithSettings(providerRow?.badges, nextSettings)) })
      .eq('id', user.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name?.trim() || !form.type) {
      setError('Please enter a name and type.');
      return;
    }
    if (form.pricingType !== 'ask' && (form.price === '' || isNaN(Number(form.price)))) {
      setError('Please enter a valid price.');
      return;
    }
    if (!initialTour && form.photos.length === 0) {
      setError('Please add at least one photo for your tour. Tours with photos get 5x more bookings!');
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session [web:CreateTourModal]:', session ? 'ACTIVE' : 'NONE', session?.user?.id);
      if (!session) {
        setError('You are signed out. Please sign in again.');
        setSaving(false);
        return;
      }
      const photosNorm = normalizePhotos(form.photos);
      const pricingTag =
        form.pricingType === 'per_person'
          ? 'per_person'
          : form.pricingType === 'starting_from'
            ? 'starting_from'
            : form.pricingType === 'ask'
              ? 'ask'
              : 'fixed';
      const base = {
        ...form,
        price: form.pricingType === 'ask' ? -1 : Number(form.price) || 0,
        provider: user.name,
        providerId: user.id,
        area: form.region,
        rating: initialTour?.rating ?? 0,
        reviews: initialTour?.reviews ?? 0,
        total_bookings: initialTour?.total_bookings ?? 0,
        photos: photosNorm,
        tags: Array.from(new Set([pricingTag, ...(Array.isArray(form.tags) ? form.tags : [])])),
        lat: form.lat || null,
        lng: form.lng || null,
      };
      if (initialTour?.id) {
        const payload = { ...toServicesRow(base, user), updated_at: new Date().toISOString() };
        const { error: err } = await supabase.from('services').update(payload).eq('id', initialTour.id);
        if (err) {
          setError(err.message || 'Update failed');
          return;
        }
        onSave();
      } else {
        const payload = toServicesRow({ ...base, rating: 0, reviews: 0, total_bookings: 0, bookedSeats: 0 }, user);
        const { data, error: err } = await supabase.from('services').insert(payload).select('id').maybeSingle();
        if (err) {
          setError(err.message || 'Create failed');
          return;
        }
        onSave();
      }
      // best-effort: persist provider-level unavailable dates (shared across tours)
      await persistProviderUnavailableDates(tourUnavailableDates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 'var(--radius)',
          maxWidth: 440,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>{initialTour ? 'Edit Tour' : 'Create Tour'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Photo upload — prominent at top */}
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 10, border: '2px dashed var(--border)', background: 'var(--surface)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Tour photos {!initialTour && <span style={{ color: '#f43f5e' }}>*</span>}</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent, var(--gold))', marginBottom: 10, fontWeight: 500 }}>Tours with photos get 5x more bookings</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const raw = e.target.files?.[0];
                if (!raw) return;
                e.target.value = '';
                const file = await compressImage(raw, { maxWidth: 1200, maxHeight: 800, maxSizeKB: 60 });
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result;
                  if (!base64) return;
                  const next = [...form.photos, { id: Math.random().toString(36).slice(2), base64, isMain: form.photos.length === 0 }].slice(0, MAX_PHOTOS);
                  setForm((f) => ({ ...f, photos: next }));
                };
                reader.readAsDataURL(file);
              }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3].map((i) => {
                const photo = form.photos[i];
                return (
                  <div key={i} style={{ width: 100, height: 76, borderRadius: 10, border: '2px dashed var(--border)', overflow: 'hidden', position: 'relative', flexShrink: 0, background: photo ? 'var(--surface-hover)' : 'transparent' }}>
                    {photo ? (
                      <>
                        <img src={photo.base64} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10, background: 'var(--bg-secondary, #1a1a2e)', display: 'block' }} />
                        {photo.isMain && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: '0.65rem', background: 'var(--gold)', color: '#fff', padding: '2px 5px', borderRadius: 6, fontWeight: 700 }}>Main</span>}
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); const next = form.photos.filter((_, j) => j !== i); if (next.length && !next.some((p) => p.isMain)) next[0] = { ...next[0], isMain: true }; setForm((f) => ({ ...f, photos: next })); }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        <button type="button" onClick={() => setForm((f) => { const photos = [...(f.photos || [])]; if (!photos[i]) return f; const [main] = photos.splice(i, 1); return { ...f, photos: [{ ...main, isMain: true }, ...photos.map((p) => ({ ...p, isMain: false }))] }; })}
                          style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: '0.6rem', padding: '3px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: 'var(--gold)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Set main</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>+</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Tbilisi Old Town Walk"
            required
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            {isGuide ? <option value="guide">Guide</option> : <><option value="van">Van</option><option value="transfer">Transfer</option></>}
          </select>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Region</label>
          <input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="Tbilisi"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Duration (e.g. 2h, 1 day)</label>
          <input
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            placeholder="2 hours"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Pricing</label>
          <select
            value={form.pricingType}
            onChange={(e) => setForm((f) => ({ ...f, pricingType: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            <option value="fixed">Fixed price (total)</option>
            <option value="per_person">Per person</option>
            <option value="starting_from">Starting from</option>
            <option value="ask">Ask for price (negotiable)</option>
          </select>

          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Price (₾)</label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="0"
            disabled={form.pricingType === 'ask'}
            style={{ ...inputStyle, marginBottom: 12, opacity: form.pricingType === 'ask' ? 0.6 : 1, cursor: form.pricingType === 'ask' ? 'not-allowed' : 'text' }}
          />

          <div style={{ marginTop: 6, marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              My availability (shared across all tours)
            </label>
            <AvailabilityCalendar
              unavailableDates={tourUnavailableDates}
              onToggleDate={async (date) => {
                const next = tourUnavailableDates.includes(date)
                  ? tourUnavailableDates.filter((d) => d !== date)
                  : [...tourUnavailableDates, date].sort();
                setTourUnavailableDates(next);
                await persistProviderUnavailableDates(next);
              }}
            />
          </div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
          <textarea
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            rows={3}
            placeholder="Short description"
            style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }}
          />
          <LocationPicker
            value={form.lat && form.lng ? [form.lat, form.lng] : null}
            onChange={([lat, lng]) => setForm((f) => ({ ...f, lat, lng }))}
            center={REGION_COORDS[form.region] || REGION_COORDS['Tbilisi']}
          />
          {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving || (!initialTour && form.photos.length === 0)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: (saving || (!initialTour && form.photos.length === 0)) ? 'var(--text-dim)' : 'var(--gold)', color: '#fff', fontWeight: 600, cursor: saving ? 'wait' : (!initialTour && form.photos.length === 0) ? 'not-allowed' : 'pointer', opacity: (!initialTour && form.photos.length === 0) ? 0.6 : 1 }}>{saving ? 'Saving…' : initialTour ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
