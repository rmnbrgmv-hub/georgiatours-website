import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: t.type === 'error' ? 'rgba(224,92,92,.95)' : t.type === 'success' ? 'rgba(76,175,80,.95)' : 'var(--bg-elevated)',
                color: t.type === 'error' || t.type === 'success' ? '#fff' : 'var(--text)',
                border: `1px solid ${t.type === 'error' ? 'rgba(224,92,92,.5)' : t.type === 'success' ? 'rgba(76,175,80,.5)' : 'var(--border)'}`,
                boxShadow: '0 8px 24px rgba(0,0,0,.25)',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                pointerEvents: 'auto',
                animation: 'toastIn 0.3s ease',
                maxWidth: 400,
                textAlign: 'center',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}
