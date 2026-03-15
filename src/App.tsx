import { useEffect, useState, useCallback } from 'react';
import { Need, DayHistory } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';

type Tab = 'today' | 'history';

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: active ? 700 : 400,
  background: 'none',
  color: active ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-hint-color, #999)',
  borderBottom: active ? '2px solid var(--tg-theme-button-color, #2481cc)' : '2px solid transparent',
  transition: 'all 0.15s',
});

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--tg-theme-hint-color, #999)' }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red', fontSize: 13, wordBreak: 'break-all' }}>
        <b>Ошибка загрузки:</b><br />{error}<br /><br />
        <small>API: {import.meta.env.VITE_API_URL ?? 'не задан'}</small><br/>
        <small>initData: {window.Telegram?.WebApp?.initData ? 'есть' : 'пусто'}</small>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--tg-theme-bg-color, #fff)', minHeight: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--tg-theme-bg-color, #fff)',
        borderBottom: '1px solid rgba(128,128,128,0.15)',
      }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', padding: '14px 0 0', margin: 0, color: 'var(--tg-theme-text-color, #000)' }}>
          Дневник потребностей
        </h1>
        <div style={{ display: 'flex' }}>
          <button style={TAB_STYLE(tab === 'today')} onClick={() => setTab('today')}>Сегодня</button>
          <button style={TAB_STYLE(tab === 'history')} onClick={() => setTab('history')}>История</button>
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
