import { useEffect, useState, useCallback, useRef } from 'react';
import { applyTheme, getTheme } from './utils/theme';
import { Need, DayHistory, COLORS } from './types';

// Apply saved theme immediately before first render
applyTheme(getTheme());
import { api } from './api';
import { DiarySection } from './sections/DiarySection';
import { TodaySection } from './sections/TodaySection';
import { SchemasSection } from './sections/SchemasSection';
import { ProfileSection, DEFAULT_SECTION_KEY } from './sections/ProfileSection';
import { HelpSection } from './sections/HelpSection';
import { BottomNav, Section } from './components/BottomNav';
import { FloatingPill } from './components/FloatingPill';
import { TodayView } from './components/TodayView';
import { TrackerOverlay } from './components/TrackerOverlay';
import { HistoryView } from './components/HistoryView';
import { BottomSheet } from './components/BottomSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { TherapistClientSheet } from './components/TherapistClientSheet';
import { PracticesScreen } from './components/PracticesScreen';
import { PlansScreen } from './components/PlansScreen';
import { Celebration } from './components/Celebration';
import { NoteSheet } from './components/NoteSheet';
import { Loader } from './components/Loader';
import { SchemaInfoSheet } from './components/SchemaInfoSheet';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from './components/YSQTestSheet';
import { WeeklyQuestion, shouldShowWeeklyQuestion } from './components/WeeklyQuestion';
import { SectionLabel } from './components/SectionLabel';
import { PairCard } from './components/PairCard';
import { PairSheet } from './components/PairSheet';
import { CheckInSheet } from './components/CheckInSheet';
import { PracticesOnboarding } from './components/PracticesOnboarding';
import { ChildhoodWheelSheet, shouldShowChildhoodWheel, CHILDHOOD_DONE_KEY } from './components/ChildhoodWheelSheet';
import { PracticePlan, PairsData, StreakData, UserTask } from './api';
import { useSafeTop } from './utils/safezone';
import { cacheTherapistContact } from './utils/therapistContact';
import { SchemaEntrySheet } from './components/diary/SchemaEntrySheet';
import { ModeEntrySheet } from './components/diary/ModeEntrySheet';
import { GratitudeEntrySheet } from './components/diary/GratitudeEntrySheet';
import { todayStr } from './utils/format';

const TODAY_DATE = todayStr();
const TODAY_KEY = 'celebrated_' + TODAY_DATE;
const HAS_HISTORY = Object.keys(localStorage).some(k => k.startsWith('celebrated_') && k !== TODAY_KEY);
const YESTERDAY_DATE = (() => {
  const [y, m, d] = TODAY_DATE.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
})();

