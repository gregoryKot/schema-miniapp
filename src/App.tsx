import { useEffect, useState, useCallback, useRef } from 'react';
import { Need, DayHistory, COLORS } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { BottomSheet } from './components/BottomSheet';
import { ProfileSheet } from './components/ProfileSheet';
import { Celebration } from './components/Celebration';
import { NoteSheet } from './components/NoteSheet';
import { Loader } from './components/Loader';
import { SchemaInfoSheet, SchemaInfoContent } from './components/SchemaInfoSheet';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from './components/YSQTestSheet';
import { YesterdaySheet } from './components/YesterdaySheet';
import { WeeklyQuestion, shouldShowWeeklyQuestion } from './components/WeeklyQuestion';
import { SectionLabel } from './components/SectionLabel';
import { PairCard } from './components/PairCard';
import { PairSheet } from './components/PairSheet';
import { CheckInSheet } from './components/CheckInSheet';
import { PracticesOnboarding } from './components/PracticesOnboarding';
import { ChildhoodWheelSheet, shouldShowChildhoodWheel, CHILDHOOD_DONE_KEY } from './components/ChildhoodWheelSheet';
import { PracticePlan, PairsData, StreakData } from './api';

const TODAY_KEY = 'celebrated_' + new Date().toISOString().split('T')[0];
const TODAY_DATE = new Date().toISOString().split('T')[0];
const HAS_HISTORY = Object.keys(localStorage).some(k => k.startsWith('celebrated_') && k !== TODAY_KEY);
const YESTERDAY_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
})();

const ABOUT_TEXT = [
  'Бывает, что день прошёл нормально — а внутри что-то не так. Или наоборот, всё объективно сложно, но ощущение живое и устойчивое.',
  'Дело почти всегда в потребностях. Когда они удовлетворены — есть устойчивость. Когда нет — появляется тревога, раздражение, пустота.',
  'Дневник помогает это увидеть. Раз в день, пять шкал — и через 3–5 дней паттерн начинает проявляться: что тебя питает, что истощает, что остаётся невидимым.',
  'Это не про «быть лучше». Это про понять себя.',
];

const NEEDS_EXPLAINER = [
  { emoji: '🤝', name: 'Привязанность', text: 'Ощущение связи с другими людьми. Не просто присутствие рядом — а настоящий контакт: когда тебя слышат, принимают, когда есть кому позвонить в трудный момент. Без этого — одиночество даже в толпе.' },
  { emoji: '🚀', name: 'Автономия', text: 'Ощущение, что ты сам управляешь своей жизнью. Есть выбор, есть право на своё мнение, есть пространство быть собой — не тем, кем должен быть. Без этого — ощущение ловушки.' },
  { emoji: '💬', name: 'Выражение чувств', text: 'Возможность говорить о том, что внутри — честно, без страха осуждения. Это и злость, и нежность, и уязвимость. Когда чувства некуда выразить, они уходят в тело или выплёскиваются не туда.' },
  { emoji: '🎉', name: 'Спонтанность', text: 'Лёгкость, игра, удовольствие от момента. Не всё должно быть полезным и продуктивным. Когда этой потребности долго нет — жизнь становится серой и механической, даже если всё «в порядке».' },
  { emoji: '⚖️', name: 'Границы', text: 'Ощущение, что тебя уважают: твоё время, пространство, «нет». И что ты сам можешь уважать чужие границы, не растворяясь в других. Без этого — хроническое раздражение или стирание себя.' },
];

type Tab = 'today' | 'history';

const DISCLAIMER_KEY = 'disclaimer_v2_accepted';

