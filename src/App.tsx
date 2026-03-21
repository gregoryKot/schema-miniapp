import { useEffect, useState, useCallback } from 'react';
import { Need, DayHistory, COLORS } from './types';
import { api } from './api';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { BottomSheet } from './components/BottomSheet';
import { ProfileSheet } from './components/ProfileSheet';
import { Celebration } from './components/Celebration';
import { NoteSheet } from './components/NoteSheet';
import { Loader } from './components/Loader';
import { SchemaInfoSheet } from './components/SchemaInfoSheet';
import { TagPicker } from './components/TagPicker';
import { WeeklyQuestion, shouldShowWeeklyQuestion } from './components/WeeklyQuestion';
import { SectionLabel } from './components/SectionLabel';
import { PairCard } from './components/PairCard';
import { PairSheet } from './components/PairSheet';
import { CheckInSheet } from './components/CheckInSheet';
import { PracticesOnboarding, shouldShowPracticesOnboarding } from './components/PracticesOnboarding';
import { ChildhoodWheelSheet, shouldShowChildhoodWheel, CHILDHOOD_DONE_KEY } from './components/ChildhoodWheelSheet';
import { PracticePlan } from './api';

const TODAY_KEY = 'celebrated_' + new Date().toISOString().split('T')[0];
const TODAY_DATE = new Date().toISOString().split('T')[0];

const ABOUT_TEXT = [
  'Бывает, что день прошёл нормально — а внутри что-то не так. Или наоборот, всё объективно сложно, но ощущение живое и устойчивое.',
  'Дело почти всегда в потребностях. Когда они удовлетворены — есть устойчивость. Когда нет — появляется тревога, раздражение, пустота.',
  'Дневник помогает это увидеть. Раз в день, пять шкал — и через 3–5 дней паттерн начинает проявляться: что тебя питает, что истощает, что остаётся невидимым.',
  'Это не про «быть лучше». Это про понять себя.',
];

type Tab = 'today' | 'history';

const DISCLAIMER_KEY = 'disclaimer_accepted';

