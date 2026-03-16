import { useEffect, useState, useCallback, useRef } from 'react';
import { Need, DayHistory } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { BottomSheet } from './components/BottomSheet';

const ABOUT_TEXT = [
  'Бывает, что день прошёл нормально — а внутри что-то не так. Или наоборот, всё объективно сложно, но ощущение живое и устойчивое.',
  'Дело почти всегда в потребностях. Когда они удовлетворены — есть устойчивость. Когда нет — появляется тревога, раздражение, пустота.',
  'Дневник помогает это увидеть. Раз в день, пять шкал — и через несколько дней паттерн становится различимым: что тебя питает, что истощает.',
  'Это не про «быть лучше». Это про понять себя.',
];

type Tab = 'today' | 'history';

const DISCLAIMER_KEY = 'disclaimer_accepted';

function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    const dy = Math.max(0, e.clientY - startY.current);
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dy = e.clientY - startY.current;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (dy > 80) onAccept();
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        animation: 'fade-in 200ms ease',
      }} />
      <div
        ref={sheetRef}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: '#161821',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          animation: 'sheet-up 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          style={{ padding: '12px 0 6px', display: 'flex', justifyContent: 'center', touchAction: 'none', cursor: 'grab' }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '8px 24px 48px', overflowY: 'auto' }}>
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36 }}>🧠</div>
          </div>

          {/* Disclaimer text */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 16,
            padding: '16px 18px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Прежде чем начать
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Хорошо, что ты здесь. Замечать свои потребности — это уже немало.
              <br /><br />
              Дневник помогает видеть паттерны и чуть лучше понимать себя. Советы внутри — это приглашение к размышлению, не инструкция.
              <br /><br />
              Если чувствуешь, что что-то важное требует внимания — терапия это место, где можно разобраться по-настоящему. Безопасно, глубоко, рядом живой человек.
            </div>
          </div>

          {/* Promo */}
          <div style={{
            background: 'rgba(167,139,250,0.08)', borderRadius: 16,
            padding: '16px 18px', marginBottom: 24,
            border: '1px solid rgba(167,139,250,0.15)',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.7)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Автор дневника
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 12 }}>
              Канал о схема-терапии, потребностях и том, как работает психика —{' '}
              <a
                href="https://t.me/SchemeHappens"
                style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}
              >
                @SchemeHappens
              </a>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              Вопросы или если хочешь поработать лично —{' '}
              <a
                href="https://t.me/kotlarewski"
                style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}
              >
                @kotlarewski
              </a>
            </div>
          </div>

          {/* Accept button */}
          <button
            onClick={onAccept}
            style={{
              width: '100%', padding: '15px 0',
              borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #a78bfa, #4fa3f7)',
              color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Понятно, начать
          </button>
        </div>
      </div>
    </>
  );
}

function formatHeaderDate(): string {
  const now = new Date();
  const dow = now.toLocaleDateString('ru-RU', { weekday: 'short' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${dow}, ${date}`;
}

export default function App() {
  const [disclaimerDone, setDisclaimerDone] = useState(
    () => !!localStorage.getItem(DISCLAIMER_KEY)
  );
  const [tab, setTab] = useState<Tab>('today');
  const [showAbout, setShowAbout] = useState(false);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.disableVerticalSwipes?.();
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
      {!disclaimerDone && (
        <Disclaimer onAccept={() => {
          localStorage.setItem(DISCLAIMER_KEY, '1');
          setDisclaimerDone(true);
        }} />
      )}
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
        <h1
          onClick={() => setShowAbout(true)}
          style={{
            fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px',
            color: '#fff', marginBottom: 3, lineHeight: 1.1,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Дневник потребностей
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

      {showAbout && (
        <BottomSheet onClose={() => setShowAbout(false)}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Зачем это всё
            </div>
            {ABOUT_TEXT.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 16 }}>
                {p}
              </p>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