function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const ready = c1 && c2;

  const Checkbox = ({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
      <div
        onClick={onToggle}
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
          border: `2px solid ${checked ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
          background: checked ? '#a78bfa' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {checked && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</span>}
      </div>
      <span onClick={onToggle} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );

  return (
    <BottomSheet onClose={onAccept} zIndex={300}>
      <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
        <div style={{ fontSize: 36 }}>🧠</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Прежде чем начать
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Хорошо, что ты здесь. Замечать свои потребности — это уже немало.
          <br /><br />
          Дневник помогает видеть паттерны и чуть лучше понимать себя. Если чувствуешь, что что-то важное требует внимания — терапия это место, где можно разобраться по-настоящему.
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 18px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Данные и конфиденциальность
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>
          Все данные хранятся на защищённом сервере, привязаны к Telegram-аккаунту и не передаются третьим лицам. Удалить данные — <a href="https://t.me/kotlarewski" style={{ color: '#a78bfa', textDecoration: 'none' }}>@kotlarewski</a>.
        </div>
        <Checkbox
          checked={c2}
          onToggle={() => setC2(p => !p)}
          label="Я согласен(на) на хранение данных дневника согласно описанным условиям"
        />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 18px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Это не терапия
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>
          Приложение — инструмент самоисследования. Оценки, тесты и советы внутри не являются клинической диагностикой, медицинскими рекомендациями или заменой работы с психологом.
        </div>
        <Checkbox
          checked={c1}
          onToggle={() => setC1(p => !p)}
          label="Я понимаю, что это инструмент самоисследования, а не клиническая диагностика"
        />
      </div>

      <div style={{ background: 'rgba(167,139,250,0.08)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '1px solid rgba(167,139,250,0.15)' }}>
        <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.7)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Автор дневника
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 8 }}>
          Канал о схема-терапии —{' '}
          <a href="https://t.me/SchemeHappens" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>@SchemeHappens</a>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Записаться на сессию —{' '}
          <a href="https://t.me/kotlarewski" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>@kotlarewski</a>
        </div>
      </div>

      <button
        onClick={onAccept}
        disabled={!ready}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
          background: ready ? 'linear-gradient(135deg, #a78bfa, #4fa3f7)' : 'rgba(255,255,255,0.08)',
          color: ready ? '#fff' : 'rgba(255,255,255,0.25)',
          fontSize: 16, fontWeight: 600,
          cursor: ready ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
      >
        Понятно, начать
      </button>
    </BottomSheet>
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
    () => !!localStorage.getItem(DISCLAIMER_KEY) // quick local check while server responds
  );
  const historyDays = 30;
  const [tab, setTab] = useState<Tab>('today');
  const [showAbout, setShowAbout] = useState(false);
  const [showSchemaInfo, setShowSchemaInfo] = useState(false);
  const [schemaAutoStartTest, setSchemaAutoStartTest] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);
  const [showTodayNote, setShowTodayNote] = useState(false);
  const [showYesterdaySheet, setShowYesterdaySheet] = useState(false);
  const [backfillDate, setBackfillDate] = useState<string | null>(null);
  const [showYesterdayBanner, setShowYesterdayBanner] = useState(false);
  const [showWeeklyQ, setShowWeeklyQ] = useState(() => shouldShowWeeklyQuestion());
  const [pairData, setPairData] = useState<PairsData | null>(null);
  const [pairCardDismissed, setPairCardDismissed] = useState<boolean | null>(null);
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [pendingPlans, setPendingPlans] = useState<PracticePlan[]>([]);
  const [showPracticesOnboarding, setShowPracticesOnboarding] = useState(false);
  const [yesterdayBannerDismissed] = useState(() => !!localStorage.getItem('yesterday_banner_' + YESTERDAY_DATE));
  const [showChildhoodWheel, setShowChildhoodWheel] = useState(false);
  const [childhoodWheelPending, setChildhoodWheelPending] = useState(false);
  const [childhoodRatings, setChildhoodRatings] = useState<Record<string, number>>({});
  const YSQ_BANNER_DISMISSED_KEY = 'ysq_banner_dismissed';
  const [showYsqBanner, setShowYsqBanner] = useState(
    () => !!localStorage.getItem(YSQ_PROGRESS_KEY) && !localStorage.getItem(YSQ_RESULT_KEY) && !localStorage.getItem('ysq_banner_dismissed')
  );
  const [needs, setNeeds] = useState<Need[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.disableVerticalSwipes?.();
    if (!sessionStorage.getItem('init_done')) {
      const tzOffset = Math.round(-new Date().getTimezoneOffset() / 60);
      api.init(tzOffset).then(() => sessionStorage.setItem('init_done', '1')).catch(() => {});
    }
    Promise.all([api.needs(), api.ratings()])
      .then(([n, r]) => {
        setNeeds(n);
        setRatings(r);
        const initialSaved: Record<string, boolean> = {};
        for (const key of Object.keys(r)) initialSaved[key] = true;
        setSaved(initialSaved);
        // If all needs already rated today, mark done to prevent duplicate celebration
        if (n.length > 0 && n.every(need => r[need.id] !== undefined)) {
          localStorage.setItem(TODAY_KEY, '1');
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    api.getDisclaimer().then(({ accepted }) => {
      if (accepted) { localStorage.setItem(DISCLAIMER_KEY, '1'); setDisclaimerDone(true); }
    }).catch(() => {});
    api.getPair().then(setPairData).catch(e => console.error('getPair failed', e));
    api.getSettings().then(s => {
      setPairCardDismissed(s.pairCardDismissed);
      if (s.pairCardDismissed) localStorage.setItem('pair_card_dismissed', '1');
      else localStorage.removeItem('pair_card_dismissed');
    }).catch(() => {
      setPairCardDismissed(!!localStorage.getItem('pair_card_dismissed'));
    });
    api.getPendingPlans().then(setPendingPlans).catch(e => console.error('getPendingPlans failed', e));
    if (!yesterdayBannerDismissed && HAS_HISTORY) {
      api.ratings(YESTERDAY_DATE).then(r => {
        if (Object.keys(r).length === 0) setShowYesterdayBanner(true);
      }).catch(() => {});
    }
    api.getChildhoodRatings().then(r => {
      if (Object.keys(r).length > 0) {
        setChildhoodRatings(r);
        localStorage.setItem(CHILDHOOD_DONE_KEY, '1');
      }
    }).catch(e => console.error('getChildhoodRatings failed', e));
    Promise.all([api.getYsqProgress(), api.getYsqResult()]).then(([prog, result]) => {
      if (prog?.answers && !result?.answers) {
        localStorage.setItem(YSQ_PROGRESS_KEY, JSON.stringify({ answers: prog.answers, page: prog.page }));
        if (!localStorage.getItem(YSQ_BANNER_DISMISSED_KEY)) setShowYsqBanner(true);
      }
    }).catch(() => {});
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam?.startsWith('pair_')) {
      const code = startParam.replace('pair_', '');
      api.joinPair(code).then(() => api.getPair().then(data => {
        setPairData(data);
        localStorage.removeItem('pair_card_dismissed');
        setPairCardDismissed(false);
        api.updateSettings({ pairCardDismissed: false }).catch(() => {});
      })).catch(e => console.error('joinPair failed', e));
    }
  }, []);

  // When partner joins — clear dismissed flag so paired card shows
  useEffect(() => {
    if (pairData && pairData.partners.length > 0) {
      localStorage.removeItem('pair_card_dismissed');
      setPairCardDismissed(false);
      api.updateSettings({ pairCardDismissed: false }).catch(() => {});
    }
  }, [pairData?.partners.length]);

  useEffect(() => {
    if (tab === 'history') {
      setHistoryLoading(true);
      api.history(historyDays).then(setHistory).finally(() => setHistoryLoading(false));
    }
  }, [tab, historyDays]);

  // Telegram back button — single stable handler, reads current state via ref
  const backHandlerRef = useRef<() => void>(() => {});
  useEffect(() => {
    backHandlerRef.current =
      showSchemaInfo ? () => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); } :
      showProfile ? () => setShowProfile(false) :
      showAbout ? () => setShowAbout(false) :
      showPairSheet ? () => { setShowPairSheet(false); api.getPair().then(setPairData); } :
      showChildhoodWheel ? () => setShowChildhoodWheel(false) :
      showPracticesOnboarding ? () => setShowPracticesOnboarding(false) :
      showTodayNote ? () => setShowTodayNote(false) :
      () => {};
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const anyOpen = showSchemaInfo || showProfile || showAbout || showPairSheet || showChildhoodWheel || showPracticesOnboarding || showTodayNote;
    if (anyOpen) bb.show(); else bb.hide();
  }, [showSchemaInfo, showProfile, showAbout, showPairSheet, showChildhoodWheel, showPracticesOnboarding, showTodayNote]);

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const handler = () => backHandlerRef.current();
    bb.onClick(handler);
    return () => bb.offClick(handler);
  }, []);

  const handleChange = useCallback((needId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [needId]: value }));
    setSaved((prev) => ({ ...prev, [needId]: false }));
  }, []);

  const handleSaved = useCallback((needId: string, streak?: StreakData) => {
    setSaved((prev) => ({ ...prev, [needId]: true }));
    if (streak && !localStorage.getItem(TODAY_KEY)) {
      localStorage.setItem(TODAY_KEY, '1');
      if (streak.currentStreak > 0) { setCelebrationStreak(streak.currentStreak); }
      else { setShowTodayNote(true); }
      if (streak.totalDays >= 5 && shouldShowChildhoodWheel()) {
        setChildhoodWheelPending(true);
      }
    }
  }, []);

  if (loading) {
    return <Loader minHeight="100vh" />;
  }

  if (error) {
    return (
      <div style={{ padding: 24, fontSize: 13, wordBreak: 'break-all' }}>
        <div style={{ color: 'rgba(255,100,100,0.9)', marginBottom: 12 }}>
          <b>Ошибка загрузки:</b><br />{error}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 16 }}>
          API: {import.meta.env.VITE_API_URL ?? 'не задан'}<br />
          initData: {window.Telegram?.WebApp?.initData ? 'есть' : 'пусто'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 20px', border: 'none', borderRadius: 12, background: '#a78bfa', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)', padding: '10px 20px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#fff' }}>
          Нет подключения — данные не сохраняются
        </div>
      )}
      {!disclaimerDone && (
        <Disclaimer onAccept={() => {
          localStorage.setItem(DISCLAIMER_KEY, '1');
          api.acceptDisclaimer().catch(() => {});
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
          {/* Header icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              onClick={() => setShowSchemaInfo(true)}
              style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.25)', lineHeight: 1, padding: 2, fontSize: 18 }}
            >
              🧠
            </div>
            <div
              onClick={() => setShowProfile(true)}
              style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.35)', lineHeight: 1, padding: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title + subtitle */}
        <h1
          onClick={() => setShowAbout(true)}
          style={{
            fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px',
            color: '#fff', marginBottom: 3, lineHeight: 1.1,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          Дневник потребностей
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontWeight: 400, lineHeight: 1 }}>ⓘ</span>
          <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 6, padding: '2px 6px', fontWeight: 600, letterSpacing: '0.05em', verticalAlign: 'middle' }}>beta</span>
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
          {tab === 'today' ? 'Как ты сегодня?' : 'Твоя история потребностей'}
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

      {tab === 'today' && showYesterdayBanner && (
        <div style={{ padding: '12px 20px 0' }}>
          <div
            onClick={() => { setShowYesterdaySheet(true); setShowYesterdayBanner(false); localStorage.setItem('yesterday_banner_' + YESTERDAY_DATE, '1'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>📅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>Заполнить вчера</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Вчера не было оценок — можно добавить сейчас</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowYesterdayBanner(false); localStorage.setItem('yesterday_banner_' + YESTERDAY_DATE, '1'); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      {tab === 'today' && showYsqBanner && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⏸</span>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { localStorage.removeItem(YSQ_BANNER_DISMISSED_KEY); setShowYsqBanner(false); setSchemaAutoStartTest(true); setShowSchemaInfo(true); }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>Незаконченный тест схем</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Нажми, чтобы продолжить с места остановки</div>
            </div>
            <button
              onClick={() => { localStorage.setItem(YSQ_BANNER_DISMISSED_KEY, '1'); setShowYsqBanner(false); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      {tab === 'today' && showWeeklyQ && (
        <div style={{ padding: '16px 20px 0' }}>
          <WeeklyQuestion date={TODAY_DATE} onDismiss={() => setShowWeeklyQ(false)} />
        </div>
      )}
      {tab === 'today' && pairData !== null && (pairData.partners.length > 0 || pairData.pendingCode || (pairCardDismissed === false && HAS_HISTORY)) && (
        <div style={{ padding: '8px 20px 0' }}>
          <PairCard
            partners={pairData.partners}
            pendingCode={pairData.pendingCode}
            showInvite={pairData.partners.length === 0 && !pairData.pendingCode && pairCardDismissed === false && HAS_HISTORY}
            onOpen={() => setShowPairSheet(true)}
            onDismissInvite={() => {
              localStorage.setItem('pair_card_dismissed', '1');
              setPairCardDismissed(true);
              api.updateSettings({ pairCardDismissed: true }).catch(() => {});
            }}
          />
        </div>
      )}
      {tab === 'today' && (
        <TodayView
          needs={needs}
          ratings={ratings}
          saved={saved}
          onChange={handleChange}
          onSaved={handleSaved}
          onNote={() => setShowTodayNote(true)}
          onOpenPractices={() => setShowPracticesOnboarding(true)}
        />
      )}
      {tab === 'history' && (
        historyLoading
          ? <Loader minHeight="60vh" />
          : <HistoryView needs={needs} history={history} currentRatings={ratings} childhoodRatings={childhoodRatings} onOpenSchemas={() => setShowSchemaInfo(true)} onGoToToday={() => setTab('today')} onBackfill={(date) => setBackfillDate(date)} />
      )}

      {pendingPlans.length > 0 && needs.length > 0 && (() => {
        const plan = pendingPlans.find(p => p.scheduledDate <= TODAY_DATE);
        if (!plan) return null;
        const need = needs.find(n => n.id === plan.needId);
        if (!need) return null;
        return (
          <CheckInSheet
            plan={plan}
            needEmoji={need.emoji ?? ''}
            needLabel={need.chartLabel}
            color={COLORS[need.id] ?? '#888'}
            onDone={() => setPendingPlans(prev => prev.filter(p => p.id !== plan.id))}
          />
        );
      })()}

      {celebrationStreak !== null && (
        <Celebration streak={celebrationStreak} onDone={() => { setCelebrationStreak(null); setShowTodayNote(true); }} />
      )}

      {showTodayNote && (
        <NoteSheet date={TODAY_DATE} onClose={() => {
          setShowTodayNote(false);
          if (childhoodWheelPending) {
            setChildhoodWheelPending(false);
            setShowChildhoodWheel(true);
          }
        }} />
      )}

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} onOpenSchemas={() => { setShowProfile(false); setShowSchemaInfo(true); }} onChildhoodSaved={setChildhoodRatings} childhoodRatings={childhoodRatings} />}

      {showPracticesOnboarding && needs.length > 0 && (
        <PracticesOnboarding needs={needs} onDone={() => {
          setShowPracticesOnboarding(false);
          if (childhoodWheelPending) { setChildhoodWheelPending(false); setShowChildhoodWheel(true); }
        }} />
      )}

      {showChildhoodWheel && (
        <ChildhoodWheelSheet
          onClose={() => setShowChildhoodWheel(false)}
          onOpenSchemas={() => { setShowChildhoodWheel(false); setShowSchemaInfo(true); }}
          onSaved={(r) => setChildhoodRatings(r)}
        />
      )}

      {showPairSheet && <PairSheet onClose={() => { setShowPairSheet(false); api.getPair().then(setPairData); }} />}

      {showAbout && (
        <BottomSheet onClose={() => setShowAbout(false)}>
          <div style={{ paddingTop: 8 }}>
            <SectionLabel purple mb={16}>Зачем это всё</SectionLabel>
            {ABOUT_TEXT.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 16 }}>
                {p}
              </p>
            ))}

            <SectionLabel mb={12}>Пять потребностей</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {NEEDS_EXPLAINER.map(n => (
                <div key={n.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{n.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{n.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{n.text}</p>
                </div>
              ))}
            </div>

            <div
              onClick={() => { setShowAbout(false); setShowSchemaInfo(true); }}
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 14, padding: '14px 16px',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>Схема-терапия</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Схемы, режимы, потребности</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </BottomSheet>
      )}

      {showSchemaInfo && <SchemaInfoSheet onClose={() => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); }} ratings={ratings} autoStartTest={schemaAutoStartTest} />}

      {showYesterdaySheet && (
        <YesterdaySheet needs={needs} date={YESTERDAY_DATE} onClose={() => {
          setShowYesterdaySheet(false);
          if (tab === 'history') {
            setHistoryLoading(true);
            api.history(historyDays).then(setHistory).finally(() => setHistoryLoading(false));
          }
        }} />
      )}
      {backfillDate && (
        <YesterdaySheet needs={needs} date={backfillDate} onClose={() => {
          setBackfillDate(null);
          setHistoryLoading(true);
          api.history(historyDays).then(setHistory).finally(() => setHistoryLoading(false));
        }} />
      )}
    </div>
  );
}
