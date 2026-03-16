import { useEffect, useState, useCallback } from 'react';
import { Need, DayHistory } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';

type Tab = 'today' | 'history';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [needs, setNeeds] = useState<Need[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();

    Promise.all([api.needs(), api.ratings()])
      .then(([n, r]) => { setNeeds(n); setRatings(r); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'history' && history.length === 0) {
      api.history(7).then(setHistory);
    }
  }, [tab, history.length]);

  const handleChange = useCallback((needId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [needId]: value }));
    setSaved((prev) => ({ ...prev, [needId]: false }));
  }, []);

  const handleSaved = useCallback((needId: string) => {
    setSaved((prev) => ({ ...prev, [needId]: true }));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'rgba(255,255,255,0.35)',
        fontSize: 15,
      }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'rgba(255,80,80,0.9)', fontSize: 13, wordBreak: 'break-all' }}>
        <b>Ошибка загрузки:</b><br />{error}<br /><br />
        <small style={{ color: 'rgba(255,255,255,0.4)' }}>API: {import.meta.env.VITE_API_URL ?? 'не задан'}</small><br />
        <small style={{ color: 'rgba(255,255,255,0.4)' }}>initData: {window.Telegram?.WebApp?.initData ? 'есть' : 'пусто'}</small>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(11,18,32,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 20px 12px',
      }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: -0.5,
          marginBottom: 12,
        }}>
          Дневник потребностей
        </h1>

        {/* Segmented control */}
        <div style={{
          display: 'flex',
          background: '#1F2733',
          borderRadius: 10,
          padding: 3,
          height: 36,
        }}>
          {(['today', 'history'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  background: active ? '#2C3A4D' : 'transparent',
                  transition: 'all 0.15s ease',
                  letterSpacing: -0.1,
                }}
              >
                {t === 'today' ? 'Сегодня' : 'История'}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'today' && (
        <TodayView
          needs={needs}
          ratings={ratings}
          saved={saved}
          onChange={handleChange}
          onSaved={handleSaved}
        />
      )}
      {tab === 'history' && (
        <HistoryView needs={needs} history={history} />
      )}
    </div>
  );
}
