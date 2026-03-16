import { useEffect, useState, useCallback } from 'react';
import { Need, DayHistory } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';

type Tab = 'today' | 'history';

function formatHeaderDate(): string {
  const now = new Date();
  const dow = now.toLocaleDateString('ru-RU', { weekday: 'short' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${dow}, ${date}`;
}

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
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', color: 'rgba(255,255,255,0.3)', fontSize: 15,
      }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, fontSize: 13, wordBreak: 'break-all' }}>
        <div style={{ color: 'rgba(255,100,100,0.9)', marginBottom: 12 }}>
          <b>Ошибка загрузки:</b><br />{error}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          API: {import.meta.env.VITE_API_URL ?? 'не задан'}<br />
          initData: {window.Telegram?.WebApp?.initData ? 'есть' : 'пусто'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(15,17,23,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '16px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            {formatHeaderDate()}
          </span>
          {/* Conic-gradient dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'conic-gradient(#ff6b9d, #ffd166, #06d6a0, #a78bfa, #4fa3f7, #ff6b9d)',
          }} />
        </div>

        {/* Title + subtitle */}
        <h1 style={{
          fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px',
          color: '#fff', marginBottom: 3, lineHeight: 1.1,
        }}>
          Дневник
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
          Как ты сегодня?
        </p>

        {/* Pill tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 3,
        }}>
          {(['today', 'history'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  borderRadius: 10,
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
        <HistoryView needs={needs} history={history} currentRatings={ratings} />
      )}
    </div>
  );
}