function Disclaimer({ onAccept }: { onAccept: () => void }) {
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
          Дневник помогает видеть паттерны и чуть лучше понимать себя. Советы внутри — это приглашение к размышлению, не инструкция.
          <br /><br />
          Если чувствуешь, что что-то важное требует внимания — терапия это место, где можно разобраться по-настоящему. Безопасно, глубоко, рядом живой человек.
        </div>
      </div>
      <div style={{ background: 'rgba(167,139,250,0.08)', borderRadius: 16, padding: '16px 18px', marginBottom: 24, border: '1px solid rgba(167,139,250,0.15)' }}>
        <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.7)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Автор дневника
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 12 }}>
          Канал о схема-терапии, потребностях и том, как работает психика —{' '}
          <a href="https://t.me/SchemeHappens" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>@SchemeHappens</a>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Вопросы или если хочешь поработать лично —{' '}
          <a href="https://t.me/kotlarewski" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>@kotlarewski</a>
        </div>
      </div>
      <button
        onClick={onAccept}
        style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #4fa3f7)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
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
    () => !!localStorage.getItem(DISCLAIMER_KEY)
  );
  const [tab, setTab] = useState<Tab>('today');
  const [showAbout, setShowAbout] = useState(false);
  const [showSchemaInfo, setShowSchemaInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);
  const [showTodayNote, setShowTodayNote] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showWeeklyQ, setShowWeeklyQ] = useState(() => shouldShowWeeklyQuestion());
  const [pairData, setPairData] = useState<{ paired: boolean; partnerIndex: number | null; partnerTodayDone: boolean; code: string | null } | null>(null);
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [pendingPlans, setPendingPlans] = useState<PracticePlan[]>([]);
  const [showPracticesOnboarding, setShowPracticesOnboarding] = useState(false);
  const [practicesOnboardingPending, setPracticesOnboardingPending] = useState(false);
  const [showChildhoodWheel, setShowChildhoodWheel] = useState(false);
  const [childhoodWheelPending, setChildhoodWheelPending] = useState(false);
  const [childhoodRatings, setChildhoodRatings] = useState<Partial<Record<string, number>>>({});
  const [needs, setNeeds] = useState<Need[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.disableVerticalSwipes?.();
    Promise.all([api.needs(), api.ratings()])
      .then(([n, r]) => {
        setNeeds(n);
        setRatings(r);
        // Mark server-loaded ratings as already saved → lock sliders on open
        const initialSaved: Record<string, boolean> = {};
        for (const key of Object.keys(r)) initialSaved[key] = true;
        setSaved(initialSaved);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    api.getPair().then(setPairData).catch(() => {});
    api.getPendingPlans().then(setPendingPlans).catch(() => {});
    if (localStorage.getItem(CHILDHOOD_DONE_KEY)) {
      api.getChildhoodRatings().then(setChildhoodRatings).catch(() => {});
    }
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam?.startsWith('pair_')) {
      const code = startParam.replace('pair_', '');
      api.joinPair(code).then(() => api.getPair().then(setPairData)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') {
      setHistoryLoading(true);
      api.history(7).then(setHistory).finally(() => setHistoryLoading(false));
    }
  }, [tab]);

  const handleChange = useCallback((needId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [needId]: value }));
    setSaved((prev) => ({ ...prev, [needId]: false }));
  }, []);

  const handleSaved = useCallback((needId: string) => {
    setSaved((prev) => ({ ...prev, [needId]: true }));
    if (!localStorage.getItem(TODAY_KEY)) {
      const allDone = needs.every(n => n.id === needId || ratings[n.id] !== undefined);
      if (allDone) {
        localStorage.setItem(TODAY_KEY, '1');
        api.getStreak().then(s => {
          if (s.currentStreak > 0) { setCelebrationStreak(s.currentStreak); }
          else { setShowTagPicker(true); }
          if (s.totalDays >= 5 && shouldShowChildhoodWheel()) {
            setChildhoodWheelPending(true);
          }
        });
        if (shouldShowPracticesOnboarding()) {
          setPracticesOnboardingPending(true);
        }
      }
    }
  }, [needs, ratings]);

  if (loading) {
    return <Loader minHeight="100vh" />;
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
          {/* Profile icon */}
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

      {tab === 'today' && showWeeklyQ && (
        <div style={{ padding: '16px 20px 0' }}>
          <WeeklyQuestion date={TODAY_DATE} onDismiss={() => setShowWeeklyQ(false)} />
        </div>
      )}
      {tab === 'today' && pairData !== null && (
        <div style={{ padding: '8px 20px 0' }}>
          <PairCard
            partnerIndex={pairData.partnerIndex}
            partnerTodayDone={pairData.partnerTodayDone}
            showInvite={!pairData.paired}
            onInvite={() => setShowPairSheet(true)}
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
        />
      )}
      {tab === 'history' && (
        historyLoading
          ? <Loader minHeight="60vh" />
          : <HistoryView needs={needs} history={history} currentRatings={ratings} childhoodRatings={childhoodRatings} />
      )}

      {pendingPlans.length > 0 && needs.length > 0 && (() => {
        const plan = pendingPlans[0];
        const need = needs.find(n => n.id === plan.needId);
        if (!need) return null;
        return (
          <CheckInSheet
            plan={plan}
            needEmoji={need.emoji ?? ''}
            needLabel={need.chartLabel}
            color={COLORS[need.id] ?? '#888'}
            onDone={() => setPendingPlans(prev => prev.slice(1))}
          />
        );
      })()}

      {celebrationStreak !== null && (
        <Celebration streak={celebrationStreak} onDone={() => { setCelebrationStreak(null); setShowTagPicker(true); }} />
      )}

      {showTagPicker && (
        <TagPicker
          onDone={async (tags) => {
            setShowTagPicker(false);
            if (tags.length > 0) {
              const note = await api.getNote(TODAY_DATE);
              await api.saveNote(TODAY_DATE, note.text ?? '', tags);
            }
            setShowTodayNote(true);
          }}
          onSkip={() => { setShowTagPicker(false); setShowTodayNote(true); }}
        />
      )}

      {showTodayNote && (
        <NoteSheet date={TODAY_DATE} onClose={() => {
          setShowTodayNote(false);
          if (practicesOnboardingPending) {
            setPracticesOnboardingPending(false);
            setShowPracticesOnboarding(true);
          } else if (childhoodWheelPending) {
            setChildhoodWheelPending(false);
            setShowChildhoodWheel(true);
          }
        }} />
      )}

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} onOpenSchemas={() => { setShowProfile(false); setShowSchemaInfo(true); }} onChildhoodSaved={setChildhoodRatings} />}

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

      {showSchemaInfo && <SchemaInfoSheet onClose={() => setShowSchemaInfo(false)} />}
    </div>
  );
}
