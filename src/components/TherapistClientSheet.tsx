import { useEffect, useRef, useState } from 'react';
import { api, TherapyClientSummary, UserTask, TherapistNote, ClientConceptualization } from '../api';
import { TaskCreateSheet } from './TaskCreateSheet';
import { SectionLabel } from './SectionLabel';
import { fmtDate, todayStr } from '../utils/format';
import { getTelegramSafeTop } from '../utils/safezone';

interface Props {
  view: 'list' | 'client';
  onViewChange: (v: 'list' | 'client') => void;
  onClose: () => void;
}

// ── Schema therapy reference data ─────────────────────────────────────────────

const EMS_SCHEMAS = [
  { id: 'abandonment',      label: 'Покинутость / Нестабильность',     domain: 'Разрыв связи' },
  { id: 'mistrust',         label: 'Недоверие / Жестокое обращение',   domain: 'Разрыв связи' },
  { id: 'emotional_deprivation', label: 'Эмоциональная депривация',   domain: 'Разрыв связи' },
  { id: 'defectiveness',    label: 'Дефективность / Стыд',             domain: 'Разрыв связи' },
  { id: 'social_isolation', label: 'Социальная изоляция / Отчуждение', domain: 'Разрыв связи' },
  { id: 'dependence',       label: 'Зависимость / Некомпетентность',   domain: 'Автономия' },
  { id: 'vulnerability',    label: 'Уязвимость к вреду',               domain: 'Автономия' },
  { id: 'enmeshment',       label: 'Слияние / Неразвитость я',         domain: 'Автономия' },
  { id: 'failure',          label: 'Провал',                           domain: 'Автономия' },
  { id: 'entitlement',      label: 'Привилегированность / Грандиозность', domain: 'Границы' },
  { id: 'insufficient_self_control', label: 'Недостаточный самоконтроль', domain: 'Границы' },
  { id: 'subjugation',      label: 'Подчинение',                       domain: 'Ориентация на других' },
  { id: 'self_sacrifice',   label: 'Самопожертвование',                domain: 'Ориентация на других' },
  { id: 'approval_seeking', label: 'Поиск одобрения',                  domain: 'Ориентация на других' },
  { id: 'negativity',       label: 'Негативность / Пессимизм',         domain: 'Сверхбдительность' },
  { id: 'emotional_inhibition', label: 'Эмоциональное торможение',    domain: 'Сверхбдительность' },
  { id: 'unrelenting_standards', label: 'Завышенные стандарты',       domain: 'Сверхбдительность' },
  { id: 'punitiveness',     label: 'Карательность',                    domain: 'Сверхбдительность' },
];

const SCHEMA_MODES = [
  { id: 'vulnerable_child',   label: 'Уязвимый Ребёнок',       group: 'Дисфункциональные режимы' },
  { id: 'angry_child',        label: 'Злой Ребёнок',           group: 'Дисфункциональные режимы' },
  { id: 'impulsive_child',    label: 'Импульсивный Ребёнок',   group: 'Дисфункциональные режимы' },
  { id: 'compliant_surrender','label': 'Покорное Подчинение',  group: 'Дисфункциональные режимы' },
  { id: 'detached_protector', label: 'Отстранённый Защитник',  group: 'Дисфункциональные режимы' },
  { id: 'overcompensator',    label: 'Чрезмерная Компенсация', group: 'Дисфункциональные режимы' },
  { id: 'punitive_parent',    label: 'Карательный Родитель',   group: 'Дисфункциональные режимы' },
  { id: 'demanding_parent',   label: 'Требовательный Родитель',group: 'Дисфункциональные режимы' },
  { id: 'healthy_adult',      label: 'Здоровый Взрослый',      group: 'Ресурсный' },
  { id: 'happy_child',        label: 'Счастливый Ребёнок',     group: 'Ресурсный' },
];

// ── Helper components ─────────────────────────────────────────────────────────

function streakEmoji(s: number) {
  if (s >= 7) return '🔥';
  if (s >= 1) return '🌱';
  return '🫥';
}

