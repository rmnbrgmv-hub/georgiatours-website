import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

export default function Map() {
  const { t } = useLocale();

  return (
    <div className="map-page" style={{ padding: '24px 0 80px' }}>
      <div className="map-page-header" style={{ padding: '0 24px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('map.title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('map.subtitle')}</p>
      </div>
      <div className="map-container" style={{ height: 520, minHeight: 320, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', margin: '0 24px' }}>
        {typeof window !== 'undefined' && (
          <MapContainer
            center={GEORGIA_CENTER}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            minZoom={5}
          >
            <SetBounds bounds={GEORGIA_BOUNDS} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
