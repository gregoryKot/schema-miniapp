import { useEffect, useState } from 'react';
import { useSafeTop } from '../utils/safezone';
import { SchemaFlashcard } from '../components/SchemaFlashcard';
import { LetterToSelf } from '../components/LetterToSelf';
import { BeliefCheck } from '../components/BeliefCheck';
import { SafePlace } from '../components/SafePlace';
import { TherapyNote } from '../components/TherapyNote';
import { CHILDHOOD_DONE_KEY } from '../components/ChildhoodWheelSheet';
import { TaskCreateSheet, getTaskDisplayText } from '../components/TaskCreateSheet';
import { SchemaIntroSheet } from '../components/SchemaIntroSheet';
import { ModeIntroSheet } from '../components/ModeIntroSheet';
import { api, UserTask, TherapyRelationInfo } from '../api';
import { BottomSheet } from '../components/BottomSheet';
import { SectionLabel } from '../components/SectionLabel';
import { fmtDate } from '../utils/format';
import { ALL_SCHEMAS, ALL_MODES } from '../schemaTherapyData';

interface Props {
  onOpenChildhoodWheel: () => void;
  onOpenPractices: () => void;
  onOpenPlans: () => void;
  onOpenTracker: () => void;
  onOpenDiaries: () => void;
  practiceCount?: number | null;
  planCount?: number | null;
  refreshKey?: number;
  initialTasks?: UserTask[] | null;
  onTasksChanged?: () => void;
  userRole?: 'CLIENT' | 'THERAPIST';
  onOpenTherapistCabinet?: () => void;
}

function ToolCard({ emoji, label, sub, onClick, accentColor }: { emoji: string; label: string; sub?: string; onClick: () => void; accentColor?: string }) {
  return (
    <div
      onClick={onClick}
      className="card"
      style={{ cursor: 'pointer', padding: '18px 16px', borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 8, WebkitTapHighlightColor: 'transparent' }}
    >
      <span style={{ fontSize: 30, lineHeight: 1 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: accentColor || 'var(--text)', lineHeight: 1.3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}


const TASK_EMOJI: Record<string, string> = {
  diary_streak: '📔', tracker_streak: '📊', belief_check: '🔍',
  letter_to_self: '✉️', safe_place: '🏡', childhood_wheel: '🌱',
  flashcard: '🆘', schema_intro: '🧩', mode_intro: '🔄', custom: '✏️',
};

// Resolve display text for tasks that may have raw IDs as text
function resolveTaskDisplayText(task: UserTask): string {
  const text = getTaskDisplayText(task.type, task.text);
  // If still raw (didn't resolve via type), try ID lookup
  if (text === task.text) {
    const schema = ALL_SCHEMAS.find(s => s.id === task.text);
    if (schema) return `Карточка схемы: ${schema.name}`;
    const mode = ALL_MODES.find(m => m.id === task.text);
    if (mode) return `Карточка режима: ${mode.name}`;
  }
  return text;
}

function resolveTaskEmoji(task: UserTask): string {
  if (TASK_EMOJI[task.type]) return TASK_EMOJI[task.type];
  // Fallback: check if text is a schema or mode ID
  if (ALL_SCHEMAS.some(s => s.id === task.text)) return '🧩';
  if (ALL_MODES.some(m => m.id === task.text)) return '🔄';
  return '⏳';
}

function TaskRow({ task, onOpen, onComplete }: { task: UserTask; onOpen: () => void; onComplete?: () => void }) {
  const isStreakTask = task.type === 'diary_streak' || task.type === 'tracker_streak';
  const isAssigned = task.assignedBy !== null;
  const [completing, setCompleting] = useState(false);
  const emoji = task.doneToday ? '✅' : resolveTaskEmoji(task);

  return (
    <div
      onClick={task.doneToday ? undefined : onOpen}
      style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(var(--fg-rgb),0.04)',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: task.doneToday ? 'default' : 'pointer',
        opacity: task.doneToday ? 0.55 : 1,
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 20, flexShrink: 0, width: 24, textAlign: 'center' }}>
        {emoji}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isAssigned && !task.doneToday && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>
            от терапевта
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>
          {resolveTaskDisplayText(task)}
        </div>
        {task.doneToday && isStreakTask && (
          <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 2 }}>Сделано сегодня — завтра снова</div>
        )}
        <TaskProgressBar task={task} />
        {task.dueDate && <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>до {fmtDate(task.dueDate)}</div>}
      </div>

      {/* Action */}
      {!task.doneToday && task.done === null && task.type === 'custom' && onComplete ? (
        <button
          disabled={completing}
          onClick={e => { e.stopPropagation(); setCompleting(true); onComplete(); }}
          style={{ background: 'color-mix(in srgb, var(--accent-green) 14%, transparent)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'var(--accent-green)', fontSize: 12, fontWeight: 600, cursor: completing ? 'default' : 'pointer', flexShrink: 0, opacity: completing ? 0.5 : 1 }}
        >
          {completing ? '...' : 'Готово'}
        </button>
      ) : !task.doneToday && task.type !== 'custom' ? (
        <span style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0, opacity: 0.5 }}>›</span>
      ) : null}
    </div>
  );
}

