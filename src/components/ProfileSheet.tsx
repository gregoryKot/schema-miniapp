import { useState, useEffect, useRef } from 'react';
import { api, UserSettings, Achievement, PracticePlan, UserPractice } from '../api';
import { ChildhoodWheelSheet, CHILDHOOD_DONE_KEY } from './ChildhoodWheelSheet';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from './YSQTestSheet';
import { NEED_DATA } from '../needData';
import { COLORS } from '../types';
import { BottomSheet } from './BottomSheet';
import { Loader } from './Loader';
import { SectionLabel } from './SectionLabel';

type StreakData = { currentStreak: number; longestStreak: number; totalDays: number; todayDone: boolean; weekDots: boolean[] };
type InsightsData = { weeklyStats: Array<{ needId: string; avg: number | null; trend: '↑' | '↓' | '→' }>; bestDayOfWeek: string | null; worstDayOfWeek: string | null; totalDays: number };
import { PairsData } from '../api';

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];

const NEED_NAMES: Record<string, string> = {
  attachment: 'Привязанность', autonomy: 'Автономия',
  expression: 'Выражение чувств', play: 'Спонтанность', limits: 'Границы',
};

const ACHIEVEMENT_META: Record<string, { emoji: string; title: string; desc: string }> = {
  first_day:  { emoji: '🌱', title: 'Первый шаг',   desc: 'Заполнил дневник первый раз' },
  streak_3:   { emoji: '🔥', title: 'Начало серии', desc: '3 дня подряд' },
  streak_7:   { emoji: '⭐', title: 'Неделя',        desc: '7 дней подряд' },
  streak_14:  { emoji: '💫', title: 'Две недели',    desc: '14 дней подряд' },
  streak_30:  { emoji: '🏆', title: 'Месяц',         desc: '30 дней подряд' },
  streak_100: { emoji: '👑', title: 'Сотня',         desc: '100 дней подряд' },
  total_10:   { emoji: '📅', title: '10 дней',       desc: '10 дней всего' },
  total_50:   { emoji: '📆', title: '50 дней',       desc: '50 дней всего' },
  high_day:   { emoji: '✨', title: 'Хороший день',  desc: 'Средний индекс выше 8' },
  all_above7: { emoji: '🎯', title: 'Баланс',        desc: 'Все потребности выше 7 в один день' },
  comeback:   { emoji: '🔄', title: 'Возвращение',   desc: 'Вернулся после перерыва в 3+ дня' },
  growth:     { emoji: '📈', title: 'Рост',          desc: 'Потребность выросла на 3+ за неделю' },
};

const TIMEZONES = [
  { label: 'UTC−8 (Лос-Анджелес)', offset: -8 },
  { label: 'UTC−5 (Нью-Йорк)',      offset: -5 },
  { label: 'UTC+0 (Лондон)',         offset:  0 },
  { label: 'UTC+1 (Берлин)',         offset:  1 },
  { label: 'UTC+2 (Киев, Израиль)', offset:  2 },
  { label: 'UTC+3 (Москва)',         offset:  3 },
  { label: 'UTC+4 (Дубай)',          offset:  4 },
  { label: 'UTC+5 (Ташкент)',        offset:  5 },
  { label: 'UTC+6 (Алматы)',         offset:  6 },
  { label: 'UTC+8 (Пекин)',          offset:  8 },
];

const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

function toLocal(utcHour: number, tz: number) { return ((utcHour + tz) % 24 + 24) % 24; }
function toUtc(localHour: number, tz: number)  { return ((localHour - tz) % 24 + 24) % 24; }
function pad(n: number) { return String(n).padStart(2, '0'); }

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 44, height: 26, borderRadius: 13, flexShrink: 0,
      background: on ? '#a78bfa' : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
    }}>
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <span onClick={onBack} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
      <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{title}</span>
    </div>
  );
}

type View = 'main' | 'time' | 'tz' | 'achievements' | 'pair' | 'plans' | 'myPractices' | 'childhoodWheel';

interface Props { onClose: () => void; onOpenSchemas?: () => void; onChildhoodSaved?: (r: Record<string, number>) => void; childhoodRatings?: Record<string, number> }

