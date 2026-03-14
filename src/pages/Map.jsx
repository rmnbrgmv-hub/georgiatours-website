import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

if (typeof L !== 'undefined' && L.Icon) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';

const GEORGIA_CENTER = [42.3, 43.4];
const GEORGIA_BOUNDS = [[41.0, 40.0], [43.6, 46.8]];

const regionCoords = {
  Tbilisi: [41.7151, 44.8271],
  Mtskheta: [41.8458, 44.7207],
  Kazbegi: [42.6538, 44.6433],
  Stepantsminda: [42.6538, 44.6433],
  Gudauri: [42.4784, 44.4689],
  Borjomi: [41.8394, 43.4066],
  Batumi: [41.6168, 41.6367],
  Kutaisi: [42.2670, 42.6959],
  Mestia: [43.0452, 42.7288],
  Uplistsikhe: [41.9675, 44.2072],
  'David Gareji': [41.4425, 45.3739],
  Kakheti: [41.9167, 45.4833],
  Svaneti: [43.0452, 42.7288],
  'Tbilisi Region': [41.7151, 44.8271],
};

function SetBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && map) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
  }, [map, bounds]);
  return null;
}

function photoUrl(p) {
  if (!p) return '';
  if (typeof p === 'string') return p;
  return p.url ?? p.base64 ?? '';
}

export default function Map() {
  const { t } = useLocale();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('services')
      .select('id, name, region, area, photos')
      .eq('suspended', false)
      .then(({ data }) => {
        const withCoords = (data || []).map((row) => {
          const region = row.region || row.area || 'Tbilisi';
          const coords = regionCoords[region] || regionCoords[region.split(/[\s,]/)[0]] || GEORGIA_CENTER;
          let photos = [];
          try {
            if (row.photos) photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos;
          } catch (_) {}
          return {
            id: row.id,
            name: row.name,
            region,
            lat: coords[0],
            lng: coords[1],
            photo: photoUrl(photos?.[0]),
          };
        });
        setTours(withCoords);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '24px 0 80px' }}>
      <div style={{ padding: '0 24px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('map.title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('map.subtitle')}</p>
      </div>
      <div style={{ height: 480, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', margin: '0 24px' }}>
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
            {tours.map((tour) => (
              <Marker key={tour.id} position={[tour.lat, tour.lng]}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    {tour.photo && <img src={tour.photo} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                    <strong style={{ display: 'block', marginBottom: 4 }}>{tour.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{tour.region}</span>
                    <br />
                    <Link to={`/tour/${tour.id}`} style={{ fontSize: '0.9rem', color: 'var(--gold)', marginTop: 8, display: 'inline-block' }}>View tour →</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        {loading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--text-muted)' }}>Loading map…</div>
        )}
      </div>
    </div>
  );
}