function indexColor(v: number) {
  if (v >= 7) return '#06d6a0';
  if (v >= 4) return '#ffd166';
  return '#f87171';
}

// ── Main component ────────────────────────────────────────────────────────────

type ClientTab = 'tasks' | 'notes' | 'profile';

export function TherapistClientSheet({ view, onViewChange, onClose }: Props) {
  const safeTop = getTelegramSafeTop();
  const [clients, setClients] = useState<TherapyClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<TherapyClientSummary | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('tasks');
  const [clientTasks, setClientTasks] = useState<UserTask[]>([]);
  const [notes, setNotes] = useState<TherapistNote[]>([]);
  const [concept, setConcept] = useState<ClientConceptualization | null>(null);
  const [conceptDirty, setConceptDirty] = useState(false);
  const [conceptSaving, setConceptSaving] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [localConcept, setLocalConcept] = useState<Partial<ClientConceptualization>>({});

  useEffect(() => {
    api.getTherapyClients().then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function openClient(client: TherapyClientSummary) {
    setSelectedClient(client);
    setClientTab('tasks');
    setClientTasks([]);
    setNotes([]);
    setConcept(null);
    setLocalConcept({});
    setConceptDirty(false);
    onViewChange('client');
    const [tasks, fetchedNotes, fetchedConcept] = await Promise.all([
      api.getTherapyTasksForClient(client.telegramId).catch(() => []),
      api.getTherapistNotes(client.telegramId).catch(() => []),
      api.getConceptualization(client.telegramId).catch(() => null),
    ]);
    setClientTasks(tasks);
    setNotes(fetchedNotes);
    setConcept(fetchedConcept);
    setLocalConcept(fetchedConcept ?? {});
  }

  async function createInvite() {
    setInviteLoading(true);
    try {
      const { url } = await api.createTherapyInvite();
      setInviteUrl(url);
    } catch { /* ignore */ } finally { setInviteLoading(false); }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      inviteInputRef.current?.select();
    }
  }

  function shareInvite() {
    if (!inviteUrl) return;
    if (navigator.share) {
      navigator.share({ text: 'Подключись к Схемалабу как мой клиент:', url: inviteUrl }).catch(() => {});
    } else {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Подключись ко мне в Схемалабе')}`;
      window.Telegram?.WebApp?.openLink(tgUrl);
    }
  }

  async function addNote() {
    if (!selectedClient || !newNoteText.trim()) return;
    setNoteSaving(true);
    try {
      const note = await api.createTherapistNote(selectedClient.telegramId, todayStr(), newNoteText.trim());
      setNotes(prev => [note, ...prev]);
      setNewNoteText('');
    } catch { /* ignore */ } finally { setNoteSaving(false); }
  }

  async function removeNote(noteId: number) {
    await api.deleteTherapistNote(noteId).catch(() => {});
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  function updateLocalConcept(patch: Partial<ClientConceptualization>) {
    setLocalConcept(prev => ({ ...prev, ...patch }));
    setConceptDirty(true);
  }

  function toggleSchemaId(id: string) {
    const current = (localConcept.schemaIds ?? concept?.schemaIds ?? []) as string[];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updateLocalConcept({ schemaIds: next });
  }

  function toggleModeId(id: string) {
    const current = (localConcept.modeIds ?? concept?.modeIds ?? []) as string[];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updateLocalConcept({ modeIds: next });
  }

  async function saveConcept() {
    if (!selectedClient || !conceptDirty) return;
    setConceptSaving(true);
    try {
      const saved = await api.saveConceptualization(selectedClient.telegramId, {
        schemaIds: (localConcept.schemaIds ?? []) as string[],
        modeIds: (localConcept.modeIds ?? []) as string[],
        triggers: localConcept.triggers ?? '',
        coreWounds: localConcept.coreWounds ?? '',
        goals: localConcept.goals ?? '',
      });
      setConcept(saved);
      setConceptDirty(false);
    } catch { /* ignore */ } finally { setConceptSaving(false); }
  }

  const activeSchemaIds = (localConcept.schemaIds ?? concept?.schemaIds ?? []) as string[];
  const activeModeIds = (localConcept.modeIds ?? concept?.modeIds ?? []) as string[];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#060a12', overflowY: 'auto' }}>
      <div style={{ padding: `${safeTop + 20}px 20px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            onClick={view === 'list' ? onClose : () => onViewChange('list')}
            style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            ‹
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {view === 'list' ? 'Кабинет терапевта' : selectedClient?.name ?? 'Клиент'}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* Invite card */}
            <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <SectionLabel purple mb={12}>Пригласить клиента</SectionLabel>
              {!inviteUrl ? (
                <button
                  onClick={createInvite}
                  disabled={inviteLoading}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: inviteLoading ? 0.6 : 1 }}
                >
                  {inviteLoading ? 'Создаю...' : '+ Создать ссылку'}
                </button>
              ) : (
                <>
                  <input
                    ref={inviteInputRef}
                    readOnly
                    value={inviteUrl}
                    onClick={() => inviteInputRef.current?.select()}
                    style={{
                      width: '100%', boxSizing: 'border-box', marginBottom: 10,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: '9px 12px', outline: 'none', cursor: 'text',
                      color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'monospace',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={copyInvite}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: inviteCopied ? 'rgba(6,214,160,0.15)' : 'rgba(255,255,255,0.07)', color: inviteCopied ? '#06d6a0' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {inviteCopied ? '✓ Скопировано' : 'Скопировать'}
                    </button>
                    <button
                      onClick={shareInvite}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Поделиться
                    </button>
                  </div>
                  <button
                    onClick={() => { setInviteUrl(''); setInviteCopied(false); }}
                    style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
                  >
                    Создать новую
                  </button>
                </>
              )}
            </div>

            {/* Client list */}
            <SectionLabel mb={10}>Клиенты</SectionLabel>
            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Загружаю...</div>
            ) : clients.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingTop: 20, lineHeight: 1.7 }}>
                Нет подключённых клиентов.<br />Пригласи клиента по ссылке выше.
              </div>
            ) : clients.map(c => (
              <div
                key={c.telegramId}
                onClick={() => openClient(c)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {c.name ?? `ID ${c.telegramId}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {streakEmoji(c.streak)} {c.streak} дн.
                    {c.lastActiveDate && ` · ${fmtDate(c.lastActiveDate)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.todayIndex !== null && (
                    <div style={{ fontSize: 16, fontWeight: 700, color: indexColor(c.todayIndex) }}>{c.todayIndex}</div>
                  )}
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── CLIENT VIEW ── */}
        {view === 'client' && selectedClient && (
          <>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Серия</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fb923c' }}>{streakEmoji(selectedClient.streak)} {selectedClient.streak}</div>
              </div>
              {selectedClient.todayIndex !== null && (
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Индекс</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: indexColor(selectedClient.todayIndex) }}>{selectedClient.todayIndex}</div>
                </div>
              )}
              {selectedClient.lastActiveDate && (
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Активность</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{fmtDate(selectedClient.lastActiveDate)}</div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3, marginBottom: 20, gap: 2 }}>
              {([['tasks', '📋 Задания'], ['notes', '📝 Заметки'], ['profile', '🗂 Концепция']] as [ClientTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setClientTab(tab)}
                  style={{
                    flex: 1, padding: '8px 0', border: 'none', borderRadius: 10,
                    background: clientTab === tab ? 'rgba(167,139,250,0.25)' : 'transparent',
                    color: clientTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: clientTab === tab ? 600 : 400, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── TASKS TAB ── */}
            {clientTab === 'tasks' && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  {clientTasks.length === 0 ? (
                    <div style={{ padding: '20px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Нет заданий</div>
                  ) : clientTasks.map((task, i) => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 16px',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                        {task.done === true ? '✅' : task.done === false ? '❌' : task.doneToday ? '✅' : '⏳'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.4 }}>{task.text}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                          {task.dueDate ? `Срок: ${fmtDate(task.dueDate)}` : fmtDate(task.createdAt.slice(0, 10))}
                        </div>
                        {task.progress !== undefined && task.targetDays && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(task.progress / task.targetDays, 1) * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{task.progress}/{task.targetDays}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAssign(true)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Назначить задание
                </button>
              </>
            )}

            {/* ── NOTES TAB ── */}
            {clientTab === 'notes' && (
              <>
                {/* New note input */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
                  <textarea
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    placeholder="Заметка сессии: наблюдения, гипотезы, план..."
                    rows={3}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: 'none', outline: 'none', resize: 'none',
                      color: '#fff', fontSize: 13, lineHeight: 1.5,
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={addNote}
                      disabled={noteSaving || !newNoteText.trim()}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: 'none',
                        background: newNoteText.trim() ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)',
                        color: newNoteText.trim() ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                        fontSize: 13, fontWeight: 600, cursor: newNoteText.trim() ? 'pointer' : 'default',
                        opacity: noteSaving ? 0.6 : 1,
                      }}
                    >
                      {noteSaving ? 'Сохраняю...' : 'Сохранить'}
                    </button>
                  </div>
                </div>

                {notes.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                    Нет заметок. Добавь первую выше.
                  </div>
                ) : notes.map(note => (
                  <div
                    key={note.id}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{fmtDate(note.date)}</span>
                      <button
                        onClick={() => removeNote(note.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.4)', fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {note.text}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── CONCEPTUALIZATION TAB ── */}
            {clientTab === 'profile' && (
              <>
                {/* Active EMS Schemas */}
                <SectionLabel mb={10}>Активные схемы (EMS)</SectionLabel>
                {['Разрыв связи', 'Автономия', 'Границы', 'Ориентация на других', 'Сверхбдительность'].map(domain => (
                  <div key={domain} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>
                      {domain}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {EMS_SCHEMAS.filter(s => s.domain === domain).map(schema => {
                        const active = activeSchemaIds.includes(schema.id);
                        return (
                          <button
                            key={schema.id}
                            onClick={() => toggleSchemaId(schema.id)}
                            style={{
                              padding: '6px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              background: active ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                              color: active ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                              fontSize: 12, fontWeight: active ? 600 : 400,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {schema.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Dominant modes */}
                <div style={{ marginTop: 4 }}><SectionLabel mb={10}>Доминирующие режимы</SectionLabel></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {SCHEMA_MODES.map(mode => {
                    const active = activeModeIds.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        onClick={() => toggleModeId(mode.id)}
                        style={{
                          padding: '6px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                          background: active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)',
                          color: active ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Text fields */}
                {([
                  ['triggers', 'Триггеры и уязвимые ситуации', 'Что запускает схемы? Типичные ситуации...'],
                  ['coreWounds', 'Детские истоки / Ключевые раны', 'Опыт детства, лежащий в основе схем...'],
                  ['goals', 'Цели терапии', 'Что хочет изменить клиент? Главные направления работы...'],
                ] as [keyof ClientConceptualization, string, string][]).map(([field, label, placeholder]) => (
                  <div key={field} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>
                      {label}
                    </div>
                    <textarea
                      value={(localConcept[field] as string) ?? ''}
                      onChange={e => updateLocalConcept({ [field]: e.target.value })}
                      placeholder={placeholder}
                      rows={3}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '10px 12px', outline: 'none', resize: 'none',
                        color: '#fff', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}

                {conceptDirty && (
                  <button
                    onClick={saveConcept}
                    disabled={conceptSaving}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(79,163,247,0.2))',
                      color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      opacity: conceptSaving ? 0.6 : 1,
                    }}
                  >
                    {conceptSaving ? 'Сохраняю...' : 'Сохранить концептуализацию'}
                  </button>
                )}
                {!conceptDirty && concept && (
                  <div style={{ fontSize: 12, color: 'rgba(52,211,153,0.6)', textAlign: 'center', padding: '4px 0' }}>
                    ✓ Сохранено
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showAssign && selectedClient && (
        <TaskCreateSheet
          clientId={selectedClient.telegramId}
          clientName={selectedClient.name ?? undefined}
          onCreated={async () => {
            setShowAssign(false);
            const tasks = await api.getTherapyTasksForClient(selectedClient.telegramId).catch(() => []);
            setClientTasks(tasks);
          }}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}
