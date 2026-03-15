import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';

export default function Contact() {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [tourInterest, setTourInterest] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.from('contact_inquiries').insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        tour_interest: tourInterest.trim() || null,
      });
      if (err) {
        setError(err.message || 'Failed to send');
        setLoading(false);
        return;
      }
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
      setTourInterest('');
    } catch (_) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Contact — TourBid</title>
        <meta name="description" content="Get in touch or request a custom tour in Georgia." />
      </Helmet>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.9rem', marginBottom: 8 }}>{t('contact.title')}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>We’ll get back to you as soon as we can.</p>

        {sent ? (
          <p style={{ color: 'var(--gold)', fontWeight: 500 }}>{t('contact.sent')}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{t('contact.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, marginTop: 16 }}>{t('contact.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, marginTop: 16 }}>{t('contact.message')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, marginTop: 16 }}>{t('contact.tourInterest')}</label>
            <input
              type="text"
              value={tourInterest}
              onChange={(e) => setTourInterest(e.target.value)}
              placeholder="e.g. Kazbegi van tour, wine tour"
              style={inputStyle}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.9rem', marginTop: 16 }}>{error}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Sending…' : t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '1rem',
};
const btnStyle = {
  marginTop: 24,
  padding: '14px 28px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--gold)',
  color: 'var(--bg)',
  fontWeight: 600,
  fontSize: '1rem',
};