function TaskProgressBar({ task }: { task: UserTask }) {
  if (task.type === 'custom' || !task.targetDays) return null;
  const target = task.targetDays;
  // Use server-computed progress (actual days done) if available, else fall back to elapsed days
  const progress = task.progress !== undefined ? Math.min(task.progress, target) : 0;
  const pct = target > 0 ? (progress / target) * 100 : 0;
  return (
    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(var(--fg-rgb),0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{progress}/{target}</span>
    </div>
  );
}

export function HelpSection({ onOpenChildhoodWheel, onOpenPractices, onOpenPlans, onOpenTracker, onOpenDiaries, practiceCount, planCount, refreshKey, initialTasks, onTasksChanged, userRole, onOpenTherapistCabinet }: Props) {
  const safeTop = useSafeTop();
  const childhoodDone = !!localStorage.getItem(CHILDHOOD_DONE_KEY);

  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showBeliefCheck, setShowBeliefCheck] = useState(false);
  const [showLetterToSelf, setShowLetterToSelf] = useState(false);
  const [showSafePlace, setShowSafePlace] = useState(false);
  const [introSchemaId, setIntroSchemaId] = useState<string | null>(null);
  const [introModeId, setIntroModeId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [tasks, setTasks] = useState<UserTask[]>(initialTasks ?? []);
  const [taskHistory, setTaskHistory] = useState<UserTask[]>([]);
  const [relation, setRelation] = useState<TherapyRelationInfo | null | undefined>(initialTasks !== undefined ? null : undefined);

  useEffect(() => {
    if (initialTasks !== undefined) setTasks(initialTasks ?? []);
  }, [initialTasks]);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.getTasks(), api.getTaskHistory()]).then(([t, h]) => {
      if (!ignore) { setTasks(t); setTaskHistory(h); }
    }).catch(() => {});
    api.getTherapyRelation().then(r => { if (!ignore) setRelation(r); }).catch(() => { if (!ignore) setRelation(null); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const myTasks = tasks.filter(t => t.assignedBy === null);
  const therapistTasks = tasks.filter(t => t.assignedBy !== null);

  function openTask(task: UserTask) {
    if (task.assignedBy !== null && task.type !== 'custom') {
      setActiveTaskId(task.id);
    }
    switch (task.type) {
      case 'diary_streak':    onOpenDiaries(); break;
      case 'tracker_streak':  onOpenTracker(); break;
      case 'belief_check':    setShowBeliefCheck(true); break;
      case 'letter_to_self':  setShowLetterToSelf(true); break;
      case 'safe_place':      setShowSafePlace(true); break;
      case 'childhood_wheel': onOpenChildhoodWheel(); break;
      case 'flashcard':       setShowFlashcard(true); break;
      case 'schema_intro':    if (task.text) setIntroSchemaId(task.text); break;
      case 'mode_intro':      if (task.text) setIntroModeId(task.text); break;
      default:
        // Fallback: if text is a raw schema/mode ID (old task format)
        if (ALL_SCHEMAS.some(s => s.id === task.text)) { setIntroSchemaId(task.text); break; }
        if (ALL_MODES.some(m => m.id === task.text)) { setIntroModeId(task.text); break; }
        break;
    }
  }

  function handleTaskComplete() {
    if (activeTaskId === null) return;
    const taskId = activeTaskId;
    setActiveTaskId(null);
    api.completeTask(taskId, true)
      .then(() => Promise.all([api.getTasks(), api.getTaskHistory()]))
      .then(([t, h]) => { setTasks(t); setTaskHistory(h); onTasksChanged?.(); })
      .catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Помощь</div>
        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4, lineHeight: 1.5 }}>
          Инструменты и упражнения
        </div>
        {/* Next session banner for clients */}
        {relation?.role === 'client' && relation.nextSession && (() => {
          const [datePart, timePart] = relation.nextSession.includes('T') ? relation.nextSession.split('T') : [relation.nextSession, null];
          const [y, m, d] = datePart.split('-').map(Number);
          const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
          const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
          const date = new Date(y, m - 1, d);
          const label = `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}${timePart ? ` · ${timePart}` : ''}`;
          const isToday = datePart === new Date().toISOString().slice(0, 10);
          return (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, background: isToday ? 'color-mix(in srgb, var(--accent-green) 10%, transparent)' : 'rgba(var(--fg-rgb),0.05)', border: `1px solid ${isToday ? 'color-mix(in srgb, var(--accent-green) 25%, transparent)' : 'rgba(var(--fg-rgb),0.1)'}`, borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ fontSize: 13 }}>📅</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: isToday ? 'var(--accent-green)' : 'rgba(var(--fg-rgb),0.6)' }}>
                {isToday ? 'Сегодня встреча' : `Встреча: ${label}`}
              </span>
              {relation.partnerName && <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>с {relation.partnerName}</span>}
            </div>
          );
        })()}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>


        {/* 2-column tool grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ToolCard emoji="🎯" label="Мои цели" sub={tasks.length === 0 ? 'Нет активных' : `${tasks.length} ${plural(tasks.length, 'цель', 'цели', 'целей')}`} accentColor="var(--accent-orange)" onClick={() => setShowAllTasks(true)} />
          <ToolCard emoji="🗂" label="Практики" sub={practiceCount == null ? undefined : practiceCount === 0 ? 'Нет практик' : `${practiceCount} ${plural(practiceCount, 'практика', 'практики', 'практик')}`} accentColor="var(--accent)" onClick={onOpenPractices} />
          <ToolCard emoji="🗓" label="Планы" sub={planCount == null ? undefined : planCount === 0 ? 'История пуста' : `${planCount} ${plural(planCount, 'план', 'плана', 'планов')}`} accentColor="var(--accent-blue)" onClick={onOpenPlans} />
          <ToolCard emoji="🔍" label="Проверка убеждений" sub="Правда ли это?" accentColor="var(--accent-yellow)" onClick={() => setShowBeliefCheck(true)} />
          <ToolCard emoji="🏡" label="Безопасное место" sub="Ресурс в тревожный момент" accentColor="var(--accent-green)" onClick={() => setShowSafePlace(true)} />
          <ToolCard emoji="✉️" label="Письмо себе" sub="Уязвимому Ребёнку" accentColor="var(--accent-pink)" onClick={() => setShowLetterToSelf(true)} />
          <ToolCard emoji="🆘" label="Мне плохо" sub="5 шагов чтобы разобраться" accentColor="var(--accent-red)" onClick={() => setShowFlashcard(true)} />
          <ToolCard emoji="🌱" label="Колесо детства" sub={childhoodDone ? 'Паттерны из прошлого' : 'Займёт 2 минуты'} accentColor="var(--accent-green)" onClick={onOpenChildhoodWheel} />
        </div>

        <div style={{ paddingBottom: 4 }}>
          <TherapyNote compact />
        </div>

      </div>

      {showFlashcard && <SchemaFlashcard onClose={() => setShowFlashcard(false)} onOpenTracker={onOpenTracker} onComplete={handleTaskComplete} />}
      {showBeliefCheck && <BeliefCheck onClose={() => setShowBeliefCheck(false)} onComplete={handleTaskComplete} />}
      {showLetterToSelf && <LetterToSelf onClose={() => setShowLetterToSelf(false)} onComplete={handleTaskComplete} />}
      {showSafePlace && <SafePlace onClose={() => setShowSafePlace(false)} onComplete={handleTaskComplete} />}
      {introSchemaId && <SchemaIntroSheet schemaId={introSchemaId} onClose={() => setIntroSchemaId(null)} onComplete={() => { setIntroSchemaId(null); handleTaskComplete(); }} />}
      {introModeId && <ModeIntroSheet modeId={introModeId} onClose={() => setIntroModeId(null)} onComplete={() => { setIntroModeId(null); handleTaskComplete(); }} />}
      {showTaskCreate && (
        <TaskCreateSheet
          onCreated={() => {
            setShowTaskCreate(false);
            Promise.all([api.getTasks(), api.getTaskHistory()]).then(([t, h]) => { setTasks(t); setTaskHistory(h); onTasksChanged?.(); }).catch(() => {});
          }}
          onClose={() => setShowTaskCreate(false)}
        />
      )}
      {showAllTasks && (
        <BottomSheet onClose={() => setShowAllTasks(false)} zIndex={200}>
          <SectionLabel purple mb={16}>Мои цели</SectionLabel>
          {tasks.length === 0 ? (
            <div style={{ color: 'var(--text-sub)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Нет активных целей
            </div>
          ) : tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={() => openTask(task)}
              onComplete={task.done === null && task.type === 'custom'
                ? () => api.completeTask(task.id, true)
                    .then(() => Promise.all([api.getTasks(), api.getTaskHistory()]))
                    .then(([t, h]) => { setTasks(t); setTaskHistory(h); onTasksChanged?.(); })
                    .catch(() => {})
                : undefined}
            />
          ))}
          {taskHistory.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-faint)', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Выполнено</div>
              {taskHistory.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(var(--fg-rgb),0.04)', opacity: 0.5 }}>
                  <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: 'center' }}>{task.done === true ? '✅' : '❌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35 }}>{resolveTaskDisplayText(task)}</div>
                    {task.completedAt && <div style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: 1 }}>{fmtDate(new Date(task.completedAt).toISOString().slice(0, 10))}</div>}
                  </div>
                </div>
              ))}
            </>
          )}
          <button
            onClick={() => { setShowAllTasks(false); setShowTaskCreate(true); }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}
          >
            + Поставить цель
          </button>
        </BottomSheet>
      )}
    </div>
  );
}
