import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { stories } from '../data/stories';

export default function Story() {
  const { slug } = useParams();
  const story = stories.find((s) => s.slug === slug);

  if (!story) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p>Story not found.</p>
        <Link to="/stories">← Back to Stories</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{story.title} — GeorgiaTours</title>
        <meta name="description" content={story.excerpt} />
      </Helmet>
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link to="/stories" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, display: 'inline-block' }}>← Stories</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.9rem', marginBottom: 16 }}>{story.title}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{story.excerpt}</p>
        <div style={{ color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{story.content}</div>
      </article>
    </>
  );
}
