import { useEffect, useState, useCallback, useRef } from 'react';
import { Need, DayHistory, COLORS } from './types';
import { api } from './api';
import { DiarySection } from './sections/DiarySection';
import { TodaySection } from './sections/TodaySection';
import { SchemasSection } from './sections/SchemasSection';
import { ProfileSection, DEFAULT_SECTION_KEY } from './sections/ProfileSection';
import { HelpSection } from './sections/HelpSection';
import { BottomNav, Section } from './components/BottomNav';
import { FloatingPill } from './components/FloatingPill';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { BottomSheet } from './components/BottomSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { PracticesScreen } from './components/PracticesScreen';
import { PlansScreen } from './components/PlansScreen';
import { Celebration } from './components/Celebration';
import { NoteSheet } from './components/NoteSheet';
import { Loader } from './components/Loader';
import { SchemaInfoSheet } from './components/SchemaInfoSheet';
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
import { getTelegramSafeTop } from './utils/safezone';
import { SchemaEntrySheet } from './components/diary/SchemaEntrySheet';
import { ModeEntrySheet } from './components/diary/ModeEntrySheet';
import { GratitudeEntrySheet } from './components/diary/GratitudeEntrySheet';

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
  'Это поведенческая техника, не просто самонаблюдение. Ты оцениваешь не фоновое ощущение, а конкретные действия дня: было ли что-то, что удовлетворило потребность. Через 3–5 дней паттерн начинает читаться: что тебя питает, что истощает, чего не хватает.',
  'Это не про «быть лучше». Это про осознанно организовывать свою жизнь — видя, что на самом деле происходит.',
];

const NEEDS_EXPLAINER = [
  { emoji: '🤝', name: 'Привязанность', text: 'Потребность в настоящем контакте с людьми. Не просто присутствие рядом — а конкретные моменты: кто-то обнял, сказал тёплое, выслушал по-настоящему. Без этих действий — одиночество даже в толпе.' },
  { emoji: '🚀', name: 'Автономия', text: 'Потребность действовать из себя. Принимать решения, проверяя — хочу ли я этого? — а не потому что так надо. Делать что-то своим путём и справляться самому. Без этого — ощущение ловушки.' },
  { emoji: '💬', name: 'Выражение чувств', text: 'Потребность говорить о том, что внутри — не накапливать. Сказать «не хочу», заплакать, выразить злость или радость, прямо назвать что нужно. Когда это подавляется — уходит в тело или выплёскивается не туда.' },
  { emoji: '🎉', name: 'Спонтанность', text: 'Потребность в лёгкости и действиях без цели. Делать что-то ради удовольствия, смеяться, быть спонтанным — не потому что полезно, а потому что живо. Без этого жизнь становится механической.' },
  { emoji: '⚖️', name: 'Границы', text: 'Потребность про две стороны. Внешняя: уметь говорить нет и защищать своё время и пространство. Внутренняя: удерживать себя от импульсов — работать когда надо, откладывать удовольствие осознанно. Вместе это даёт устойчивость.' },
];

type TrackerTab = 'today' | 'history';

const DISCLAIMER_KEY = 'disclaimer_v2_accepted';

function getInitialSection(): Section {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('section');
  if (s === 'profile') return 'profile';
  if (s === 'schemas') return 'schemas';
  if (s === 'help') return 'help';
  const stored = localStorage.getItem(DEFAULT_SECTION_KEY) as Section | null;
  if (stored && ['today', 'help', 'schemas', 'profile'].includes(stored)) return stored;
  return 'today';
}

function fillHistoryGaps(h: DayHistory[]): DayHistory[] {
  if (h.length === 0) return h;
  const byDate = new Map(h.map(d => [d.date, d]));
  const todayEntry = h.find(d => d.date === TODAY_DATE);
  const nonToday = h.filter(d => d.date !== TODAY_DATE);
  if (nonToday.length === 0) return h;
  const earliest = nonToday[nonToday.length - 1].date;
  const filled: DayHistory[] = todayEntry ? [todayEntry] : [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // start from yesterday
  for (let i = 0; i < 60; i++) {
    const date = cursor.toISOString().split('T')[0];
    if (date < earliest) break;
    filled.push(byDate.get(date) ?? { date, ratings: {} });
    cursor.setDate(cursor.getDate() - 1);
  }
  return filled;
}

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
    <BottomSheet onClose={() => {}} zIndex={300}>
      <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em' }}>
          БЕТА-ВЕРСИЯ
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.4 }}>
          Приложение в стадии тестирования — функции могут меняться,<br />данные могут быть сброшены
        </div>
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

