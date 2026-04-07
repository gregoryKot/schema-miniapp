import { useEffect, useState } from 'react';
import { getTelegramSafeTop } from '../utils/safezone';
import { SchemaFlashcard } from '../components/SchemaFlashcard';
import { LetterToSelf } from '../components/LetterToSelf';
import { BeliefCheck } from '../components/BeliefCheck';
import { SafePlace } from '../components/SafePlace';
import { TherapyNote } from '../components/TherapyNote';
import { CHILDHOOD_DONE_KEY } from '../components/ChildhoodWheelSheet';
import { TaskCreateSheet } from '../components/TaskCreateSheet';
import { api, UserTask, TherapyRelationInfo } from '../api';
import { BottomSheet } from '../components/BottomSheet';
import { SectionLabel } from '../components/SectionLabel';

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
}

function ToolRow({ emoji, label, sub, divider, onClick, accent }: { emoji: string; label: string; sub?: string; divider?: boolean; onClick: () => void; accent?: string }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', borderTop: divider ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
      <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: accent ?? '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
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

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
}

const TASK_EMOJI: Record<string, string> = {
  diary_streak: '📔', tracker_streak: '📊', belief_check: '🔍',
  letter_to_self: '✉️', safe_place: '🏡', childhood_wheel: '🌱',
  flashcard: '🆘', custom: '✏️',
};

