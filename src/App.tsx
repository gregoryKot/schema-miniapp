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
import { SchemaInfoSheet, SchemaInfoContent } from './components/SchemaInfoSheet';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from './components/YSQTestSheet';
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
  const [historyDays, setHistoryDays] = useState(7);
  const [tab, setTab] = useState<Tab>('today');
  const [showAbout, setShowAbout] = useState(false);
  const [showSchemaInfo, setShowSchemaInfo] = useState(false);
  const [schemaAutoStartTest, setSchemaAutoStartTest] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);
  const [showTodayNote, setShowTodayNote] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showWeeklyQ, setShowWeeklyQ] = useState(() => shouldShowWeeklyQuestion());
  const [pairData, setPairData] = useState<{ paired: boolean; partnerIndex: number | null; partnerTodayDone: boolean; code: string | null; partnerName: string | null } | null>(null);
  const [pairCardDismissed, setPairCardDismissed] = useState(() => !!localStorage.getItem('pair_card_dismissed'));
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [pendingPlans, setPendingPlans] = useState<PracticePlan[]>([]);
  const [showPracticesOnboarding, setShowPracticesOnboarding] = useState(false);
  const [practicesOnboardingPending, setPracticesOnboardingPending] = useState(false);
  const [showChildhoodWheel, setShowChildhoodWheel] = useState(false);
  const [childhoodWheelPending, setChildhoodWheelPending] = useState(false);
  const [childhoodRatings, setChildhoodRatings] = useState<Partial<Record<string, number>>>({});
  const [showYsqBanner, setShowYsqBanner] = useState(
    () => !!localStorage.getItem(YSQ_PROGRESS_KEY) && !localStorage.getItem(YSQ_RESULT_KEY)
  );
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
    api.init().catch(() => {});
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
    api.getPendingPlans().then(setPendingPlans).catch(e => console.error('getPendingPlans failed', e));
    api.getChildhoodRatings().then(r => { if (Object.keys(r).length > 0) setChildhoodRatings(r); }).catch(e => console.error('getChildhoodRatings failed', e));
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam?.startsWith('pair_')) {
      const code = startParam.replace('pair_', '');
      api.joinPair(code).then(() => api.getPair().then(data => {
        setPairData(data);
        localStorage.removeItem('pair_card_dismissed');
        setPairCardDismissed(false);
      })).catch(e => console.error('joinPair failed', e));
    }
  }, []);

  // When partner joins — clear dismissed flag so paired card shows
  useEffect(() => {
    if (pairData?.paired) {
      localStorage.removeItem('pair_card_dismissed');
      setPairCardDismissed(false);
    }
  }, [pairData?.paired]);

  useEffect(() => {
    if (tab === 'history') {
      setHistoryLoading(true);
      api.history(historyDays).then(setHistory).finally(() => setHistoryLoading(false));
    }
  }, [tab, historyDays]);

  // Telegram back button — close topmost open sheet
  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const closer =
      showSchemaInfo ? () => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); } :
      showProfile ? () => setShowProfile(false) :
      showAbout ? () => setShowAbout(false) :
      showPairSheet ? () => { setShowPairSheet(false); api.getPair().then(setPairData); } :
      showChildhoodWheel ? () => setShowChildhoodWheel(false) :
      showPracticesOnboarding ? () => setShowPracticesOnboarding(false) :
      showTodayNote ? () => setShowTodayNote(false) :
      null;
    if (closer) {
      bb.show();
      bb.onClick(closer);
      return () => bb.offClick(closer);
    } else {
      bb.hide();
    }
  }, [showSchemaInfo, showProfile, showAbout, showPairSheet, showChildhoodWheel, showPracticesOnboarding, showTodayNote]);

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

      {tab === 'today' && showYsqBanner && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⏸</span>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setShowYsqBanner(false); setSchemaAutoStartTest(true); setShowSchemaInfo(true); }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>Незаконченный тест схем</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Нажми, чтобы продолжить с места остановки</div>
            </div>
            <button
              onClick={() => setShowYsqBanner(false)}
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
      {tab === 'today' && pairData !== null && !pairCardDismissed && (
        <div style={{ padding: '8px 20px 0' }}>
          <PairCard
            partnerIndex={pairData.partnerIndex}
            partnerTodayDone={pairData.partnerTodayDone}
            showInvite={!pairData.paired}
            pendingCode={!pairData.paired && !!pairData.code}
            onInvite={() => setShowPairSheet(true)}
            onDismiss={!pairData.paired ? () => {
              localStorage.setItem('pair_card_dismissed', '1');
              setPairCardDismissed(true);
            } : undefined}
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
          : <HistoryView needs={needs} history={history} currentRatings={ratings} childhoodRatings={childhoodRatings} onOpenSchemas={() => setShowSchemaInfo(true)} days={historyDays} onChangeDays={setHistoryDays} />
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

      {showSchemaInfo && <SchemaInfoSheet onClose={() => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); }} ratings={ratings} autoStartTest={schemaAutoStartTest} />}
    </div>
  );
}
