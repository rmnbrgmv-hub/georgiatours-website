import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocale } from '../context/LocaleContext';

if (typeof L !== 'undefined' && L.Icon) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const GEORGIA_CENTER = [42.3, 43.4];
const GEORGIA_BOUNDS = [[41.0, 40.0], [43.6, 46.8]];

function SetBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && map) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
  }, [map, bounds]);
  return null;
}

const THUMB_SIZE = 44;
const GLOW = '0 0 12px rgba(201, 168, 76, 0.6), 0 0 24px rgba(201, 168, 76, 0.35)';

function createPhotoIcon(src) {
  return L.divIcon({
    className: 'geo-photo-pin',
    html: `<div style="
      width:${THUMB_SIZE}px;height:${THUMB_SIZE}px;
      border-radius:50%;overflow:hidden;
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:${GLOW};
      background:var(--bg-elevated, #1a1a1a);
    "><img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>`,
    iconSize: [THUMB_SIZE, THUMB_SIZE],
    iconAnchor: [THUMB_SIZE / 2, THUMB_SIZE / 2],
  });
}

export default function Map() {
  const { t } = useLocale();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popout, setPopout] = useState(null);
  const popoutRef = useRef(null);

  useEffect(() => {
    fetch('/geoimages/geo.json')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setPhotos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '24px 0 80px' }}>
      <div style={{ padding: '0 24px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('map.title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('map.subtitle')} Tap or hover a pin to view the photo.</p>
      </div>
      <div style={{ height: 520, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', margin: '0 24px', position: 'relative' }}>
        {typeof window !== 'undefined' && (
          <MapContainer
            center={GEORGIA_CENTER}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <SetBounds bounds={GEORGIA_BOUNDS} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {photos.map((p, i) => (
              <Marker
                key={i}
                position={[p.lat, p.lng]}
                icon={createPhotoIcon(p.src)}
                eventHandlers={{
                  click: () => setPopout(p),
                }}
              />
            ))}
          </MapContainer>
        )}

        {/* Temporary popout frame (Apple Watch style) – shown on tap/hover for touch devices or when popup isn't used */}
        {popout && (
          <div
            ref={popoutRef}
            role="dialog"
            aria-label="Photo"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              width: 'min(90vw, 320px)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border)',
              background: 'var(--surface)',
              animation: 'geoPopout 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={popout.src} alt="" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{popout.title}</div>
            </div>
            <button
              type="button"
              onClick={() => setPopout(null)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        )}
        {popout && (
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
            onClick={() => setPopout(null)}
            aria-hidden
          />
        )}

        {loading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--text-muted)', zIndex: 10 }}>Loading map…</div>
        )}
      </div>

      <style>{`
        .geo-photo-pin { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,.35); }
        .leaflet-popup-tip { box-shadow: 0 2px 8px rgba(0,0,0,.2); }
        @keyframes geoPopout {
          from { opacity: 0; transform: translate(-50%,-50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
