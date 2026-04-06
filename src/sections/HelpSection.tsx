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
  practiceCount?: number | null;
  planCount?: number | null;
  refreshKey?: number;
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

function TaskProgressBar({ task }: { task: UserTask }) {
  if (task.type === 'custom' || !task.targetDays) return null;
  const target = task.targetDays;
  const created = new Date(task.createdAt).getTime();
  const elapsed = Math.floor((Date.now() - created) / 86_400_000);
  const progress = Math.min(elapsed, target);
  return (
    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(progress / target) * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{progress}/{target}</span>
    </div>
  );
}

export function HelpSection({ onOpenChildhoodWheel, onOpenPractices, onOpenPlans, practiceCount, planCount, refreshKey }: Props) {
  const safeTop = getTelegramSafeTop();
  const childhoodDone = !!localStorage.getItem(CHILDHOOD_DONE_KEY);

  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showBeliefCheck, setShowBeliefCheck] = useState(false);
  const [showLetterToSelf, setShowLetterToSelf] = useState(false);
  const [showSafePlace, setShowSafePlace] = useState(false);
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [relation, setRelation] = useState<TherapyRelationInfo | null | undefined>(undefined);

  useEffect(() => {
    let ignore = false;
    api.getTasks().then(t => { if (!ignore) setTasks(t); }).catch(() => {});
    api.getTherapyRelation().then(r => { if (!ignore) setRelation(r); }).catch(() => { if (!ignore) setRelation(null); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const myTasks = tasks.filter(t => t.assignedBy === null);
  const therapistTasks = tasks.filter(t => t.assignedBy !== null);

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Самопомощь</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5 }}>
          Упражнения схема-терапии для самостоятельной работы
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Tasks card */}
        {(myTasks.length > 0 || therapistTasks.length > 0 || relation !== undefined) && (
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)' }}>🎯 Задания</div>
            </div>
            {myTasks.slice(0, 3).map(task => (
              <div key={task.id} style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{task.done === true ? '✅' : '⏳'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#fff' }}>{task.text}</div>
                  <TaskProgressBar task={task} />
                </div>
              </div>
            ))}
            {therapistTasks.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,200,100,0.7)' }}>👨‍⚕️ ОТ ТЕРАПЕВТА</div>
                </div>
                {therapistTasks.slice(0, 2).map(task => (
                  <div
                    key={task.id}
                    style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    onClick={() => {
                      api.completeTask(task.id, true).then(() =>
                        api.getTasks().then(setTasks).catch(() => {})
                      ).catch(() => {});
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{task.done === true ? '✅' : '⏳'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#fff' }}>{task.text}</div>
                      {task.dueDate && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Срок: {formatDate(task.dueDate)}</div>}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div style={{ padding: '4px 8px 10px', display: 'flex', gap: 8 }}>
              <div
                onClick={() => setShowAllTasks(true)}
                style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: 'rgba(167,139,250,0.8)', background: 'rgba(167,139,250,0.08)' }}
              >
                Все задания
              </div>
              <div
                onClick={() => setShowTaskCreate(true)}
                style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: 'rgba(167,139,250,0.8)', background: 'rgba(167,139,250,0.08)' }}
              >
                + Поставить цель
              </div>
            </div>
          </div>
        )}

        {/* Empty state — show task create button even with no tasks */}
        {tasks.length === 0 && relation === null && (
          <div
            onClick={() => setShowTaskCreate(true)}
            style={{
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)',
              borderRadius: 20, padding: '14px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#a78bfa' }}>🎯 Поставить цель</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Дневник N дней, трекер, своё задание</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
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

      {showFlashcard && <SchemaFlashcard onClose={() => setShowFlashcard(false)} />}
      {showBeliefCheck && <BeliefCheck onClose={() => setShowBeliefCheck(false)} />}
      {showLetterToSelf && <LetterToSelf onClose={() => setShowLetterToSelf(false)} />}
      {showSafePlace && <SafePlace onClose={() => setShowSafePlace(false)} />}
      {showTaskCreate && (
        <TaskCreateSheet
          onCreated={() => { setShowTaskCreate(false); api.getTasks().then(setTasks).catch(() => {}); }}
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