export function ProfileSheet({ onClose, onOpenSchemas, onChildhoodSaved, childhoodRatings: childhoodRatingsProp }: Props) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [pairData, setPairData] = useState<PairsData | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairInviteUrl, setPairInviteUrl] = useState('');
  const [pairInviteCopied, setPairInviteCopied] = useState(false);
  const [planHistory, setPlanHistory] = useState<PracticePlan[] | null>(null);
  const [myPracticesNeedIdx, setMyPracticesNeedIdx] = useState(0);
  const [myPractices, setMyPractices] = useState<UserPractice[] | null>(null);
  const [myPracticesInput, setMyPracticesInput] = useState('');
  const [myPracticesSaving, setMyPracticesSaving] = useState(false);
  const [showChildhoodWheel, setShowChildhoodWheel] = useState(false);
  const childhoodDone = (childhoodRatingsProp && Object.keys(childhoodRatingsProp).length > 0) || !!localStorage.getItem(CHILDHOOD_DONE_KEY);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinView, setJoinView] = useState<'main' | 'join'>('main');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [showBestDayInfo, setShowBestDayInfo] = useState(false);
  const [showNotifyInfo, setShowNotifyInfo] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [view, setView] = useState<View>('main');
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings({ notifyEnabled: false, notifyUtcHour: 9, notifyTzOffset: 0, notifyReminderEnabled: false, pairCardDismissed: false }));
    api.getStreak().then(setStreak).catch(() => setStreak({ currentStreak: 0, longestStreak: 0, totalDays: 0, todayDone: false, weekDots: [] }));
    api.getAchievements().then(setAchievements).catch(() => setAchievements([]));
    api.getInsights().then(setInsights).catch(() => setInsights(null));
  }, []);

  function loadMyPractices(idx: number) {
    const needId = NEED_IDS[idx];
    if (!needId) return;
    api.getPractices(needId).then(setMyPractices).catch(() => setMyPractices([]));
  }

  function goTo(v: View) {
    savedScrollTop.current = scrollRef.current?.scrollTop ?? 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (v === 'pair' && !pairData) {
      setPairLoading(true);
      api.getPair().then(setPairData).catch(() => {}).finally(() => setPairLoading(false));
    }
    if (v === 'plans' && !planHistory) {
      api.getPlanHistory(30).then(setPlanHistory).catch(() => setPlanHistory([]));
    }
    if (v === 'myPractices') {
      setMyPractices(null);
      setMyPracticesNeedIdx(0);
      loadMyPractices(0);
    }
    setView(v);
  }

  function goBack() {
    setView('main');
    setJoinView('main');
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = savedScrollTop.current;
    });
  }

  async function patch(update: Partial<UserSettings>) {
    if (!settings) return;
    setSettings({ ...settings, ...update });
    await api.updateSettings(update).catch(() => {});
  }

  async function handleCreateInvite() {
    setPairLoading(true);
    try {
      const { url } = await api.createPairInvite();
      await api.getPair().then(setPairData);
      setPairInviteUrl(url);
      try { if (navigator.share) await navigator.share({ text: `Давай отслеживать потребности вместе! ${url}` }); } catch {}
    } finally {
      setPairLoading(false);
    }
  }

  async function handleCopyPairInvite() {
    try {
      await navigator.clipboard.writeText(pairInviteUrl);
      setPairInviteCopied(true);
      setTimeout(() => setPairInviteCopied(false), 2000);
    } catch {}
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setPairLoading(true);
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      await api.getPair().then(setPairData);
      setJoinView('main');
    } catch {}
    setPairLoading(false);
  }

  async function handleLeave(code: string) {
    await api.leavePair(code).catch(() => {});
    await api.getPair().then(setPairData).catch(() => {});
  }

  if (!settings) {
    return <BottomSheet onClose={onClose}><Loader minHeight="40vh" /></BottomSheet>;
  }

  const localHour = toLocal(settings.notifyUtcHour, settings.notifyTzOffset);
  const tzLabel = TIMEZONES.find(t => t.offset === settings.notifyTzOffset)?.label ?? `UTC+${settings.notifyTzOffset}`;
  const hasInsights = insights && insights.weeklyStats.some(s => s.avg !== null);
  const risingNeed = insights?.weeklyStats.find(s => s.trend === '↑');
  const insightSummary = insights?.bestDayOfWeek && insights.totalDays >= 7
    ? `Лучший день — ${insights.bestDayOfWeek}`
    : risingNeed ? `${NEED_NAMES[risingNeed.needId]} растёт` : 'Заполняй дневник каждый день';

  const selMeta = selectedAchievement ? ACHIEVEMENT_META[selectedAchievement] : null;

  return (
    <>
    <BottomSheet onClose={() => { goBack(); onClose(); }} scrollRef={scrollRef}>

      {/* ── MAIN VIEW ── */}
      {view === 'main' && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Профиль</div>

          {/* Streak */}
          {streak && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Серия</SectionLabel>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 44, lineHeight: 1 }}>{streak.todayDone ? '🔥' : streak.currentStreak > 0 ? '🫥' : '🌱'}</div>
                  <div>
                    {streak.currentStreak > 0 ? (
                      <>
                        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{streak.currentStreak}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {streak.currentStreak === 1 ? 'день подряд' : streak.currentStreak < 5 ? 'дня подряд' : 'дней подряд'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
                          {streak.totalDays === 0 ? 'Начни сегодня' : 'Серия прервалась'}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                          {streak.totalDays === 0 ? 'Первая запись — самая важная' : 'Заполни дневник — и серия начнётся'}
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      Рекорд: <span style={{ color: '#ffd166', fontWeight: 600 }}>{streak.longestStreak}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      Всего: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{streak.totalDays}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {streak.weekDots.map((done, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: done ? (i === 6 ? '#ffd166' : '#a78bfa') : 'rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: done ? 14 : 0,
                      }}>{done && '✓'}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{DOW[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                {!streak.todayDone && streak.currentStreak > 0
                  ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Заполни дневник сегодня, чтобы не потерять серию</div>
                  : <div />
                }
                {streak.currentStreak > 0 && (
                  <button
                    onClick={async () => {
                      const n = streak.currentStreak;
                      const d = n === 1 ? 'день' : n < 5 ? 'дня' : 'дней';
                      const text = `🔥 ${n} ${d} подряд в дневнике потребностей!\n\nОтслеживаю своё состояние каждый день. t.me/Emotional_Needs_bot`;
                      try { if (navigator.share) { await navigator.share({ text }); } else { await navigator.clipboard.writeText(text); } } catch { try { await navigator.clipboard.writeText(text); } catch {} }
                    }}
                    style={{
                      background: 'rgba(167,139,250,0.15)', border: 'none', borderRadius: 20,
                      padding: '5px 12px', color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >Поделиться</button>
                )}
              </div>
            </div>
          )}

          {/* Achievements row */}
          {achievements && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Достижения</SectionLabel>
              <div
                onClick={() => goTo('achievements')}
                style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                  {achievements.slice(0, 8).map(a => (
                    <span key={a.id} style={{ fontSize: 20, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.25)' }}>
                      {(ACHIEVEMENT_META[a.id] ?? {}).emoji}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                    {achievements.filter(a => a.earned).length}/{achievements.length}
                  </span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }}>›</span>
                </div>
              </div>
            </div>
          )}

          {/* Паттерны */}
          {hasInsights && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Паттерны</SectionLabel>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden' }}>
                <div
                  onClick={() => setInsightsOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{insightSummary}</span>
                  <span style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.25)', display: 'inline-block',
                    transform: insightsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s',
                  }}>›</span>
                </div>
                {insightsOpen && (
                  <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {(insights!.bestDayOfWeek || insights!.worstDayOfWeek) && insights!.totalDays >= 7 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                        {insights!.bestDayOfWeek && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                              Лучше всего — <span style={{ color: '#ffd166', fontWeight: 600 }}>{insights!.bestDayOfWeek}</span>
                            </span>
                            <span
                              onClick={e => { e.stopPropagation(); setShowBestDayInfo(true); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 14, height: 14, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
                                fontSize: 8, fontWeight: 600, cursor: 'pointer',
                              }}
                            >?</span>
                          </div>
                        )}
                        {insights!.worstDayOfWeek && (
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            Тяжелее — <span style={{ color: '#f87171', fontWeight: 600 }}>{insights!.worstDayOfWeek}</span>
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {insights!.weeklyStats.filter(s => s.avg !== null).map(s => {
                        const trendColor = s.trend === '↑' ? '#4ade80' : s.trend === '↓' ? '#f87171' : 'rgba(255,255,255,0.25)';
                        const barW = Math.round(((s.avg ?? 0) / 10) * 100);
                        return (
                          <div key={s.needId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{NEED_NAMES[s.needId]}</span>
                              <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>{(s.avg ?? 0).toFixed(1)} {s.trend}</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${barW}%`, background: 'rgba(167,139,250,0.5)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Вместе */}
          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Вместе</SectionLabel>
            <div
              onClick={() => goTo('pair')}
              style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>🤝</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>Отслеживать вместе</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  Пригласи друга — видите индексы друг друга
                </div>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
            </div>
          </div>

          {/* Практики */}
          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Практики</SectionLabel>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden' }}>
              <div
                onClick={() => goTo('myPractices')}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ fontSize: 22 }}>🗂</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>Мои практики</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    Что помогает — на случай трудного дня
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
              </div>
              <div
                onClick={() => goTo('plans')}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: 22 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>История планов</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    Что планировал, что сделал
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
              </div>
              <div
                onClick={() => setShowChildhoodWheel(true)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: 22 }}>🌱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>Колесо детства</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {childhoodDone ? 'Оценки потребностей в детстве' : 'Не заполнено — займёт 2 минуты'}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: childhoodDone ? 'rgba(255,255,255,0.2)' : '#a78bfa' }}>›</span>
              </div>
            </div>
          </div>

          {/* Уведомления */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <SectionLabel>Уведомления</SectionLabel>
            <span
              onClick={() => setShowNotifyInfo(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
                fontSize: 8, fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginBottom: 10,
              }}
            >?</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', marginBottom: settings.notifyEnabled ? 8 : 16 }}>
            <div onClick={() => patch({ notifyEnabled: !settings.notifyEnabled })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 15, color: '#fff' }}>Итоги дня</span>
              <Toggle on={settings.notifyEnabled} onClick={() => patch({ notifyEnabled: !settings.notifyEnabled })} />
            </div>
            <div onClick={() => settings.notifyEnabled && setView('time')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: settings.notifyEnabled ? 'pointer' : 'default', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: settings.notifyEnabled ? 1 : 0.35 }}>
              <span style={{ fontSize: 15, color: '#fff' }}>Время</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>{pad(localHour)}:00</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
              </div>
            </div>
            <div onClick={() => settings.notifyEnabled && setView('tz')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: settings.notifyEnabled ? 'pointer' : 'default', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: settings.notifyEnabled ? 1 : 0.35 }}>
              <span style={{ fontSize: 15, color: '#fff' }}>Часовой пояс</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'right', maxWidth: 160 }}>{tzLabel}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
              </div>
            </div>
          </div>

          {settings.notifyEnabled && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 16, padding: '0 4px' }}>
              Уведомления приходят через бот — убедись, что{' '}
              <a href="https://t.me/Emotional_Needs_bot" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }}>@Emotional_Needs_bot</a>
              {' '}запущен в Telegram
            </div>
          )}

          {/* Invite + Export */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={async () => {
                const text = 'Дневник потребностей — отслеживай своё состояние каждый день. t.me/Emotional_Needs_bot';
                try { if (navigator.share) { await navigator.share({ text }); } else { await navigator.clipboard.writeText(text); } } catch { try { await navigator.clipboard.writeText(text); } catch {} }
              }}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >Пригласить друга</button>
            <button
              onClick={async () => {
                const { text } = await api.getExport();
                let shared = false;
                try { if (navigator.share) { await navigator.share({ text }); shared = true; } } catch {}
                if (!shared) { try { await navigator.clipboard.writeText(text); } catch {} setExportText(text); }
              }}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Для терапевта</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>сводка за 30 дней</span>
            </button>
          </div>

          {/* Privacy section */}
          <div style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Конфиденциальность</div>
            <div
              onClick={() => setShowPrivacy(true)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer', marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>О данных и конфиденциальности</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TIME VIEW ── */}
      {view === 'time' && (
        <div style={{ paddingTop: 8 }}>
          <BackHeader title="Время уведомления" onBack={goBack} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {HOURS.map(h => {
              const active = h === localHour;
              return (
                <div key={h} onClick={async () => { await patch({ notifyUtcHour: toUtc(h, settings.notifyTzOffset) }); goBack(); }}
                  style={{ padding: '12px 0', borderRadius: 12, textAlign: 'center', background: active ? '#a78bfa' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: active ? 600 : 400, cursor: 'pointer' }}
                >{pad(h)}:00</div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TZ VIEW ── */}
      {view === 'tz' && (
        <div style={{ paddingTop: 8 }}>
          <BackHeader title="Часовой пояс" onBack={goBack} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TIMEZONES.map(tz => {
              const active = tz.offset === settings.notifyTzOffset;
              return (
                <div key={tz.offset} onClick={async () => { await patch({ notifyTzOffset: tz.offset, notifyUtcHour: toUtc(localHour, tz.offset) }); goBack(); }}
                  style={{ padding: '13px 16px', borderRadius: 12, background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#a78bfa' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >{tz.label}{active && <span>✓</span>}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS VIEW ── */}
      {view === 'achievements' && achievements && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span onClick={goBack} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#fff', flex: 1 }}>Достижения</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {achievements.filter(a => a.earned).length}/{achievements.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {achievements.map(a => {
              const m = ACHIEVEMENT_META[a.id];
              if (!m) return null;
              return (
                <div key={a.id} onClick={() => a.earned && setSelectedAchievement(a.id)}
                  style={{
                    background: a.earned ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${a.earned ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 16, padding: '14px 12px', cursor: a.earned ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>{m.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? '#fff' : 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: a.earned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', lineHeight: 1.4 }}>{m.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PLANS VIEW ── */}
      {view === 'plans' && (
        <div style={{ paddingTop: 8 }}>
          <BackHeader title="История планов" onBack={goBack} />
          {!planHistory ? (
            <Loader minHeight="30vh" />
          ) : planHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Планов пока нет.<br />Создай первый из дневника.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planHistory.map(plan => (
                <div key={plan.id} style={{
                  background: plan.done === true ? 'rgba(6,214,160,0.07)' : plan.done === false ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${plan.done === true ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{plan.scheduledDate}</div>
                    <div style={{ fontSize: 13 }}>
                      {plan.done === true ? '✅' : plan.done === false ? '❌' : '⏳'}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                    {plan.practiceText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY PRACTICES VIEW ── */}
      {view === 'myPractices' && (
        <div style={{ paddingTop: 8 }}>
          <BackHeader title="Мои практики" onBack={goBack} />
          {/* Need tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
            {NEED_IDS.map((id, i) => {
              const color = COLORS[id] ?? '#888';
              const emoji = NEED_DATA[id]?.emoji ?? '';
              const active = i === myPracticesNeedIdx;
              return (
                <div
                  key={id}
                  onClick={() => {
                    setMyPracticesNeedIdx(i);
                    setMyPractices(null);
                    setMyPracticesInput('');
                    loadMyPractices(i);
                  }}
                  style={{
                    flexShrink: 0, padding: '7px 12px', borderRadius: 20,
                    background: active ? color + '28' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? color + '55' : 'transparent'}`,
                    color: active ? color : 'rgba(255,255,255,0.45)',
                    fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {emoji} {NEED_NAMES[id]}
                </div>
              );
            })}
          </div>

          {/* Practices list */}
          {!myPractices ? (
            <Loader minHeight="20vh" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {myPractices.length === 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>
                  Пока пусто — добавь что-нибудь ниже
                </div>
              )}
              {myPractices.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '11px 14px',
                }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 1.45 }}>
                    {p.text}
                  </div>
                  <div
                    onClick={() => {
                      setMyPractices(prev => prev?.filter(x => x.id !== p.id) ?? null);
                      api.deletePractice(p.id).catch(e => console.error('deletePractice failed', e));
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(255,100,100,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 15, color: 'rgba(255,100,100,0.5)',
                    }}
                  >×</div>
                </div>
              ))}
            </div>
          )}

          {/* Add input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={myPracticesInput}
              onChange={e => setMyPracticesInput(e.target.value)}
              onKeyDown={async e => {
                if (e.key !== 'Enter') return;
                const text = myPracticesInput.trim();
                if (!text || myPracticesSaving) return;
                setMyPracticesSaving(true);
                try {
                  await api.addPractice(NEED_IDS[myPracticesNeedIdx], text);
                  setMyPracticesInput('');
                  loadMyPractices(myPracticesNeedIdx);
                } catch { /* silent */ }
                setMyPracticesSaving(false);
              }}
              placeholder="Добавить практику..."
              maxLength={200}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '11px 14px',
                color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={async () => {
                const text = myPracticesInput.trim();
                if (!text || myPracticesSaving) return;
                setMyPracticesSaving(true);
                try {
                  await api.addPractice(NEED_IDS[myPracticesNeedIdx], text);
                  setMyPracticesInput('');
                  loadMyPractices(myPracticesNeedIdx);
                } catch { /* silent */ }
                setMyPracticesSaving(false);
              }}
              disabled={!myPracticesInput.trim() || myPracticesSaving}
              style={{
                padding: '11px 16px', borderRadius: 12, border: 'none',
                background: myPracticesInput.trim() ? COLORS[NEED_IDS[myPracticesNeedIdx]] ?? '#a78bfa' : 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >+</button>
          </div>
        </div>
      )}

      {/* ── PAIR VIEW ── */}
      {view === 'pair' && (
        <div style={{ paddingTop: 8 }}>
          <BackHeader title="Вместе" onBack={goBack} />
          {pairLoading && !pairData ? (
            <Loader minHeight="30vh" />
          ) : !pairData ? null : pairData.partners.length > 0 ? (
            <div>
              {pairData.partners.map(p => (
                <div key={p.code} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{p.partnerName ?? 'Друг'} сегодня</div>
                  {p.partnerTodayDone && p.partnerIndex !== null ? (
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                      {p.partnerIndex.toFixed(1)}
                      <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/10</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Ещё не заполнил дневник</div>
                  )}
                  <button onClick={() => handleLeave(p.code)}
                    style={{ width: '100%', padding: 12, border: 'none', borderRadius: 12, background: 'rgba(255,100,100,0.1)', color: 'rgba(255,100,100,0.7)', fontSize: 14, cursor: 'pointer' }}
                  >Выйти из пары</button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                Приглашай друга или партнёра — видите индексы дня друг друга. Не детали, только число. Просто знать, как день у другого.
              </p>
              {joinView === 'main' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={handleCreateInvite} disabled={pairLoading}
                    style={{ padding: 14, border: 'none', borderRadius: 12, background: '#a78bfa', color: '#fff', fontSize: 14, fontWeight: 600, cursor: pairLoading ? 'default' : 'pointer' }}>
                    {pairLoading ? '...' : pairData.pendingCode ? 'Создать новую ссылку' : 'Создать приглашение'}
                  </button>
                  {pairInviteUrl && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Скопируй и отправь другу:</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 10, userSelect: 'all' }}>
                        {pairInviteUrl}
                      </div>
                      <button onClick={handleCopyPairInvite}
                        style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: pairInviteCopied ? 'rgba(6,214,160,0.2)' : 'rgba(167,139,250,0.2)', color: pairInviteCopied ? '#06d6a0' : '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {pairInviteCopied ? '✓ Скопировано' : 'Скопировать ссылку'}
                      </button>
                    </div>
                  )}
                  <button onClick={() => setJoinView('join')}
                    style={{ padding: 14, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>
                    Есть код приглашения
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span onClick={() => setJoinView('main')} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Ввести код</span>
                  </div>
                  <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Код из приглашения"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, fontFamily: 'monospace', outline: 'none', letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box', marginBottom: 12 }}
                  />
                  <button onClick={handleJoin} disabled={!joinCode.trim() || pairLoading}
                    style={{ width: '100%', padding: 14, border: 'none', borderRadius: 12, background: joinCode.trim() ? '#a78bfa' : 'rgba(167,139,250,0.3)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Присоединиться
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </BottomSheet>

    {/* Achievement overlay — fixed on top, no nested sheet */}
    {selectedAchievement && selMeta && (
      <div onClick={() => setSelectedAchievement(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'fade-in 0.18s ease' }}
      >
        <div onClick={e => e.stopPropagation()}
          style={{ background: 'linear-gradient(145deg, rgba(167,139,250,0.2), rgba(79,163,247,0.1))', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 24, padding: '36px 28px 24px', width: '100%', maxWidth: 320, textAlign: 'center', animation: 'sheet-up 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{selMeta.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{selMeta.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 28 }}>{selMeta.desc}</div>
          <button
            onClick={async () => {
              const text = `${selMeta.emoji} Получил достижение «${selMeta.title}» в дневнике потребностей!\n\nt.me/Emotional_Needs_bot`;
              try { if (navigator.share) { await navigator.share({ text }); } else { await navigator.clipboard.writeText(text); } } catch {}
            }}
            style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >Поделиться</button>
        </div>
      </div>
    )}

    {/* Info overlays — zIndex 300 nested sheets are fine, they're intentionally above */}
    {exportText && (
      <BottomSheet onClose={() => { setExportText(null); setExportCopied(false); }} zIndex={300}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Сводка для терапевта</div>
          <pre style={{
            fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
            background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px',
            overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            marginBottom: 14, userSelect: 'all', fontFamily: 'monospace',
          }}>
            {exportText}
          </pre>
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(exportText); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000); } catch {}
            }}
            style={{
              width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
              background: exportCopied ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.08)',
              color: exportCopied ? '#06d6a0' : 'rgba(255,255,255,0.7)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {exportCopied ? '✓ Скопировано' : 'Скопировать'}
          </button>
        </div>
      </BottomSheet>
    )}

    {showNotifyInfo && (
      <BottomSheet onClose={() => setShowNotifyInfo(false)} zIndex={300}>
        <div style={{ paddingTop: 8 }}>
          <SectionLabel purple mb={16}>Зачем уведомления</SectionLabel>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>Регулярность — это всё. Один раз в день, в одно и то же время, формирует привычку наблюдать за собой. Без неё паттерн не складывается.</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}><b style={{ color: '#fff' }}>Итоги дня</b> — приходят в это же время, если дневник заполнен: твои оценки в виде сводки.</p>
        </div>
      </BottomSheet>
    )}
    {showBestDayInfo && (
      <BottomSheet onClose={() => setShowBestDayInfo(false)} zIndex={300}>
        <div style={{ paddingTop: 8 }}>
          <SectionLabel purple mb={16}>Лучший день</SectionLabel>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>Это день недели, в который твои оценки в среднем выше всего — по всем потребностям сразу.</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>Не значит, что он всегда хороший. Но чаще всего в этот день что-то складывается: отдых, общение, ритм.</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>Считается по всей истории наблюдений, поэтому становится точнее с каждой неделей.</p>
        </div>
      </BottomSheet>
    )}
    {showChildhoodWheel && (
      <ChildhoodWheelSheet
        onClose={() => setShowChildhoodWheel(false)}
        onOpenSchemas={() => { setShowChildhoodWheel(false); onClose(); onOpenSchemas?.(); }}
        onSaved={onChildhoodSaved}
      />
    )}
    {showPrivacy && (
      <BottomSheet onClose={() => setShowPrivacy(false)} zIndex={300}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Данные и конфиденциальность</div>

          <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Что хранится на сервере</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Записи дневника, оценки потребностей, практики, колесо детства. Данные привязаны к твоему Telegram ID и хранятся на защищённом сервере.
            </div>
          </div>

          <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Что хранится на сервере</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Дневник, оценки, заметки, практики, результаты тестов — всё привязано к Telegram-аккаунту и доступно с любого устройства.
            </div>
          </div>

          <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Передача третьим лицам</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Данные не продаются и не передаются рекламным сетям или третьим лицам. Никогда.
            </div>
          </div>

          <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Право на удаление</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Ты можешь в любой момент удалить все данные. Для удаления серверных данных напиши{' '}
              <a href="https://t.me/kotlarewski" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>@kotlarewski</a>.
            </div>
          </div>

          {(!!localStorage.getItem(YSQ_PROGRESS_KEY) || !!localStorage.getItem(YSQ_RESULT_KEY)) && (
          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Удалить данные теста YSQ-R</div>
            <button
              onClick={() => {
                localStorage.removeItem(YSQ_PROGRESS_KEY);
                localStorage.removeItem(YSQ_RESULT_KEY);
                api.deleteYsqResult().catch(() => {});
                setShowPrivacy(false);
              }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Удалить результаты теста
            </button>
          </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Удалить все мои данные</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 10 }}>
              Дневник, оценки, практики, колесо детства — всё будет удалено с сервера. Действие необратимо.
            </div>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Удалить все данные
              </button>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', marginBottom: 12, fontWeight: 500 }}>
                  Уверен(а)? Это нельзя отменить.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        await api.deleteAllUserData();
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      } catch {
                        setDeleting(false);
                        setDeleteConfirm(false);
                      }
                    }}
                    style={{
                      flex: 2, padding: '13px 0', borderRadius: 12, border: 'none',
                      background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'default' : 'pointer',
                    }}
                  >
                    {deleting ? 'Удаляем...' : 'Да, удалить всё'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, textAlign: 'center' }}>
            Разработано для образовательных целей. Не является медицинским или психологическим сервисом.
          </div>
        </div>
      </BottomSheet>
    )}
    </>
  );
}
