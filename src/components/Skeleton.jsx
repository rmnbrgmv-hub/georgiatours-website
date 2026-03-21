/**
 * Loading skeleton components — used in place of "Loading…" text.
 */

export function SkeletonBlock({ width = '100%', height = 16, radius = 8, style }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'var(--surface, rgba(255,255,255,0.03))',
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ borderRadius: 'var(--radius, 16px)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <SkeletonBlock height={180} radius={0} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonBlock width="70%" height={18} />
        <SkeletonBlock width="50%" height={14} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonBlock width={60} height={14} />
          <SkeletonBlock width={40} height={14} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <style>{`@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius, 16px)', border: '1px solid var(--border)' }}>
          <SkeletonBlock width={40} height={40} radius={20} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBlock width="40%" height={14} />
            <SkeletonBlock width="60%" height={12} />
          </div>
        </div>
      ))}
      <style>{`@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}
