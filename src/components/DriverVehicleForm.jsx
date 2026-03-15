import { useState } from 'react';

const VEHICLE_DATA = {
  'Mercedes-Benz': { 'Sprinter 311 CDI': 4, 'Sprinter 315 CDI': 8, 'Sprinter 319 CDI': 9, 'Sprinter 416 CDI': 12, 'Sprinter 516 CDI': 16, 'Vito 114 CDI': 6, 'Vito 119 CDI': 8, 'V-Class 220d': 7, 'V-Class 250d': 8, 'E-Class Sedan': 3, 'S-Class Sedan': 3, 'GLS 450': 6 },
  'Toyota': { 'HiAce Standard': 12, 'HiAce Grand Cabin': 14, 'HiAce Commuter': 15, 'Land Cruiser 200': 7, 'Land Cruiser Prado': 6, 'Land Cruiser 300': 7, 'Alphard': 7, 'Vellfire': 7, 'Innova': 7, 'Camry': 4, 'Corolla': 4 },
  'Volkswagen': { 'Transporter T6 Kombi': 8, 'Transporter T6.1': 9, 'Multivan T6': 7, 'Caravelle T6': 9, 'Crafter 30': 12, 'Crafter 35': 16, 'Touareg': 5, 'Tiguan Allspace': 6 },
  'Ford': { 'Transit Custom Kombi': 8, 'Transit 350 Minibus': 12, 'Transit 460 Minibus': 17, 'Tourneo Custom': 8, 'Tourneo Connect': 5, 'Galaxy': 6 },
  'Hyundai': { 'H-1 Wagon': 12, 'H350 Minibus': 17, 'Staria': 9, 'Staria Lounge': 7, 'Starex': 12, 'Santa Fe': 6, 'Palisade': 7 },
  'Kia': { 'Carnival': 8, 'Carnival Limousine': 7, 'Sedona': 7, 'Sorento': 6, 'Telluride': 7 },
  'Mitsubishi': { 'Delica D5': 8, 'L300 Minibus': 12, 'Outlander': 5, 'Pajero': 5 },
  'Nissan': { 'NV350 Caravan': 12, 'Elgrand': 8, 'Serena': 7, 'Patrol': 6 },
  'Renault': { 'Trafic Combi': 9, 'Master Minibus': 16, 'Espace': 6 },
  'Peugeot': { 'Boxer Minibus': 16, 'Traveller': 8, 'Rifter': 5 },
  'Opel/Vauxhall': { 'Vivaro Combi': 8, 'Movano Minibus': 16, 'Zafira Life': 7 },
  'Citroën': { 'SpaceTourer': 8, 'Berlingo Multispace': 5, 'Jumpy Combi': 8 },
  'Iveco': { 'Daily Minibus 16': 16, 'Daily Minibus 20': 20, 'Daily Minibus 22': 22 },
  'Fiat': { 'Ducato Minibus': 16, 'Scudo Combi': 8, 'Ulysse': 7 },
  'BMW': { 'X7': 6, '7 Series Sedan': 3, '5 Series Sedan': 4 },
  'Audi': { 'Q7': 6, 'Q8': 5, 'A8 Sedan': 3 },
  'Lexus': { 'LX 600': 7, 'GX 460': 6, 'ES 350 Sedan': 4 },
  'GAZ (Russian/Georgian)': { 'Gazelle Next Minibus': 12, 'Gazelle 3221': 12 },
  PAZ: { 'PAZ-320530 Minibus': 20, 'PAZ-320535': 25 },
};

const ALL_MAKES = Object.keys(VEHICLE_DATA).sort();

const labelStyle = { fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' };
const selectStyle = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%237a7e8a\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 };
const inputStyle = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' };

export default function DriverVehicleForm({ onComplete, onBack }) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() - 2);
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');

  const models = make ? Object.keys(VEHICLE_DATA[make] || {}).sort() : [];
  const seats = make && model && VEHICLE_DATA[make] ? VEHICLE_DATA[make][model] : null;
  const valid = make && model && plate.trim() && color.trim();

  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🚐</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)' }}>Your Vehicle</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>This sets your max passenger capacity</div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Vehicle Make *</label>
        <select value={make} onChange={(e) => { setMake(e.target.value); setModel(''); }} style={selectStyle}>
          <option value="">Select manufacturer…</option>
          {ALL_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Model *</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!make} style={{ ...selectStyle, opacity: make ? 1 : 0.6 }}>
          <option value="">{make ? 'Select model…' : 'Choose make first'}</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {seats != null && (
        <div style={{ background: 'var(--gold-soft)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1 }}>{seats}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Max Seats</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 3 }}>{make} {model}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Year *</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Color *</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Black, Silver" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={labelStyle}>License Plate *</label>
        <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="e.g. GE-ABC-123" style={{ ...inputStyle, letterSpacing: '0.12em', fontWeight: 600 }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>← Back</button>
        <button type="button" onClick={() => onComplete({ vehicleMake: make, vehicleModel: model, vehicleYear: year, vehicleColor: color, vehiclePlate: plate, maxSeats: seats })} disabled={!valid} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: valid ? 'var(--gold)' : 'var(--border)', color: valid ? 'var(--bg)' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed' }}>Continue →</button>
      </div>
    </div>
  );
}
