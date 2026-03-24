import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue
if (typeof L !== 'undefined' && L.Icon) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export const GEORGIA_CENTER = [42.3154, 43.3569];

export const REGION_COORDS = {
  'Tbilisi': [41.7151, 44.8271],
  'Kazbegi': [42.6600, 44.5800],
  'Kakheti': [41.6458, 45.6906],
  'Svaneti': [43.0042, 42.6968],
  'Batumi': [41.6168, 41.6367],
  'Kutaisi': [42.2679, 42.6946],
  'Borjomi': [41.8428, 43.5292],
  'Mtskheta': [41.8447, 44.7188],
  'Gori': [41.9816, 44.1097],
  'South Georgia': [41.5500, 43.5000],
};

export function getTourCoords(tour) {
  if (tour.lat && tour.lng) return [tour.lat, tour.lng];
  if (tour.region && REGION_COORDS[tour.region]) return REGION_COORDS[tour.region];
  return REGION_COORDS['Tbilisi'];
}

export function getMarkerIcon(type) {
  const colors = { guide: '#0D9373', van: '#C9A84C', transfer: '#E07A5F' };
  const color = colors[type] || '#0D9373';
  const emoji = type === 'guide' ? '🗺' : type === 'van' ? '🚐' : '✈';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export function TourMapPopup({ tour }) {
  const photos = Array.isArray(tour.photos) ? tour.photos : [];
  const mainPhoto = photos.find((p) => p && p.isMain);
  const photoSrc = mainPhoto ? (mainPhoto.base64 || mainPhoto.url || mainPhoto) : (photos[0]?.base64 || photos[0]?.url || photos[0]);
  return (
    <div style={{ width: 220, fontFamily: 'var(--font-body, sans-serif)' }}>
      {photoSrc && (
        <img src={photoSrc} alt={tour.name}
          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px 8px 0 0', margin: '-14px -14px 8px' }} />
      )}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{tour.name}</div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        {tour.region}{tour.duration ? ' · ' + tour.duration : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          {(Number(tour.price) || 0) > 0 ? '₾' + tour.price : 'Ask for price'}
        </span>
        {(Number(tour.rating) || 0) > 0 && (
          <span style={{ fontSize: 12 }}>⭐ {tour.rating}</span>
        )}
      </div>
    </div>
  );
}

export function LocationPicker({ value, onChange, center }) {
  function MapClickHandler() {
    useMapEvents({
      click(e) { onChange([e.latlng.lat, e.latlng.lng]); },
    });
    return null;
  }

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>
        Meeting point (click map to set)
      </label>
      <div style={{ height: 250, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={center || [41.7151, 44.8271]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          <MapClickHandler />
          {value && (
            <Marker position={value} icon={getMarkerIcon('guide')}>
              <Popup>Meeting point</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {value && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
          📍 {value[0].toFixed(4)}, {value[1].toFixed(4)}
        </p>
      )}
    </div>
  );
}

export function TransferRouteMap({ pickup, dropoff }) {
  return (
    <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={pickup || [41.7151, 44.8271]} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        {pickup && (
          <Marker position={pickup}>
            <Popup>Pickup point</Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={dropoff}>
            <Popup>Drop-off point</Popup>
          </Marker>
        )}
        {pickup && dropoff && (
          <Polyline positions={[pickup, dropoff]} color="#E07A5F" weight={3} dashArray="10" />
        )}
      </MapContainer>
    </div>
  );
}

export { MapContainer, TileLayer, Marker, Popup, Polyline };