const SECTIONS: Section[] = ['today', 'help', 'schemas', 'profile'];

export default function App() {
  const [section, setSection] = useState<Section>(getInitialSection);
  const swipeTouchRef = useRef<{ x: number; y: number } | null>(null);
  const [disclaimerDone, setDisclaimerDone] = useState(
    () => !!localStorage.getItem(DISCLAIMER_KEY)
  );
  const historyDays = 30;
  const [trackerTab, setTrackerTab] = useState<TrackerTab>('today');
  const tabScrollPositions = useRef<Record<TrackerTab, number>>({ today: 0, history: 0 });
  const [showAbout, setShowAbout] = useState(false);
  const [showSchemaInfo, setShowSchemaInfo] = useState(false);
  const [schemaAutoStartTest, setSchemaAutoStartTest] = useState(false);
  const [schemaInitialTab, setSchemaInitialTab] = useState<'needs'|'schemas'|'modes'>('needs');
  const [schemaHighlight, setSchemaHighlight] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showPractices, setShowPractices] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
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
  const [todayRefreshKey, setTodayRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [helpPracticeCount, setHelpPracticeCount] = useState<number | null>(null);
  const [helpPlanCount, setHelpPlanCount] = useState<number | null>(null);
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

  // Overlay states (open over current tab)
  const [showTracker, setShowTracker] = useState(false);
  const [showDiaries, setShowDiaries] = useState(false);
  const [newDiaryEntry, setNewDiaryEntry] = useState<'schema' | 'mode' | 'gratitude' | null>(null);
  const [diaryActiveSchemaIds, setDiaryActiveSchemaIds] = useState<string[] | undefined>(undefined);

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
    api.recordActivity().catch(() => {});
    const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];
    Promise.all(NEED_IDS.map(id => api.getPractices(id)))
      .then(r => setHelpPracticeCount(r.reduce((s, a) => s + a.length, 0))).catch(() => setHelpPracticeCount(0));
    api.getPlanHistory(30).then(p => setHelpPlanCount(p.length)).catch(() => setHelpPlanCount(0));
    Promise.all([api.needs(), api.ratings()])
      .then(([n, r]) => {
        setNeeds(n);
        setRatings(r);
        const initialSaved: Record<string, boolean> = {};
        for (const key of Object.keys(r)) initialSaved[key] = true;
        setSaved(initialSaved);
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
    api.getProfile().then(p => {
      setDiaryActiveSchemaIds(p.ysq.activeSchemaIds);
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
    if (startParam === 'diaries') setShowDiaries(true);
    if (startParam === 'tracker') setShowTracker(true);
  }, []);

  useEffect(() => {
    if (pairData && pairData.partners.length > 0) {
      localStorage.removeItem('pair_card_dismissed');
      setPairCardDismissed(false);
      api.updateSettings({ pairCardDismissed: false }).catch(() => {});
    }
  }, [pairData?.partners.length]);

  // Refresh Today section data after returning from overlays
  const prevOverlayRef = useRef(false);
  useEffect(() => {
    const anyOpen = showTracker || showDiaries || showSchemaInfo;
    if (!anyOpen && prevOverlayRef.current) setTodayRefreshKey(k => k + 1);
    prevOverlayRef.current = anyOpen;
  }, [showTracker, showDiaries, showSchemaInfo]);

  // Refresh Profile section data after returning from settings/practices/plans/tracker
  const prevProfileOverlayRef = useRef(false);
  useEffect(() => {
    const anyOpen = showSettings || showPractices || showPlans || showTracker || showChildhoodWheel;
    if (!anyOpen && prevProfileOverlayRef.current && section === 'profile') {
      setProfileRefreshKey(k => k + 1);
    }
    prevProfileOverlayRef.current = anyOpen;
  }, [showSettings, showPractices, showPlans, showTracker, showChildhoodWheel, section]);

  useEffect(() => {
    if (trackerTab === 'history') {
      setHistoryLoading(true);
      api.history(historyDays).then(h => setHistory(fillHistoryGaps(h))).finally(() => setHistoryLoading(false));
    }
  }, [trackerTab, historyDays]);

  // Telegram back button
  const backHandlerRef = useRef<() => void>(() => {});
  useEffect(() => {
    backHandlerRef.current =
      newDiaryEntry ? () => setNewDiaryEntry(null) :
      showTracker ? () => { setShowTracker(false); setTrackerTab('today'); } :
      showDiaries ? () => setShowDiaries(false) :
      showSchemaInfo ? () => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); } :
      showSettings ? () => setShowSettings(false) :
      showPractices ? () => setShowPractices(false) :
      showPlans ? () => setShowPlans(false) :
      showAbout ? () => setShowAbout(false) :
      showPairSheet ? () => { setShowPairSheet(false); api.getPair().then(setPairData); } :
      showChildhoodWheel ? () => setShowChildhoodWheel(false) :
      showPracticesOnboarding ? () => setShowPracticesOnboarding(false) :
      showTodayNote ? () => setShowTodayNote(false) :
      () => {};
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const anyOpen = newDiaryEntry || showTracker || showDiaries || showSchemaInfo || showSettings || showPractices || showPlans || showAbout || showPairSheet || showChildhoodWheel || showPracticesOnboarding || showTodayNote;
    if (anyOpen) bb.show(); else bb.hide();
  }, [newDiaryEntry, showTracker, showDiaries, showSchemaInfo, showSettings, showPractices, showPlans, showAbout, showPairSheet, showChildhoodWheel, showPracticesOnboarding, showTodayNote]);

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const handler = () => backHandlerRef.current();
    bb.onClick(handler);
    return () => bb.offClick(handler);
  }, []);

  const anyOverlayOpen = !!(newDiaryEntry || showTracker || showDiaries || showSchemaInfo || showSettings || showPractices || showPlans || showAbout || showPairSheet || showChildhoodWheel || showPracticesOnboarding || showTodayNote);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeTouchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeTouchRef.current || anyOverlayOpen) { swipeTouchRef.current = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeTouchRef.current.x;
    const dy = t.clientY - swipeTouchRef.current.y;
    swipeTouchRef.current = null;
    if (Math.abs(dx) < 72 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    setSection(cur => {
      const idx = SECTIONS.indexOf(cur);
      if (dx < 0 && idx < SECTIONS.length - 1) return SECTIONS[idx + 1];
      if (dx > 0 && idx > 0) return SECTIONS[idx - 1];
      return cur;
    });
  }, [anyOverlayOpen]);

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
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>😔</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Не удалось загрузить</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Проверь подключение и попробуй ещё раз
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '13px 28px', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Повторить
        </button>
      </div>
    );
  }

  const safeTop = getTelegramSafeTop();

  return (
    <div style={{ minHeight: '100vh' }} onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)', padding: '10px 20px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#fff' }}>
          Нет подключения — данные не сохраняются
        </div>
      )}

      {/* ── Main sections ── */}
      {section === 'today' && (
        <TodaySection
          needs={needs}
          ratings={ratings}
          onNavigate={setSection}
          onOpenSchema={(opts) => { setSchemaAutoStartTest(!!opts?.startTest); setSchemaInitialTab(opts?.tab ?? 'needs'); setSchemaHighlight(opts?.highlight); setShowSchemaInfo(true); }}
          onOpenAdvanced={() => setShowSettings(true)}
          onOpenTracker={() => setShowTracker(true)}
          onOpenDiaries={() => setShowDiaries(true)}
          onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
          refreshKey={todayRefreshKey}
        />
      )}

      {section === 'schemas' && (
        <SchemasSection
          onOpenSchema={(opts) => { setSchemaAutoStartTest(!!opts?.startTest); setSchemaInitialTab(opts?.tab ?? 'needs'); setSchemaHighlight(opts?.highlight); setShowSchemaInfo(true); }}
        />
      )}

      {section === 'help' && (
        <HelpSection
          onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
          onOpenPractices={() => setShowPractices(true)}
          onOpenPlans={() => setShowPlans(true)}
          practiceCount={helpPracticeCount}
          planCount={helpPlanCount}
        />
      )}

      {section === 'profile' && (
        <ProfileSection
          onOpenSettings={() => setShowSettings(true)}
          onOpenTracker={() => setShowTracker(true)}
          refreshKey={profileRefreshKey}
        />
      )}

      {/* ── Tracker overlay ── */}
      {showTracker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#060a12', overflowY: 'auto' }}>
          {/* Sticky header */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'rgba(6,10,18,0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: `${safeTop + 16}px 20px 14px`,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {/* Back + date row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button
                onClick={() => { setShowTracker(false); setTrackerTab('today'); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', padding: '0 4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ‹ Назад
              </button>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {formatHeaderDate()}
              </span>
            </div>

            <h1
              style={{
                fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px',
                color: '#fff', marginBottom: 3, lineHeight: 1.1,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Трекер потребностей
              <span onClick={() => setShowAbout(true)} style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', fontWeight: 400, lineHeight: 1, cursor: 'pointer' }}>ⓘ</span>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
              {trackerTab === 'today' ? 'Как ты сегодня?' : 'Твоя история потребностей'}
            </p>

            {/* Pill tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3 }}>
              {(['today', 'history'] as TrackerTab[]).map((t) => {
                const active = trackerTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      tabScrollPositions.current[trackerTab] = window.scrollY;
                      setTrackerTab(t);
                      requestAnimationFrame(() => window.scrollTo(0, tabScrollPositions.current[t]));
                    }}
                    style={{
                      flex: 1, padding: '8px 0', border: 'none', borderRadius: 10,
                      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: 14, fontWeight: active ? 500 : 400,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {t === 'today' ? 'Сейчас' : 'История'}
                  </button>
                );
              })}
            </div>
          </div>

          {trackerTab === 'today' && showYesterdayBanner && (
            <div style={{ padding: '12px 20px 0' }}>
              <div
                onClick={() => { setShowYesterdaySheet(true); setShowYesterdayBanner(false); localStorage.setItem('yesterday_banner_' + YESTERDAY_DATE, '1'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>📅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>Заполнить вчера</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Вчера не было оценок — можно добавить сейчас</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setShowYesterdayBanner(false); localStorage.setItem('yesterday_banner_' + YESTERDAY_DATE, '1'); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                >×</button>
              </div>
            </div>
          )}
          {trackerTab === 'today' && showYsqBanner && (
            <div style={{ padding: '12px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⏸</span>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { localStorage.removeItem(YSQ_BANNER_DISMISSED_KEY); setShowYsqBanner(false); setSchemaAutoStartTest(true); setShowSchemaInfo(true); }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>Незаконченный тест схем</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Нажми, чтобы продолжить с места остановки</div>
                </div>
                <button onClick={() => { localStorage.setItem(YSQ_BANNER_DISMISSED_KEY, '1'); setShowYsqBanner(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>×</button>
              </div>
            </div>
          )}
          {trackerTab === 'today' && showWeeklyQ && (
            <div style={{ padding: '16px 20px 0' }}>
              <WeeklyQuestion date={TODAY_DATE} onDismiss={() => setShowWeeklyQ(false)} />
            </div>
          )}
          {trackerTab === 'today' && pairData !== null && (pairData.partners.length > 0 || pairData.pendingCode || (pairCardDismissed === false && HAS_HISTORY)) && (
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
          {trackerTab === 'today' && (() => {
            const upcoming = pendingPlans.filter(p => p.scheduledDate >= TODAY_DATE);
            return upcoming.length > 0 ? (
              <div style={{ padding: '8px 20px 0' }}>
                {upcoming.map(plan => {
                  const color = COLORS[plan.needId] ?? '#888';
                  const isToday = plan.scheduledDate === TODAY_DATE;
                  return (
                    <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: color + '12', border: `1px solid ${color}28`, borderRadius: 14, padding: '10px 14px', marginBottom: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>🎯</span>
                      <div>
                        <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{isToday ? 'Твой план на сегодня' : 'Твой план на завтра'}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{plan.practiceText}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}
          {trackerTab === 'today' && (
            <TodayView
              needs={needs}
              ratings={ratings}
              saved={saved}
              isOffline={isOffline}
              onChange={handleChange}
              onSaved={handleSaved}
              onNote={() => setShowTodayNote(true)}
              onOpenPractices={() => setShowPracticesOnboarding(true)}
              onPlanCreated={() => api.getPendingPlans().then(setPendingPlans).catch(() => {})}
              plannedNeedIds={new Set(pendingPlans.filter(p => p.scheduledDate >= TODAY_DATE).map(p => p.needId))}
              onClose={() => { setShowTracker(false); setTrackerTab('today'); }}
            />
          )}
          {trackerTab === 'today' && needs.length > 0 && needs.every(n => saved[n.id]) && (
            <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px 28px', background: 'linear-gradient(to top, #060a12 65%, transparent)', zIndex: 5 }}>
              <button
                onClick={() => { setShowTracker(false); setTrackerTab('today'); }}
                style={{ width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', background: 'rgba(52,211,153,0.14)', color: '#34d399', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                Готово — закрыть трекер ✓
              </button>
            </div>
          )}
          {trackerTab === 'history' && (
            historyLoading
              ? <Loader minHeight="60vh" />
              : <HistoryView
                  needs={needs}
                  history={history}
                  currentRatings={ratings}
                  childhoodRatings={childhoodRatings}
                  onOpenSchemas={() => setShowSchemaInfo(true)}
                  onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
                  onGoToToday={() => {
                    tabScrollPositions.current['history'] = window.scrollY;
                    setTrackerTab('today');
                    requestAnimationFrame(() => window.scrollTo(0, tabScrollPositions.current['today']));
                  }}
                  onBackfill={(date) => setBackfillDate(date)}
                />
          )}
          <div style={{ height: 80 }} />

          {pendingPlans.length > 0 && needs.length > 0 && (() => {
            const plan = pendingPlans.find(p => p.scheduledDate < TODAY_DATE);
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

          {showYesterdaySheet && (
            <YesterdaySheet needs={needs} date={YESTERDAY_DATE} onClose={() => {
              setShowYesterdaySheet(false);
              if (trackerTab === 'history') {
                setHistoryLoading(true);
                api.history(historyDays).then(h => setHistory(fillHistoryGaps(h))).finally(() => setHistoryLoading(false));
              }
            }} />
          )}
          {backfillDate && (
            <YesterdaySheet needs={needs} date={backfillDate} onClose={() => {
              setBackfillDate(null);
              setHistoryLoading(true);
              api.history(historyDays).then(h => setHistory(fillHistoryGaps(h))).finally(() => setHistoryLoading(false));
            }} />
          )}
        </div>
      )}

      {/* ── Diaries overlay ── */}
      {showDiaries && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#060a12', overflowY: 'auto' }}>
          <DiarySection onClose={() => setShowDiaries(false)} />
        </div>
      )}

      {!disclaimerDone && (
        <Disclaimer onAccept={() => {
          localStorage.setItem(DISCLAIMER_KEY, '1');
          api.acceptDisclaimer().catch(() => {});
          setDisclaimerDone(true);
        }} />
      )}

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
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      {showPractices && <PracticesScreen onClose={() => setShowPractices(false)} onOpenTracker={() => { setShowPractices(false); setShowTracker(true); }} />}
      {showPlans && <PlansScreen onClose={() => setShowPlans(false)} onOpenTracker={() => { setShowPlans(false); setShowTracker(true); }} />}
      {showSchemaInfo && <SchemaInfoSheet onClose={() => { setShowSchemaInfo(false); setSchemaAutoStartTest(false); setSchemaHighlight(undefined); }} ratings={ratings} autoStartTest={schemaAutoStartTest} initialTab={schemaInitialTab} highlightSchema={schemaHighlight} />}

      {/* ── Diary entry sheets (from FloatingPill) ── */}
      {newDiaryEntry === 'schema' && (
        <SchemaEntrySheet
          activeSchemaIds={diaryActiveSchemaIds}
          onClose={() => setNewDiaryEntry(null)}
          onSave={async (data) => { await api.createSchemaDiary(data); }}
        />
      )}
      {newDiaryEntry === 'mode' && (
        <ModeEntrySheet
          onClose={() => setNewDiaryEntry(null)}
          onSave={async (data) => { await api.createModeDiary(data); }}
        />
      )}
      {newDiaryEntry === 'gratitude' && (
        <GratitudeEntrySheet
          onClose={() => setNewDiaryEntry(null)}
          date={TODAY_DATE}
          onSave={async (date, items) => { await api.createGratitudeDiary(date, items); }}
        />
      )}

      {/* ── Floating pill (always above bottom bar) ── */}
      {!showTracker && !showDiaries && !showSchemaInfo && !showSettings && !showPractices && !showPlans && !showChildhoodWheel && !newDiaryEntry && (
        <FloatingPill
          onOpenTracker={() => setShowTracker(true)}
          onOpenSchemaDiary={() => setNewDiaryEntry('schema')}
          onOpenModeDiary={() => setNewDiaryEntry('mode')}
          onOpenGratitude={() => setNewDiaryEntry('gratitude')}
        />
      )}

      {!showTracker && !showDiaries && !showSchemaInfo && !showSettings && !showPractices && !showPlans && !showChildhoodWheel && !newDiaryEntry && (
        <BottomNav section={section} onSelect={setSection} />
      )}
    </div>
  );
}