import { TaskCreateSheet } from './components/TaskCreateSheet';
import { ABOUT_TEXT, NEEDS_EXPLAINER } from './aboutData';

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
  const [step, setStep] = useState(0);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const dirRef = useRef<'fwd' | 'back' | 'init'>('init');
  const canAddToHome = !!(window as any).Telegram?.WebApp?.addToHomeScreen;
  const TOTAL = canAddToHome ? 5 : 4;
  const ready = c1 && c2;

  const goForward = () => { dirRef.current = 'fwd'; setStep(s => s + 1); };
  const goBack    = () => { dirRef.current = 'back'; setStep(s => s - 1); };

  const Checkbox = ({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) => (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
        marginTop: 14, padding: '14px 16px',
        background: checked ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'rgba(var(--fg-rgb),0.04)',
        border: `1.5px solid ${checked ? 'color-mix(in srgb, var(--accent) 28%, transparent)' : 'rgba(var(--fg-rgb),0.1)'}`,
        borderRadius: 16, transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8, flexShrink: 0,
        border: `2px solid ${checked ? 'var(--accent)' : 'rgba(var(--fg-rgb),0.25)'}`,
        background: checked ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: checked ? 'scale(1)' : 'scale(0.88)',
      }}>
        {checked && <span style={{ fontSize: 13, color: 'var(--on-accent)', fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>{label}</span>
    </div>
  );

  const steps = [
    // Step 0: Welcome
    <div key={0}>
      <div style={{ textAlign: 'center', paddingTop: 4, marginBottom: 22 }}>
        <div style={{
          width: 76, height: 76, borderRadius: 24, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--accent), #60a5fa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, boxShadow: '0 10px 40px rgba(124,114,248,0.35)',
        }}>🧠</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.6px', marginBottom: 10 }}>СхемаЛаб</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: 'var(--accent-yellow)', letterSpacing: '0.12em' }}>
          БЕТА-ВЕРСИЯ
        </div>
      </div>
      <div style={{ fontSize: 15, color: 'var(--text-sub)', lineHeight: 1.7, textAlign: 'center', marginBottom: 18 }}>
        Хорошо, что ты здесь.<br />Замечать свои потребности — это уже немало.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '📊', text: 'Трекер потребностей и дневники' },
          { icon: '🧪', text: 'Тесты, практики и упражнения' },
          { icon: '🤝', text: 'Пространство для работы с терапевтом' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 14, padding: '12px 14px' }}>
            <span style={{ fontSize: 19 }}>{icon}</span>
            <span style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>,

    // Step 1: Data & Privacy
    <div key={1}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, margin: '0 auto 14px', background: 'linear-gradient(135deg, #4ade80, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 8px 28px rgba(74,222,128,0.28)' }}>🔐</div>
        <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Данные под защитой</div>
      </div>
      <div className='card' style={{ borderRadius: 18, padding: '4px 16px' }}>
        {[
          { icon: '🔒', text: 'Зашифровано на сервере (AES-256)' },
          { icon: '🚫', text: 'Не передаётся третьим лицам' },
          { icon: '🗑️', text: 'Удалить можно в любой момент' },
        ].map(({ icon, text }, i, arr) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(var(--fg-rgb),0.06)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(var(--fg-rgb),0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{icon}</div>
            <span style={{ fontSize: 14, color: 'var(--text)' }}>{text}</span>
          </div>
        ))}
      </div>
      <Checkbox
        checked={c2}
        onToggle={() => setC2(p => !p)}
        label="Я согласен(на) на обработку персональных данных согласно Политике конфиденциальности"
      />
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <a href="https://schemalab.ru/privacy" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
          Политика конфиденциальности →
        </a>
      </div>
    </div>,

    // Step 2: Not therapy
    <div key={2}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, margin: '0 auto 14px', background: 'linear-gradient(135deg, #fb923c, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 8px 28px rgba(251,146,60,0.28)' }}>💡</div>
        <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Важно знать</div>
      </div>
      <div className='card' style={{ borderRadius: 18, padding: '16px 18px' }}>
        <div style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.75 }}>
          СхемаЛаб — инструмент самоисследования. Оценки, тесты и упражнения внутри{' '}
          <strong style={{ color: 'var(--text)' }}>не являются клинической диагностикой</strong>{' '}
          и не заменяют работу с психологом.
          <br /><br />
          Если чувствуешь, что что-то важное требует внимания — терапия это место, где можно разобраться по-настоящему.
        </div>
      </div>
      <Checkbox checked={c1} onToggle={() => setC1(p => !p)} label="Я понимаю, что это инструмент самоисследования, а не клиническая диагностика" />
    </div>,

    // Step 3: Author
    <div key={3}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, margin: '0 auto 14px', background: 'linear-gradient(135deg, var(--accent), var(--accent-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 8px 28px rgba(124,114,248,0.28)' }}>👤</div>
        <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Об авторе</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Канал о схема-терапии', handle: '@SchemeHappens', url: 'https://t.me/SchemeHappens', emoji: '📢' },
          { label: 'Записаться на сессию', handle: '@kotlarewski', url: 'https://t.me/kotlarewski', emoji: '💬' },
        ].map(item => (
          <a key={item.handle} href={item.url} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 16, padding: '14px 16px', textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent), #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{item.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2, letterSpacing: '0.02em' }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{item.handle}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-faint)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
          </a>
        ))}
      </div>
      {!ready && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 12, padding: '10px 14px' }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 12, color: 'var(--accent-orange)', lineHeight: 1.5 }}>
            {!c2 && !c1 ? 'Нужно подтвердить согласие на шагах 2 и 3' : !c2 ? 'Вернись к шагу 2 и подтверди согласие' : 'Вернись к шагу 3 и подтверди согласие'}
          </span>
        </div>
      )}
    </div>,

    // Step 4: Add to home screen (only shown if canAddToHome)
    <div key={4} style={{ textAlign: 'center', paddingTop: 8 }}>
      <div style={{ fontSize: 66, marginBottom: 18, lineHeight: 1, animation: 'pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>📲</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 10 }}>Добавь на главный экран</div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.65, marginBottom: 28 }}>
        Так дневник будет всегда под рукой — как обычное приложение.
      </div>
      <button onClick={() => { (window as any).Telegram?.WebApp?.addToHomeScreen(); }} className="btn-primary" style={{ marginBottom: 10 }}>
        Добавить на экран
      </button>
    </div>,
  ];

  const stepAnim = dirRef.current === 'init' ? undefined : dirRef.current === 'fwd' ? 'tab-right 0.22s ease' : 'tab-left 0.22s ease';

  return (
    <BottomSheet onClose={() => {}} zIndex={300}>
      {/* Progress bar */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ height: 3, background: 'rgba(var(--fg-rgb),0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-blue))',
            width: `${((step + 1) / TOTAL) * 100}%`,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.04em' }}>{step + 1} / {TOTAL}</span>
        </div>
      </div>

      {/* Animated step content */}
      <div key={step} style={{ minHeight: 280, animation: stepAnim }}>
        {steps[step]}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        {step > 0 && (
          <button onClick={goBack} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(var(--fg-rgb),0.07)', color: 'var(--text-sub)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Назад
          </button>
        )}
        {step < TOTAL - 1 ? (
          <button onClick={() => { if (step === 3 && !ready) return; goForward(); }} className="btn-primary" style={{ flex: 2, opacity: step === 3 && !ready ? 0.35 : 1 }}>
            Далее →
          </button>
        ) : (
          <button onClick={onAccept} className="btn-primary" style={{ flex: 2 }}>
            {canAddToHome ? 'Пропустить и начать' : 'Начать'}
          </button>
        )}
      </div>
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
  const [therapistMode, setTherapistMode] = useState(() => localStorage.getItem('therapist_mode') === '1');
  const switchTherapistMode = (on: boolean) => { localStorage.setItem('therapist_mode', on ? '1' : '0'); setTherapistMode(on); };
  const [cabinetView, setCabinetView] = useState<'list' | 'client'>('list');
  const therapistBackHandlerRef = useRef<() => void>(() => setCabinetView('list'));
  const [userRole, setUserRole] = useState<'CLIENT' | 'THERAPIST'>('CLIENT');
  const safeTop = useSafeTop();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [helpTasks, setHelpTasks] = useState<UserTask[] | null>(null);
  const [helpTasksKey, setHelpTasksKey] = useState(0);
  const YSQ_BANNER_DISMISSED_KEY = 'ysq_banner_dismissed';
  const [showYsqBanner, setShowYsqBanner] = useState(
    () => !!localStorage.getItem(YSQ_PROGRESS_KEY) && !localStorage.getItem(YSQ_RESULT_KEY) && !localStorage.getItem('ysq_banner_dismissed')
  );
  const [needs, setNeeds] = useState<Need[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [yesterdayRatings, setYesterdayRatings] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Overlay states (open over current tab)
  const [showTracker, setShowTracker] = useState(false);
  const [showTrackerOverlay, setShowTrackerOverlay] = useState(false);
  const [trackerNeedId, setTrackerNeedId] = useState<string | null>(null);
  const [showTrackerGoal, setShowTrackerGoal] = useState(false);
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
    // Clear YSQ data from localStorage if it belongs to a different Telegram user.
    // Prevents a shared-device scenario where person B reads person A's clinical data.
    const currentUserId = String((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? '');
    if (currentUserId) {
      const storedUserId = localStorage.getItem('ysq_owner_id');
      if (storedUserId && storedUserId !== currentUserId) {
        localStorage.removeItem(YSQ_RESULT_KEY);
        localStorage.removeItem(YSQ_PROGRESS_KEY);
      }
      localStorage.setItem('ysq_owner_id', currentUserId);
    }
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
    // If disclaimer wasn't accepted in this WebView, check server state.
    // Covers the case where the user accepted on the website or another device.
    if (!localStorage.getItem(DISCLAIMER_KEY)) {
      api.getDisclaimer().then(d => {
        if (d.accepted) {
          localStorage.setItem(DISCLAIMER_KEY, '1');
          setDisclaimerDone(true);
        }
      }).catch(() => {});
    }
    const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];
    Promise.all(NEED_IDS.map(id => api.getPractices(id)))
      .then(r => setHelpPracticeCount(r.reduce((s, a) => s + a.length, 0))).catch(() => setHelpPracticeCount(0));
    api.getPlanHistory(30).then(p => setHelpPlanCount(p.length)).catch(() => setHelpPlanCount(0));
    Promise.all([api.needs(), api.ratings(), api.ratings(YESTERDAY_DATE)])
      .then(([n, r, yR]) => {
        setNeeds(n);
        setRatings(r);
        setYesterdayRatings(yR);
        const initialSaved: Record<string, boolean> = {};
        for (const key of Object.keys(r)) initialSaved[key] = true;
        setSaved(initialSaved);
        if (n.length > 0 && n.every(need => r[need.id] !== undefined)) {
          localStorage.setItem(TODAY_KEY, '1');
        }
        if (!yesterdayBannerDismissed && HAS_HISTORY && Object.keys(yR).length === 0) {
          setShowYesterdayBanner(true);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    api.getPair().then(setPairData).catch(e => console.error('getPair failed', e));
    api.getSettings().then(s => {
      setPairCardDismissed(s.pairCardDismissed);
      if (s.pairCardDismissed) localStorage.setItem('pair_card_dismissed', '1');
      else localStorage.removeItem('pair_card_dismissed');
    }).catch(() => {
      setPairCardDismissed(!!localStorage.getItem('pair_card_dismissed'));
    });
    api.getPendingPlans().then(setPendingPlans).catch(e => console.error('getPendingPlans failed', e));
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
      setUserRole(p.role);
      // First launch as therapist: auto-enable therapist mode if not saved yet
      if (p.role === 'THERAPIST' && localStorage.getItem('therapist_mode') === null) {
        switchTherapistMode(true);
      }
      // Safety: CLIENT can never be in therapist mode
      if (p.role !== 'THERAPIST') {
        switchTherapistMode(false);
      }
      if (p.name) setDisplayName(p.name);
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (p.role === 'THERAPIST') {
        cacheTherapistContact({ role: 'THERAPIST', partnerId: null, partnerName: null, myId: tgUser?.id ?? null, myName: tgUser?.first_name ?? null });
      } else {
        api.getTherapyRelation().then(rel => {
          cacheTherapistContact({ role: 'CLIENT', partnerId: rel?.partnerId ?? null, partnerName: rel?.partnerName ?? null, myId: null, myName: null });
        }).catch(() => {});
      }
    }).catch(() => {});
    api.getTasks().then(setHelpTasks).catch(() => setHelpTasks([]));
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
    if (startParam === 'tracker') { setTrackerNeedId(null); setShowTrackerOverlay(true); }
    if (startParam?.startsWith('therapy_')) {
      const code = startParam.replace('therapy_', '');
      api.joinTherapy(code).catch(() => {});
    }
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
    const anyOpen = showTrackerOverlay || showTracker || showDiaries || showSchemaInfo;
    if (!anyOpen && prevOverlayRef.current) setTodayRefreshKey(k => k + 1);
    prevOverlayRef.current = anyOpen;
  }, [showTrackerOverlay, showTracker, showDiaries, showSchemaInfo]);

  // Refresh Profile section data after returning from settings/practices/plans/tracker
  const prevProfileOverlayRef = useRef(false);
  useEffect(() => {
    const anyOpen = showSettings || showPractices || showPlans || showTrackerOverlay || showTracker || showChildhoodWheel;
    if (!anyOpen && prevProfileOverlayRef.current && section === 'profile') {
      setProfileRefreshKey(k => k + 1);
    }
    prevProfileOverlayRef.current = anyOpen;
  }, [showSettings, showPractices, showPlans, showTrackerOverlay, showTracker, showChildhoodWheel, section]);

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
      showTrackerOverlay ? () => { setShowTrackerOverlay(false); setTrackerNeedId(null); } :
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
      therapistMode && cabinetView === 'client' ? () => therapistBackHandlerRef.current() :
      () => {};
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const anyOpen = newDiaryEntry || showTrackerOverlay || showTracker || showDiaries || showSchemaInfo || showSettings || showPractices || showPlans || showAbout || showPairSheet || showChildhoodWheel || showPracticesOnboarding || showTodayNote || (therapistMode && cabinetView === 'client');
    if (anyOpen) bb.show(); else bb.hide();
  }, [newDiaryEntry, showTrackerOverlay, showTracker, showDiaries, showSchemaInfo, showSettings, showPractices, showPlans, showAbout, showPairSheet, showChildhoodWheel, showPracticesOnboarding, showTodayNote, therapistMode, cabinetView]);

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const handler = () => backHandlerRef.current();
    bb.onClick(handler);
    return () => bb.offClick(handler);
  }, []);

  const anyOverlayOpen = !!(newDiaryEntry || showTrackerOverlay || showTracker || showDiaries || showSchemaInfo || showSettings || showPractices || showPlans || showAbout || showPairSheet || showChildhoodWheel || showPracticesOnboarding || showTodayNote);

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
    const isAuthError = error.includes('401') || error.includes('403');
    return (
      <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', top: -120, right: -100, background: isAuthError ? 'rgba(124,114,248,0.18)' : 'rgba(248,113,113,0.14)', filter: 'blur(100px)' }} />
          <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', bottom: 80, left: -100, background: isAuthError ? 'rgba(96,165,250,0.12)' : 'rgba(251,146,60,0.11)', filter: 'blur(90px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 320, animation: 'fade-in 0.4s ease' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 32, margin: '0 auto 28px',
            background: isAuthError ? 'linear-gradient(135deg, var(--accent), var(--accent-indigo))' : 'linear-gradient(135deg, #f87171, #fb923c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
            boxShadow: isAuthError ? '0 16px 48px rgba(124,114,248,0.28)' : '0 16px 48px rgba(248,113,113,0.28)',
          }}>
            {isAuthError ? '🔐' : '📡'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.6px', marginBottom: 12 }}>
            {isAuthError ? 'Сессия истекла' : 'Нет соединения'}
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 36 }}>
            {isAuthError
              ? 'Закрой приложение полностью и открой заново — Telegram выдаст свежий токен'
              : 'Проверь подключение к интернету и попробуй снова'}
          </div>
          <button
            onClick={isAuthError ? () => window.Telegram?.WebApp?.close() : () => window.location.reload()}
            className="btn-primary"
          >
            {isAuthError ? 'Закрыть приложение' : 'Повторить'}
          </button>
          {!isAuthError && (
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Если не помогает — перезапусти приложение
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
      {/* Ambient gradient blobs — colors adapt per theme via CSS vars */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', top: -90, right: -70, background: 'var(--blob-1)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', bottom: 140, left: -70, background: 'var(--blob-2)', filter: 'blur(80px)' }} />
      </div>
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)', padding: '10px 20px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          Нет подключения — данные не сохраняются
        </div>
      )}

      {/* ── Therapist app mode — full app replacement ── */}
      {therapistMode && (
        <>
          <TherapistClientSheet
            view={cabinetView}
            onViewChange={setCabinetView}
            onClose={() => { switchTherapistMode(false); setCabinetView('list'); }}
            backHandlerRef={therapistBackHandlerRef}
          />
          {/* Therapist bottom nav — replaces regular BottomNav */}
          {!showSettings && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(var(--fg-rgb),0.08)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 5, paddingBottom: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>β бета</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', height: 60 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <span style={{ fontSize: 18 }}>👨‍⚕️</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.03em' }}>Кабинет</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', fontSize: 10, fontWeight: 500, letterSpacing: '0.03em' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Настройки
              </button>
            </div>
            </div>
          )}
        </>
      )}

      {/* ── Main sections (hidden when therapistMode) ── */}
      {!therapistMode && section === 'today' && (
        <TodaySection
          needs={needs}
          ratings={ratings}
          yesterdayRatings={yesterdayRatings}
          onNavigate={setSection}
          onOpenSchema={(opts) => { setSchemaAutoStartTest(!!opts?.startTest); setSchemaInitialTab(opts?.tab ?? 'needs'); setSchemaHighlight(opts?.highlight); setShowSchemaInfo(true); }}
          onOpenAdvanced={() => setShowSettings(true)}
          onOpenTracker={() => { setTrackerNeedId(null); setShowTrackerOverlay(true); }}
          onOpenTrackerAt={(needId) => { setTrackerNeedId(needId); setShowTrackerOverlay(true); }}
          onOpenTrackerHistory={() => { setTrackerTab('history'); setShowTracker(true); }}
          onOpenDiaries={() => setShowDiaries(true)}
          onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
          refreshKey={todayRefreshKey}
          userRole={userRole}
          onOpenTherapistCabinet={() => { setCabinetView('list'); switchTherapistMode(true); }}
        />
      )}

      {!therapistMode && section === 'schemas' && (
        <SchemasSection
          onOpenSchema={(opts) => { setSchemaAutoStartTest(!!opts?.startTest); setSchemaInitialTab(opts?.tab ?? 'needs'); setSchemaHighlight(opts?.highlight); setShowSchemaInfo(true); }}
          childhoodRatings={childhoodRatings}
          onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
        />
      )}

      {!therapistMode && section === 'help' && (
        <HelpSection
          onOpenChildhoodWheel={() => setShowChildhoodWheel(true)}
          onOpenPractices={() => setShowPractices(true)}
          onOpenPlans={() => setShowPlans(true)}
          onOpenTracker={() => { setTrackerNeedId(null); setShowTrackerOverlay(true); }}
          onOpenDiaries={() => setShowDiaries(true)}
          practiceCount={helpPracticeCount}
          planCount={helpPlanCount}
          initialTasks={helpTasks}
          refreshKey={helpTasksKey}
          onTasksChanged={() => { api.getTasks().then(setHelpTasks).catch(() => {}); setHelpTasksKey(k => k + 1); }}
          userRole={userRole}
          onOpenTherapistCabinet={() => { setCabinetView('list'); switchTherapistMode(true); }}
        />
      )}

      {!therapistMode && section === 'profile' && (
        <ProfileSection
          onOpenSettings={() => setShowSettings(true)}
          onOpenTracker={() => { setTrackerNeedId(null); setShowTrackerOverlay(true); }}
          refreshKey={profileRefreshKey}
          displayName={displayName}
        />
      )}

      {/* ── TrackerOverlay (NeedDial, per-need) ── */}
      {showTrackerOverlay && (
        <TrackerOverlay
          needs={needs}
          ratings={ratings}
          saved={saved}
          isOffline={isOffline}
          onChange={handleChange}
          onSaved={handleSaved}
          onClose={() => { setShowTrackerOverlay(false); setTrackerNeedId(null); }}
          initialNeedId={trackerNeedId}
          onOpenNote={() => setShowTodayNote(true)}
          onOpenGoal={() => setShowTrackerGoal(true)}
          onOpenHistory={() => { setShowTrackerOverlay(false); setTrackerNeedId(null); setTrackerTab('history'); setShowTracker(true); }}
          yesterdayRatings={yesterdayRatings}
        />
      )}

      {/* ── История потребностей ── */}
      {showTracker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--bg)', overflowY: 'auto' }}>
          {/* Sticky header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            padding: `${safeTop + 16}px 20px 14px`,
            borderBottom: '1px solid rgba(var(--fg-rgb),0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button
                onClick={() => { setShowTracker(false); setTrackerTab('today'); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: 14, cursor: 'pointer', padding: '0 4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ‹ Назад
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{formatHeaderDate()}</span>
              <button
                onClick={() => { setShowTracker(false); setTrackerTab('today'); setTrackerNeedId(null); setShowTrackerOverlay(true); }}
                style={{
                  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface-2))',
                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                  borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'inherit',
                }}
              >
                Оценить →
              </button>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)', lineHeight: 1.1 }}>
              История потребностей
            </h1>
          </div>

          {(
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
                    setShowTracker(false);
                    setTrackerNeedId(null);
                    setShowTrackerOverlay(true);
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
            <TrackerOverlay
              needs={needs} ratings={{}} saved={{}}
              onChange={() => {}} onSaved={() => {}}
              date={YESTERDAY_DATE}
              onClose={() => { setShowYesterdaySheet(false); }}
              onDone={() => {
                setShowYesterdaySheet(false);
                setHistoryLoading(true);
                api.history(historyDays).then(h => setHistory(fillHistoryGaps(h))).finally(() => setHistoryLoading(false));
              }}
            />
          )}
          {backfillDate && (
            <TrackerOverlay
              needs={needs} ratings={{}} saved={{}}
              onChange={() => {}} onSaved={() => {}}
              date={backfillDate}
              onClose={() => { setBackfillDate(null); }}
              onDone={() => {
                setBackfillDate(null);
                setHistoryLoading(true);
                api.history(historyDays).then(h => setHistory(fillHistoryGaps(h))).finally(() => setHistoryLoading(false));
              }}
            />
          )}
        </div>
      )}

      {/* ── Diaries overlay ── */}
      {showDiaries && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--bg)', overflowY: 'auto' }}>
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

      {showTrackerGoal && (
        <TaskCreateSheet
          defaultType="tracker_streak"
          onCreated={() => setShowTrackerGoal(false)}
          onClose={() => setShowTrackerGoal(false)}
        />
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
              <p key={i} style={{ fontSize: 15, color: 'rgba(var(--fg-rgb),0.8)', lineHeight: 1.7, marginBottom: 16 }}>
                {p}
              </p>
            ))}

            <SectionLabel mb={12}>Пять потребностей</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {NEEDS_EXPLAINER.map(n => (
                <div key={n.name} style={{ background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{n.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{n.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>{n.text}</p>
                </div>
              ))}
            </div>

            <div
              onClick={() => { setShowAbout(false); setShowSchemaInfo(true); }}
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>Схема-терапия</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>Схемы, режимы, потребности</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </BottomSheet>
      )}

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} userRole={userRole} displayName={displayName} onNameChanged={setDisplayName} onOpenTherapistCabinet={() => { setShowSettings(false); setTherapistMode(true); }} therapistMode={therapistMode} onToggleTherapistMode={() => switchTherapistMode(!therapistMode)} />}
      {/* therapistMode renders inline in main flow, not as overlay — see below */}
      {showPractices && <PracticesScreen onClose={() => setShowPractices(false)} onOpenTracker={() => { setShowPractices(false); setTrackerNeedId(null); setShowTrackerOverlay(true); }} />}
      {showPlans && <PlansScreen onClose={() => setShowPlans(false)} onOpenTracker={() => { setShowPlans(false); setTrackerNeedId(null); setShowTrackerOverlay(true); }} />}
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
      {!therapistMode && !showTracker && !showDiaries && !showSchemaInfo && !showSettings && !showPractices && !showPlans && !showChildhoodWheel && !newDiaryEntry && (
        <FloatingPill
          onOpenTracker={() => { setTrackerNeedId(null); setShowTrackerOverlay(true); }}
          onOpenSchemaDiary={() => setNewDiaryEntry('schema')}
          onOpenModeDiary={() => setNewDiaryEntry('mode')}
          onOpenGratitude={() => setNewDiaryEntry('gratitude')}
        />
      )}

      {!therapistMode && !showTracker && !showDiaries && !showSchemaInfo && !showSettings && !showPractices && !showPlans && !showChildhoodWheel && !newDiaryEntry && (
        <BottomNav
          section={section}
          onSelect={setSection}
          userRole={userRole}
        />
      )}
    </div>
  );
}