function TaskRow({ task, onOpen, onComplete }: { task: UserTask; onOpen: () => void; onComplete?: () => void }) {
  const isStreakTask = task.type === 'diary_streak' || task.type === 'tracker_streak';
  return (
    <div
      onClick={task.doneToday ? undefined : onOpen}
      style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: task.doneToday ? 'default' : 'pointer', opacity: task.doneToday ? 0.6 : 1 }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{task.doneToday ? '✅' : (TASK_EMOJI[task.type] ?? '⏳')}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#fff' }}>{task.text}</div>
        {task.doneToday && isStreakTask && (
          <div style={{ fontSize: 11, color: 'rgba(52,211,153,0.7)', marginTop: 2 }}>Сделано сегодня — завтра снова</div>
        )}
        <TaskProgressBar task={task} />
        {task.dueDate && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Срок: {formatDate(task.dueDate)}</div>}
      </div>
      {!task.doneToday && onComplete && task.done === null ? (
        <button
          onClick={e => { e.stopPropagation(); onComplete(); }}
          style={{ background: 'rgba(52,211,153,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#34d399', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
        >
          Сделал
        </button>
      ) : !task.doneToday ? (
        <span style={{ color: 'rgba(167,139,250,0.5)', fontSize: 12, flexShrink: 0 }}>открыть ›</span>
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
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#a78bfa', borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{progress}/{target}</span>
    </div>
  );
}

export function HelpSection({ onOpenChildhoodWheel, onOpenPractices, onOpenPlans, onOpenTracker, onOpenDiaries, practiceCount, planCount, refreshKey, initialTasks, onTasksChanged }: Props) {
  const safeTop = getTelegramSafeTop();
  const childhoodDone = !!localStorage.getItem(CHILDHOOD_DONE_KEY);

  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showBeliefCheck, setShowBeliefCheck] = useState(false);
  const [showLetterToSelf, setShowLetterToSelf] = useState(false);
  const [showSafePlace, setShowSafePlace] = useState(false);
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [tasks, setTasks] = useState<UserTask[]>(initialTasks ?? []);
  const [relation, setRelation] = useState<TherapyRelationInfo | null | undefined>(initialTasks !== undefined ? null : undefined);

  useEffect(() => {
    if (initialTasks !== undefined) setTasks(initialTasks ?? []);
  }, [initialTasks]);

  useEffect(() => {
    let ignore = false;
    // Background refresh (initialTasks already shown so no delay)
    api.getTasks().then(t => { if (!ignore) setTasks(t); }).catch(() => {});
    api.getTherapyRelation().then(r => { if (!ignore) setRelation(r); }).catch(() => { if (!ignore) setRelation(null); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const myTasks = tasks.filter(t => t.assignedBy === null);
  const therapistTasks = tasks.filter(t => t.assignedBy !== null);

  function openTask(task: UserTask) {
    switch (task.type) {
      case 'diary_streak':    onOpenDiaries(); break;
      case 'tracker_streak':  onOpenTracker(); break;
      case 'belief_check':    setShowBeliefCheck(true); break;
      case 'letter_to_self':  setShowLetterToSelf(true); break;
      case 'safe_place':      setShowSafePlace(true); break;
      case 'childhood_wheel': onOpenChildhoodWheel(); break;
      case 'flashcard':       setShowFlashcard(true); break;
      default: break;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Помощь</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5 }}>
          Инструменты схема-терапии и твои задания
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Tasks card — always shown once relation is loaded */}
        {relation !== undefined && (
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 4px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)' }}>🎯 Задания</div>
            </div>

            {tasks.length === 0 && (
              <div style={{ padding: '8px 16px 12px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                Нет активных заданий
              </div>
            )}

            {myTasks.slice(0, 3).map(task => (
              <TaskRow
                key={task.id} task={task}
                onOpen={() => openTask(task)}
              />
            ))}

            {therapistTasks.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,200,100,0.7)' }}>👨‍⚕️ ОТ ТЕРАПЕВТА</div>
                </div>
                {therapistTasks.slice(0, 2).map(task => (
                  <TaskRow
                    key={task.id} task={task}
                    onOpen={() => openTask(task)}
                    onComplete={() => api.completeTask(task.id, true).then(() => api.getTasks().then(setTasks).catch(() => {})).catch(() => {})}
                  />
                ))}
              </>
            )}

            <div style={{ padding: '4px 8px 10px', display: 'flex', gap: 8 }}>
              {tasks.length > 0 && (
                <div
                  onClick={() => setShowAllTasks(true)}
                  style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: 'rgba(167,139,250,0.8)', background: 'rgba(167,139,250,0.08)' }}
                >
                  Все задания
                </div>
              )}
              <div
                onClick={() => setShowTaskCreate(true)}
                style={{ flex: tasks.length > 0 ? 1 : undefined, width: tasks.length === 0 ? '100%' : undefined, textAlign: 'center', padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: 'rgba(167,139,250,0.8)', background: 'rgba(167,139,250,0.08)' }}
              >
                + Поставить цель
              </div>
            </div>
          </div>
        )}

        {/* Emergency */}
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.7)' }}>🚨 Прямо сейчас</div>
          </div>
          <ToolRow emoji="🆘" label="Мне сейчас плохо" sub="Разобрать что происходит — 5 шагов" onClick={() => setShowFlashcard(true)} accent="rgba(255,200,200,0.9)" />
        </div>

        {/* Работа с мыслями */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)' }}>💭 Работа с мыслями</div>
          </div>
          <ToolRow emoji="🔍" label="Проверить убеждение" sub="Правда ли это? Собрать доказательства за и против" onClick={() => setShowBeliefCheck(true)} />
          <ToolRow emoji="✉️" label="Письмо Уязвимому Ребёнку" sub="Написать себе из прошлого" divider onClick={() => setShowLetterToSelf(true)} />
        </div>

        {/* Ресурс */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.6)' }}>🌿 Ресурс</div>
          </div>
          <ToolRow emoji="🏡" label="Безопасное место" sub="Описать и перечитывать в тревожный момент" onClick={() => setShowSafePlace(true)} />
          <ToolRow emoji="🌱" label="Колесо детства" sub={childhoodDone ? 'Паттерны из детства' : 'Не заполнено — займёт 2 минуты'} divider onClick={onOpenChildhoodWheel} />
        </div>

        {/* Отслеживание */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.6)' }}>📊 Отслеживание</div>
          </div>
          <ToolRow emoji="🗂" label="Мои практики" sub={practiceCount == null ? undefined : practiceCount === 0 ? 'Привычки для каждой потребности' : `${practiceCount} ${plural(practiceCount, 'практика', 'практики', 'практик')}`} onClick={onOpenPractices} />
          <ToolRow emoji="🗓" label="История планов" sub={planCount == null ? undefined : planCount === 0 ? 'Создаются в трекере потребностей' : `${planCount} ${plural(planCount, 'план', 'плана', 'планов')} за 30 дней`} divider onClick={onOpenPlans} />
        </div>

        <div style={{ padding: '4px 0 0' }}>
          <TherapyNote compact />
        </div>

      </div>

      {showFlashcard && <SchemaFlashcard onClose={() => setShowFlashcard(false)} onOpenTracker={onOpenTracker} />}
      {showBeliefCheck && <BeliefCheck onClose={() => setShowBeliefCheck(false)} />}
      {showLetterToSelf && <LetterToSelf onClose={() => setShowLetterToSelf(false)} />}
      {showSafePlace && <SafePlace onClose={() => setShowSafePlace(false)} />}
      {showTaskCreate && (
        <TaskCreateSheet
          onCreated={() => {
            setShowTaskCreate(false);
            api.getTasks().then(t => { setTasks(t); onTasksChanged?.(); }).catch(() => {});
          }}
          onClose={() => setShowTaskCreate(false)}
        />
      )}
      {showAllTasks && (
        <BottomSheet onClose={() => setShowAllTasks(false)} zIndex={200}>
          <SectionLabel purple mb={16}>Все задания</SectionLabel>
          {tasks.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Нет активных заданий
            </div>
          ) : tasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{task.done === true ? '✅' : task.done === false ? '❌' : '⏳'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#fff' }}>
                  {task.assignedBy !== null && <span style={{ color: 'rgba(255,200,100,0.8)', marginRight: 4 }}>👨‍⚕️</span>}
                  {task.text}
                </div>
                <TaskProgressBar task={task} />
                {task.dueDate && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Срок: {formatDate(task.dueDate)}</div>}
              </div>
              {task.done === null && task.assignedBy !== null && (
                <button
                  onClick={() => api.completeTask(task.id, true).then(() => api.getTasks().then(setTasks).catch(() => {})).catch(() => {})}
                  style={{ background: 'rgba(52,211,153,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#34d399', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                >
                  Сделал
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => { setShowAllTasks(false); setShowTaskCreate(true); }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}
          >
            + Поставить цель
          </button>
        </BottomSheet>
      )}
    </div>
  );
}
