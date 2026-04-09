import { useEffect, useRef, useState } from 'react';
import { api, TherapyClientSummary, UserTask, TherapistNote, ClientConceptualization, ClientData } from '../api';
import { TaskCreateSheet } from './TaskCreateSheet';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';
import { fmtDate, todayStr } from '../utils/format';
import { useSafeTop } from '../utils/safezone';
import { SCHEMA_DOMAINS, MODE_GROUPS } from '../schemaTherapyData';

interface Props {
  view: 'list' | 'client';
  onViewChange: (v: 'list' | 'client') => void;
  onClose: () => void;
}

type AddMode = null | 'invite' | 'telegram' | 'virtual';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function calcTherapyDuration(startDateStr: string): string {
  const start = new Date(startDateStr);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) {
    const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
    if (days < 1) return 'сегодня';
    const m10 = days % 10, m100 = days % 100;
    const w = (m100 >= 11 && m100 <= 19) ? 'дней' : m10 === 1 ? 'день' : (m10 >= 2 && m10 <= 4) ? 'дня' : 'дней';
    return `${days} ${w}`;
  }
  const m10 = months % 10, m100 = months % 100;
  const w = (m100 >= 11 && m100 <= 19) ? 'месяцев' : m10 === 1 ? 'месяц' : (m10 >= 2 && m10 <= 4) ? 'месяца' : 'месяцев';
  return `${months} ${w}`;
}

function nextSessionLabel(dateStr: string): string {
  const [datePart, timePart] = dateStr.includes('T') ? dateStr.split('T') : [dateStr, null];
  const [, m, d] = datePart.split('-');
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const date = new Date(datePart + 'T00:00:00');
  const base = `${DAY_NAMES[date.getDay()]}, ${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
  return timePart ? `${base} · ${timePart}` : base;
}

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

const CONCEPT_FIELDS: { key: keyof ClientConceptualization; label: string; placeholder: string }[] = [
  { key: 'earlyExperience', label: 'Ранний дисфункциональный опыт', placeholder: 'Значимые события и паттерны из детства и юности, которые сформировали схемы...' },
  { key: 'unmetNeeds', label: 'Неудовлетворённые базовые потребности', placeholder: 'Привязанность, автономия, свобода выражения, игра/спонтанность, реалистичные границы...' },
  { key: 'triggers', label: 'Схемные триггеры', placeholder: 'Ситуации, слова, интонации, отношения — что запускает схемные реакции...' },
  { key: 'copingStyles', label: 'Стили совладания', placeholder: 'Капитуляция, избегание, гиперкомпенсация — типичные паттерны для каждой схемы...' },
  { key: 'modeTransitions', label: 'Переключение режимов', placeholder: 'Что запускает переход в уязвимого ребёнка? Как активируется карающий критик? Когда появляется здоровый взрослый?...' },
  { key: 'currentProblems', label: 'Актуальные проблемы и симптомы', placeholder: 'С чем обратился клиент, текущие жалобы, симптоматика...' },
  { key: 'goals', label: 'Цели схема-терапии', placeholder: 'Что должно измениться? Конкретные результаты, на которые направлена работа...' },
];

export function TherapistClientSheet({ view, onViewChange, onClose }: Props) {
  const safeTop = useSafeTop();

  // Client list
  const [clients, setClients] = useState<TherapyClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Add client flow
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [addInput, setAddInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  // Delete client
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Client detail
  const [selectedClient, setSelectedClient] = useState<TherapyClientSummary | null>(null);
  const [showTasksSheet, setShowTasksSheet] = useState(false);
  const [showNotesSheet, setShowNotesSheet] = useState(false);
  const [showConceptSheet, setShowConceptSheet] = useState(false);
  const [clientTasks, setClientTasks] = useState<UserTask[]>([]);
  const [notes, setNotes] = useState<TherapistNote[]>([]);
  const [noteError, setNoteError] = useState('');
  const [concept, setConcept] = useState<ClientConceptualization | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [localConcept, setLocalConcept] = useState<Partial<ClientConceptualization>>({});
  const [conceptDirty, setConceptDirty] = useState(false);
  const [conceptSaving, setConceptSaving] = useState(false);
  const [conceptError, setConceptError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  // Session info editing
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [localStartDate, setLocalStartDate] = useState('');
  const [editingNextSession, setEditingNextSession] = useState(false);
  const [localNextSession, setLocalNextSession] = useState('');
  const [editingDays, setEditingDays] = useState(false);
  const [localMeetingDays, setLocalMeetingDays] = useState<number[]>([]);
  const [sessionInfoSaving, setSessionInfoSaving] = useState(false);

  // Rename alias
  const [renamingAlias, setRenamingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasSaving, setAliasSaving] = useState(false);
  const [aliasError, setAliasError] = useState('');

  // YSQ request
  const [ysqRequested, setYsqRequested] = useState(false);
  const [ysqError, setYsqError] = useState('');

  // Delete client error
  const [deleteError, setDeleteError] = useState('');

  // Export
  const [exportCopied, setExportCopied] = useState(false);

  // Animation key — changes when view transitions to trigger CSS animation
  const [animKey, setAnimKey] = useState(0);

  // Race condition guard: ignore stale state updates when client changes quickly
  const openClientIdRef = useRef<number | null>(null);

  useEffect(() => {
    api.getTherapyClients().then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function switchView(v: 'list' | 'client') {
    setAnimKey(k => k + 1);
    onViewChange(v);
  }

  // ─── Open client ────────────────────────────────────────────────────────────

  async function openClient(client: TherapyClientSummary) {
    const clientId = client.telegramId;
    openClientIdRef.current = clientId;

    setSelectedClient(client);
    setShowTasksSheet(false);
    setShowNotesSheet(false);
    setShowConceptSheet(false);
    setClientTasks([]);
    setNotes([]);
    setNoteError('');
    setConcept(null);
    setClientData(null);
    setLocalConcept({});
    setConceptDirty(false);
    setConceptError('');
    setShowHistory(false);
    setYsqRequested(false);
    setYsqError('');
    setRenamingAlias(false);
    setAliasError('');
    setDeleteError('');
    setEditingStartDate(false);
    setEditingNextSession(false);
    setEditingDays(false);
    setLocalMeetingDays(client.meetingDays ?? []);
    setLocalNextSession(client.nextSession ?? '');
    setLocalStartDate(client.therapyStartDate ?? '');
    switchView('client');

    const [tasks, fetchedNotes, fetchedConcept, fetchedData] = await Promise.all([
      api.getTherapyTasksForClient(clientId).catch(() => []),
      api.getTherapistNotes(clientId).catch(() => []),
      api.getConceptualization(clientId).catch(() => null),
      api.getTherapyClientData(clientId).catch(() => null),
    ]);

    // Discard stale results if user switched to a different client
    if (openClientIdRef.current !== clientId) return;

    setClientTasks(tasks);
    setNotes(fetchedNotes);
    setConcept(fetchedConcept);
    setClientData(fetchedData);
    if (fetchedConcept) setLocalConcept(fetchedConcept);
  }

  // ─── Delete client ───────────────────────────────────────────────────────────

  async function deleteClient() {
    if (!selectedClient) return;
    const name = selectedClient.clientAlias ?? selectedClient.name ?? 'этого клиента';
    if (!window.confirm(`Удалить ${name}? Связь будет разорвана, данные сохранятся.`)) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.removeClient(selectedClient.telegramId);
      setClients(prev => prev.filter(c => c.telegramId !== selectedClient.telegramId));
      switchView('list');
    } catch { setDeleteError('Не удалось удалить клиента'); } finally { setDeleteLoading(false); }
  }

  // ─── Add client flows ────────────────────────────────────────────────────────

  function openAddMode(mode: AddMode) {
    setAddMode(mode);
    setAddInput('');
    setAddError('');
    setInviteUrl('');
    setInviteCopied(false);
  }

  async function createInvite() {
    setInviteLoading(true);
    try {
      const { url } = await api.createTherapyInvite();
      setInviteUrl(url);
    } catch { setAddError('Не удалось создать ссылку'); } finally { setInviteLoading(false); }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch { inviteInputRef.current?.select(); }
  }

  function shareInvite() {
    if (!inviteUrl) return;
    if (navigator.share) {
      navigator.share({ text: 'Подключись ко мне в Схема-лабе:', url: inviteUrl }).catch(() => {});
    } else {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Подключись ко мне в Схема-лабе')}`;
      window.Telegram?.WebApp?.openLink(tgUrl);
    }
  }

  async function addByTelegramId() {
    const id = parseInt(addInput.trim(), 10);
    if (!id || isNaN(id)) { setAddError('Введи числовой Telegram ID'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const updated = await api.addClientManually(id);
      setClients(updated);
      openAddMode(null);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('not found')) setAddError('Пользователь не найден. Должен открыть приложение хотя бы раз.');
      else if (msg.toLowerCase().includes('already')) setAddError('Клиент уже подключён');
      else setAddError('Ошибка. Проверь ID.');
    } finally { setAddLoading(false); }
  }

  async function addVirtualClient() {
    const name = addInput.trim();
    if (!name) { setAddError('Введи имя клиента'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const updated = await api.addVirtualClient(name);
      setClients(updated);
      openAddMode(null);
    } catch { setAddError('Ошибка. Попробуй ещё раз.'); } finally { setAddLoading(false); }
  }

  // ─── Notes ───────────────────────────────────────────────────────────────────

  async function addNote() {
    if (!selectedClient || !newNoteText.trim()) return;
    setNoteSaving(true);
    setNoteError('');
    try {
      const note = await api.createTherapistNote(selectedClient.telegramId, todayStr(), newNoteText.trim());
      setNotes(prev => [note, ...prev]);
      setNewNoteText('');
    } catch { setNoteError('Не удалось сохранить заметку'); } finally { setNoteSaving(false); }
  }

  async function removeNote(noteId: number) {
    try {
      await api.deleteTherapistNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch { setNoteError('Не удалось удалить заметку'); }
  }

  // ─── Conceptualization ───────────────────────────────────────────────────────

  function patchConcept(patch: Partial<ClientConceptualization>) {
    setLocalConcept(prev => ({ ...prev, ...patch }));
    setConceptDirty(true);
  }

  function toggleSchemaId(id: string) {
    const current = (localConcept.schemaIds ?? concept?.schemaIds ?? []) as string[];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    patchConcept({ schemaIds: next });
  }

  function toggleModeId(id: string) {
    const current = (localConcept.modeIds ?? concept?.modeIds ?? []) as string[];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    patchConcept({ modeIds: next });
  }

  async function saveConcept() {
    if (!selectedClient || !conceptDirty) return;
    setConceptSaving(true);
    setConceptError('');
    try {
      const saved = await api.saveConceptualization(selectedClient.telegramId, {
        schemaIds: (localConcept.schemaIds ?? []) as string[],
        modeIds: (localConcept.modeIds ?? []) as string[],
        earlyExperience: (localConcept.earlyExperience as string) ?? '',
        unmetNeeds: (localConcept.unmetNeeds as string) ?? '',
        triggers: (localConcept.triggers as string) ?? '',
        copingStyles: (localConcept.copingStyles as string) ?? '',
        goals: (localConcept.goals as string) ?? '',
        currentProblems: (localConcept.currentProblems as string) ?? '',
        modeTransitions: (localConcept.modeTransitions as string) ?? '',
      });
      setConcept(saved);
      setLocalConcept(saved);
      setConceptDirty(false);
    } catch (e: any) {
      setConceptError(e?.message?.startsWith('API') ? 'Ошибка сервера. Попробуй позже.' : (e?.message ?? 'Ошибка сохранения'));
    } finally { setConceptSaving(false); }
  }

  // ─── Alias ───────────────────────────────────────────────────────────────────

  async function saveAlias() {
    if (!selectedClient) return;
    setAliasSaving(true);
    setAliasError('');
    try {
      await api.renameClient(selectedClient.telegramId, aliasInput);
      const updated = { ...selectedClient, clientAlias: aliasInput.trim() || null };
      setSelectedClient(updated);
      setClients(prev => prev.map(c => c.telegramId === selectedClient.telegramId ? updated : c));
      setRenamingAlias(false);
    } catch { setAliasError('Не удалось сохранить имя'); } finally { setAliasSaving(false); }
  }

  async function saveSessionInfo(patch: { therapyStartDate?: string | null; nextSession?: string | null; meetingDays?: number[] }) {
    if (!selectedClient) return;
    setSessionInfoSaving(true);
    try {
      await api.updateSessionInfo(selectedClient.telegramId, patch);
      const updated = { ...selectedClient, ...patch };
      if (patch.meetingDays !== undefined) updated.meetingDays = patch.meetingDays;
      setSelectedClient(updated);
      setClients(prev => prev.map(c => c.telegramId === selectedClient.telegramId ? updated : c));
    } catch { /* ignore */ } finally { setSessionInfoSaving(false); }
  }

  async function handleRequestYsq() {
    if (!selectedClient) return;
    setYsqError('');
    try {
      await api.requestYsq(selectedClient.telegramId);
      setYsqRequested(true);
      setTimeout(() => setYsqRequested(false), 3000);
    } catch { setYsqError('Не удалось отправить запрос'); }
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  function buildExportText(): string {
    if (!selectedClient || !concept) return '';
    const therapistName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? 'Терапевт';
    const clientName = selectedClient.clientAlias ?? selectedClient.name ?? `ID ${selectedClient.telegramId}`;
    const date = concept.updatedAt ? fmtDate(concept.updatedAt.slice(0, 10)) : todayStr();
    const c = { ...concept, ...localConcept };
    const schemaNames = (activeSchemaIds as string[]).map(id => {
      const s = SCHEMA_DOMAINS.flatMap(d => d.schemas).find(x => x.id === id);
      return s ? `${s.emoji} ${s.name}` : id;
    });
    const modeNames = (activeModeIds as string[]).map(id => {
      const m = MODE_GROUPS.flatMap(g => g.items).find(x => x.id === id);
      return m ? `${m.emoji} ${m.name}` : id;
    });
    const row = (label: string, value: string | null | undefined) => `${label}\n${value?.trim() || '—'}\n`;
    const div = '─'.repeat(44);
    return [
      `Терапевт: ${therapistName}   Клиент: ${clientName}   Дата: ${date}`,
      '',
      '══════ КРАТКАЯ КОНЦЕПТУАЛИЗАЦИЯ ══════',
      '',
      div, row('АКТУАЛЬНЫЕ СХЕМЫ (ЭДС)', schemaNames.join(' · ') || null),
      div, row('КАРТА РЕЖИМОВ', modeNames.join(' · ') || null),
      div, row('РАННИЙ ДИСФУНКЦИОНАЛЬНЫЙ ОПЫТ', c.earlyExperience as string),
      div, row('НЕУДОВЛЕТВОРЁННЫЕ БАЗОВЫЕ ПОТРЕБНОСТИ', c.unmetNeeds as string),
      div, row('СХЕМНЫЕ ТРИГГЕРЫ', c.triggers as string),
      div, row('ДЕЗАДАПТИВНЫЕ КОПИНГИ', c.copingStyles as string),
      div, row('АКТУАЛЬНЫЕ ПРОБЛЕМЫ И СИМПТОМЫ', c.currentProblems as string),
      div, row('ЦЕЛИ СХЕМА-ТЕРАПИИ', c.goals as string),
      div,
      '',
      '@SchemeHappens · Схема-лаб',
    ].join('\n');
  }

  async function handleExport() {
    const text = buildExportText();
    if (!text) return;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { /* fallthrough */ }
    try {
      await navigator.clipboard.writeText(text);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2500);
    } catch { /* ignore */ }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const activeSchemaIds = (localConcept.schemaIds ?? concept?.schemaIds ?? []) as string[];
  const activeModeIds = (localConcept.modeIds ?? concept?.modeIds ?? []) as string[];
  const ysqSchemaIds = clientData?.ysqActiveSchemaIds ?? [];
  const selfSchemaIds = clientData?.mySchemaIds ?? [];
  const today = todayStr();

  // ─── Render ──────────────────────────────────────────────────────────────────

  const slideStyle: React.CSSProperties = {
    animation: 'fade-in 0.22s ease',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── LIST VIEW ─────────────────────────────────────────────── */}
      {view === 'list' && (
        <div style={{ padding: `${safeTop + 20}px 20px 100px` }}>
          <div key={`list-${animKey}`} style={slideStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Кабинет</div>
              <button
                onClick={() => openAddMode(addMode ? null : 'invite')}
                style={{
                  width: 36, height: 36, borderRadius: 18, border: 'none',
                  background: addMode ? 'rgba(var(--fg-rgb),0.08)' : 'rgba(167,139,250,0.2)',
                  color: addMode ? 'rgba(var(--fg-rgb),0.5)' : '#a78bfa',
                  fontSize: addMode ? 18 : 22, fontWeight: 300, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {addMode ? '✕' : '+'}
              </button>
            </div>

            {/* Add client panel */}
            {addMode !== null && (
              <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 18, padding: 16, marginBottom: 20, animation: 'fade-in 0.18s ease' }}>
                {/* Mode selector */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {([
                    ['invite', '🔗', 'Ссылка'],
                    ['telegram', '📱', 'Telegram ID'],
                    ['virtual', '👤', 'Оффлайн'],
                  ] as [AddMode, string, string][]).map(([mode, icon, label]) => (
                    <button
                      key={mode!}
                      onClick={() => { setAddMode(mode); setAddInput(''); setAddError(''); }}
                      style={{
                        flex: 1, padding: '9px 4px', borderRadius: 12, border: 'none',
                        background: addMode === mode ? 'rgba(167,139,250,0.2)' : 'rgba(var(--fg-rgb),0.05)',
                        color: addMode === mode ? '#a78bfa' : 'rgba(var(--fg-rgb),0.4)',
                        fontSize: 12, fontWeight: addMode === mode ? 600 : 400, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {/* Invite form */}
                {addMode === 'invite' && (
                  <>
                    {!inviteUrl ? (
                      <button
                        onClick={createInvite} disabled={inviteLoading}
                        style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: inviteLoading ? 0.6 : 1 }}
                      >
                        {inviteLoading ? 'Создаю...' : 'Создать ссылку'}
                      </button>
                    ) : (
                      <>
                        <input
                          ref={inviteInputRef} readOnly value={inviteUrl}
                          onClick={() => inviteInputRef.current?.select()}
                          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, background: 'rgba(var(--fg-rgb),0.05)', border: '1px solid rgba(var(--fg-rgb),0.1)', borderRadius: 10, padding: '9px 12px', outline: 'none', cursor: 'text', color: 'rgba(var(--fg-rgb),0.6)', fontSize: 12, fontFamily: 'monospace' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={copyInvite} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: inviteCopied ? 'rgba(6,214,160,0.15)' : 'rgba(var(--fg-rgb),0.07)', color: inviteCopied ? '#06d6a0' : 'rgba(var(--fg-rgb),0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {inviteCopied ? '✓ Скопировано' : 'Скопировать'}
                          </button>
                          <button onClick={shareInvite} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Поделиться
                          </button>
                        </div>
                        <button onClick={() => { setInviteUrl(''); setInviteCopied(false); }} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'rgba(var(--fg-rgb),0.2)', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}>
                          Создать новую
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Telegram ID form */}
                {addMode === 'telegram' && (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={addInput}
                        onChange={e => { setAddInput(e.target.value); setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && addByTelegramId()}
                        placeholder="Telegram ID клиента"
                        inputMode="numeric"
                        autoFocus
                        style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.06)', border: `1px solid ${addError ? '#f87171' : 'rgba(var(--fg-rgb),0.12)'}`, borderRadius: 10, padding: '9px 12px', outline: 'none', color: 'var(--text)', fontSize: 14 }}
                      />
                      <button
                        onClick={addByTelegramId} disabled={addLoading || !addInput.trim()}
                        style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: addInput.trim() ? 'rgba(var(--fg-rgb),0.12)' : 'rgba(var(--fg-rgb),0.05)', color: addInput.trim() ? 'var(--text)' : 'rgba(var(--fg-rgb),0.3)', fontSize: 13, fontWeight: 600, cursor: addInput.trim() ? 'pointer' : 'default', flexShrink: 0 }}
                      >
                        {addLoading ? '...' : 'Добавить'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)', marginTop: 6 }}>Клиент должен хотя бы раз открыть приложение</div>
                  </>
                )}

                {/* Virtual client form */}
                {addMode === 'virtual' && (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={addInput}
                        onChange={e => { setAddInput(e.target.value); setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && addVirtualClient()}
                        placeholder="Имя клиента"
                        autoFocus
                        style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.06)', border: `1px solid ${addError ? '#f87171' : 'rgba(var(--fg-rgb),0.12)'}`, borderRadius: 10, padding: '9px 12px', outline: 'none', color: 'var(--text)', fontSize: 14 }}
                      />
                      <button
                        onClick={addVirtualClient} disabled={addLoading || !addInput.trim()}
                        style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: addInput.trim() ? '#a78bfa' : 'rgba(var(--fg-rgb),0.05)', color: addInput.trim() ? '#fff' : 'rgba(var(--fg-rgb),0.3)', fontSize: 13, fontWeight: 600, cursor: addInput.trim() ? 'pointer' : 'default', flexShrink: 0 }}
                      >
                        {addLoading ? '...' : 'Создать'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)', marginTop: 6 }}>Для работы без Telegram: заметки, концептуализация, задания</div>
                  </>
                )}

                {addError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{addError}</div>}
              </div>
            )}

            {/* Client list */}
            <SectionLabel mb={10}>Клиенты ({clients.length})</SectionLabel>
            {loading ? (
              <div style={{ color: 'rgba(var(--fg-rgb),0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Загружаю...</div>
            ) : clients.length === 0 ? (
              <div style={{ color: 'rgba(var(--fg-rgb),0.3)', fontSize: 14, textAlign: 'center', paddingTop: 20, lineHeight: 1.8 }}>
                Нет подключённых клиентов.<br />Нажми <strong style={{ color: '#a78bfa' }}>+</strong> чтобы добавить.
              </div>
            ) : clients.map(c => {
              const isToday = c.lastActiveDate === today;
              const isVirtual = c.telegramId < 0;
              return (
                <div
                  key={c.telegramId}
                  onClick={() => openClient(c)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 8, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                        background: isVirtual ? 'rgba(var(--fg-rgb),0.15)' : isToday ? '#06d6a0' : 'rgba(var(--fg-rgb),0.15)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {c.clientAlias ?? c.name ?? (isVirtual ? '👤 Оффлайн' : `ID ${c.telegramId}`)}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)' }}>
                        {isVirtual ? 'Без Telegram' : `${streakEmoji(c.streak)} ${c.streak} дн.${c.lastActiveDate ? ` · ${fmtDate(c.lastActiveDate)}` : ''}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.todayIndex !== null && <div style={{ fontSize: 15, fontWeight: 700, color: indexColor(c.todayIndex) }}>{c.todayIndex}</div>}
                    <span style={{ color: 'rgba(var(--fg-rgb),0.2)', fontSize: 18 }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CLIENT VIEW ───────────────────────────────────────────── */}
      {view === 'client' && selectedClient && (
        <div key={`client-${animKey}`} style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'fade-in 0.22s ease' }}>

          {/* ── STICKY HEADER ── */}
          <div style={{ flexShrink: 0, paddingTop: safeTop + 8, padding: `${safeTop + 8}px 20px 0`, background: 'var(--bg)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {/* Back button — large touch target */}
              <div
                onClick={() => { switchView('list'); setRenamingAlias(false); setYsqRequested(false); }}
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', marginLeft: -8 }}
              >
                <span style={{ fontSize: 26, color: 'rgba(var(--fg-rgb),0.4)', lineHeight: 1 }}>‹</span>
              </div>

              {/* Name / rename */}
              {renamingAlias ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      autoFocus value={aliasInput}
                      onChange={e => setAliasInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveAlias()}
                      placeholder={selectedClient.name ?? 'Имя'}
                      maxLength={100}
                      style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.07)', border: '1px solid rgba(var(--fg-rgb),0.15)', borderRadius: 10, padding: '7px 10px', outline: 'none', color: 'var(--text)', fontSize: 15 }}
                    />
                    <button onClick={saveAlias} disabled={aliasSaving} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: '#a78bfa', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {aliasSaving ? '...' : '✓'}
                    </button>
                    <button onClick={() => { setRenamingAlias(false); setAliasError(''); }} style={{ padding: '7px 10px', borderRadius: 10, border: 'none', background: 'rgba(var(--fg-rgb),0.07)', color: 'rgba(var(--fg-rgb),0.5)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                  </div>
                  {aliasError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{aliasError}</div>}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedClient.clientAlias ?? selectedClient.name ?? 'Клиент'}
                  </div>
                  <button
                    onClick={() => { setAliasInput(selectedClient.clientAlias ?? selectedClient.name ?? ''); setRenamingAlias(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(var(--fg-rgb),0.25)', padding: '4px', flexShrink: 0 }}
                  >✎</button>
                  <button
                    onClick={deleteClient} disabled={deleteLoading}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(248,113,113,0.35)', padding: '4px', flexShrink: 0 }}
                    title="Удалить клиента"
                  >🗑</button>
                </div>
              )}
            </div>

              {/* Delete error */}
              {deleteError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 4, textAlign: 'center' }}>{deleteError}</div>}

              {/* Thin separator */}
              <div style={{ height: 1, background: 'rgba(var(--fg-rgb),0.06)', margin: '10px -20px 0' }} />
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div style={{ flex: 1, overflowY: 'auto' as const, padding: '12px 20px 100px' }}>

            {/* ── SESSION CARD ── */}
            {(() => {
              const effectiveStart = selectedClient.therapyStartDate ?? selectedClient.relationCreatedAt;
              const duration = effectiveStart ? calcTherapyDuration(effectiveStart) : null;
              const displayDays = editingDays ? localMeetingDays : (selectedClient.meetingDays ?? []);
              return (
                <div style={{ background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
                  {/* Row 1: Start date + duration */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      {editingStartDate ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="date" value={localStartDate} onChange={e => setLocalStartDate(e.target.value)} autoFocus
                            style={{ background: 'rgba(var(--fg-rgb),0.07)', border: '1px solid rgba(var(--fg-rgb),0.15)', borderRadius: 8, padding: '5px 8px', outline: 'none', color: 'var(--text)', fontSize: 13 }}
                          />
                          <button onClick={async () => { await saveSessionInfo({ therapyStartDate: localStartDate || null }); setEditingStartDate(false); }} disabled={sessionInfoSaving} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#a78bfa', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingStartDate(false)} style={{ padding: '5px 8px', borderRadius: 8, border: 'none', background: 'rgba(var(--fg-rgb),0.08)', color: 'rgba(var(--fg-rgb),0.5)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => { setLocalStartDate(selectedClient.therapyStartDate ?? selectedClient.relationCreatedAt?.slice(0, 10) ?? ''); setEditingStartDate(true); }}>
                          <span style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.6)' }}>
                            {effectiveStart ? `С ${fmtDate(effectiveStart.slice(0, 10))}` : 'Начало не указано'}
                          </span>
                          {duration && <span style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)' }}>· {duration}</span>}
                          <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)' }}>✎</span>
                        </div>
                      )}
                    </div>
                    {/* Activity badge */}
                    {selectedClient.telegramId > 0 && selectedClient.lastActiveDate && (
                      <span style={{ fontSize: 11, color: selectedClient.lastActiveDate === today ? '#06d6a0' : 'rgba(var(--fg-rgb),0.3)', background: selectedClient.lastActiveDate === today ? 'rgba(6,214,160,0.1)' : 'rgba(var(--fg-rgb),0.05)', padding: '3px 8px', borderRadius: 20 }}>
                        {selectedClient.lastActiveDate === today ? '● сегодня' : fmtDate(selectedClient.lastActiveDate)}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Meeting days + next session */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Days */}
                    {editingDays ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {[1,2,3,4,5,6,0].map(d => (
                          <button key={d}
                            onClick={() => setLocalMeetingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                            style={{ padding: '4px 9px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: localMeetingDays.includes(d) ? 'rgba(167,139,250,0.3)' : 'rgba(var(--fg-rgb),0.07)', color: localMeetingDays.includes(d) ? '#a78bfa' : 'rgba(var(--fg-rgb),0.4)' }}
                          >{DAY_NAMES[d]}</button>
                        ))}
                        <button onClick={async () => { await saveSessionInfo({ meetingDays: localMeetingDays }); setEditingDays(false); }} disabled={sessionInfoSaving} style={{ padding: '4px 10px', borderRadius: 20, border: 'none', background: '#a78bfa', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✓</button>
                        <button onClick={() => setEditingDays(false)} style={{ padding: '4px 8px', borderRadius: 20, border: 'none', background: 'rgba(var(--fg-rgb),0.07)', color: 'rgba(var(--fg-rgb),0.4)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }} onClick={() => { setLocalMeetingDays(selectedClient.meetingDays ?? []); setEditingDays(true); }}>
                        {displayDays.length === 0 ? (
                          <span style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.25)', borderBottom: '1px dashed rgba(var(--fg-rgb),0.2)' }}>дни встреч +</span>
                        ) : (
                          <>
                            {[1,2,3,4,5,6,0].filter(d => displayDays.includes(d)).map(d => (
                              <span key={d} style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{DAY_NAMES[d]}</span>
                            ))}
                            <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)' }}>✎</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Next session */}
                    {!editingDays && (
                      editingNextSession ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                          <input
                            type="datetime-local" value={localNextSession} onChange={e => setLocalNextSession(e.target.value)} autoFocus
                            style={{ background: 'rgba(var(--fg-rgb),0.07)', border: '1px solid rgba(var(--fg-rgb),0.15)', borderRadius: 8, padding: '5px 8px', outline: 'none', color: 'var(--text)', fontSize: 13 }}
                          />
                          <button onClick={async () => { await saveSessionInfo({ nextSession: localNextSession || null }); setEditingNextSession(false); }} disabled={sessionInfoSaving} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#a78bfa', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingNextSession(false)} style={{ padding: '5px 8px', borderRadius: 8, border: 'none', background: 'rgba(var(--fg-rgb),0.08)', color: 'rgba(var(--fg-rgb),0.5)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ marginLeft: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => { setLocalNextSession(selectedClient.nextSession ?? ''); setEditingNextSession(true); }}>
                          {selectedClient.nextSession ? (
                            <>
                              <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>след.</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(var(--fg-rgb),0.7)' }}>{nextSessionLabel(selectedClient.nextSession)}</span>
                              <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)' }}>✎</span>
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.25)', borderBottom: '1px dashed rgba(var(--fg-rgb),0.2)' }}>следующая +</span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── CLINICAL SNAPSHOT ── */}
            {(() => {
              const hasSchemas = activeSchemaIds.length > 0;
              const hasModes = activeModeIds.length > 0;
              const hasGoals = !!(concept?.goals || (localConcept.goals as string));
              const hasTransitions = !!(concept?.modeTransitions || (localConcept.modeTransitions as string));
              const hasAnything = hasSchemas || hasModes || hasGoals || hasTransitions;
              return (
                <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
                  {hasAnything ? (
                    <>
                      {hasGoals && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.3)', textTransform: 'uppercase', marginBottom: 5 }}>Цель терапии</div>
                          <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', lineHeight: 1.5 }}>
                            {((concept?.goals || (localConcept.goals as string)) ?? '').slice(0, 160)}
                            {((concept?.goals || (localConcept.goals as string)) ?? '').length > 160 ? '...' : ''}
                          </div>
                        </div>
                      )}
                      {hasSchemas && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Схемы ({activeSchemaIds.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {activeSchemaIds.map(id => {
                              const domain = SCHEMA_DOMAINS.find(d => d.schemas.some(s => s.id === id));
                              const schema = domain?.schemas.find(s => s.id === id);
                              return schema ? <span key={id} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 20, background: (domain?.color ?? '#888') + '25', color: domain?.color ?? 'rgba(var(--fg-rgb),0.6)' }}>{schema.emoji} {schema.name}</span> : null;
                            })}
                          </div>
                        </div>
                      )}
                      {hasModes && (
                        <div style={{ marginBottom: hasTransitions ? 12 : 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Карта режимов</div>
                          {MODE_GROUPS.map(group => {
                            const groupModes = group.items.filter(m => activeModeIds.includes(m.id));
                            if (groupModes.length === 0) return null;
                            return (
                              <div key={group.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: group.color + 'aa', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, minWidth: 68, paddingTop: 4 }}>{group.group.split(':').pop()?.trim() ?? group.group}</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {groupModes.map(m => <span key={m.id} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 20, background: group.color + '25', color: group.color }}>{m.emoji} {m.name}</span>)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {hasTransitions && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.3)', textTransform: 'uppercase', marginBottom: 5 }}>Переходы режимов</div>
                          <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.65)', lineHeight: 1.5 }}>
                            {((concept?.modeTransitions || (localConcept.modeTransitions as string)) ?? '').slice(0, 200)}
                            {((concept?.modeTransitions || (localConcept.modeTransitions as string)) ?? '').length > 200 ? '...' : ''}
                          </div>
                        </div>
                      )}
                      <button onClick={() => setShowConceptSheet(true)} style={{ marginTop: 12, background: 'none', border: 'none', color: '#a78bfa', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                        Редактировать концептуализацию →
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 10 }}>Концептуализация не заполнена</div>
                      <button onClick={() => setShowConceptSheet(true)} style={{ background: 'rgba(167,139,250,0.15)', border: 'none', borderRadius: 12, padding: '9px 18px', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Заполнить концептуализацию
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── ACTION BUTTONS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div onClick={() => setShowTasksSheet(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 14, padding: '13px 16px', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Задания</div>
                  {clientTasks.length > 0 && <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 1 }}>{clientTasks.length} активных</div>}
                </div>
                <span style={{ color: 'rgba(var(--fg-rgb),0.25)', fontSize: 18 }}>›</span>
              </div>
              <div onClick={() => setShowNotesSheet(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 14, padding: '13px 16px', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>📝</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Заметки сессий</div>
                  {notes.length > 0 && <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 1 }}>{notes.length} заметок</div>}
                </div>
                <span style={{ color: 'rgba(var(--fg-rgb),0.25)', fontSize: 18 }}>›</span>
              </div>
              <div onClick={() => setShowConceptSheet(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 14, padding: '13px 16px', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>🗂</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Концептуализация</div>
                  {concept?.updatedAt && <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 1 }}>Обновлено {fmtDate(concept.updatedAt.slice(0, 10))}</div>}
                </div>
                <span style={{ color: 'rgba(var(--fg-rgb),0.25)', fontSize: 18 }}>›</span>
              </div>
            </div>

            </div>
          </div>
        )}

      {/* ── TASKS SHEET (outside fixed div for correct z-index) ── */}
      {showTasksSheet && selectedClient && (
        <BottomSheet onClose={() => setShowTasksSheet(false)}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>📋 Задания</div>
            <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              {clientTasks.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: 13, color: 'rgba(var(--fg-rgb),0.3)', textAlign: 'center' }}>Нет назначенных заданий</div>
              ) : clientTasks.map((task, i) => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(var(--fg-rgb),0.05)' : undefined }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{task.done === true ? '✅' : task.done === false ? '❌' : task.doneToday ? '✅' : '⏳'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{task.text}</div>
                    <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 3 }}>
                      {task.dueDate ? `Срок: ${fmtDate(task.dueDate)}` : fmtDate(task.createdAt.slice(0, 10))}
                    </div>
                    {task.progress !== undefined && task.targetDays && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(var(--fg-rgb),0.08)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(task.progress / task.targetDays, 1) * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', flexShrink: 0 }}>{task.progress}/{task.targetDays}</span>
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
          </div>
        </BottomSheet>
      )}

      {/* ── NOTES SHEET (outside fixed div for correct z-index) ── */}
      {showNotesSheet && selectedClient && (
        <BottomSheet onClose={() => setShowNotesSheet(false)}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>📝 Заметки сессий</div>
            <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <textarea
                value={newNoteText} onChange={e => { setNewNoteText(e.target.value); setNoteError(''); }}
                placeholder="Заметка сессии: наблюдения, гипотезы, динамика, план следующей встречи..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {noteError ? <div style={{ fontSize: 12, color: '#f87171' }}>{noteError}</div> : <div />}
                <button
                  onClick={addNote} disabled={noteSaving || !newNoteText.trim()}
                  style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: newNoteText.trim() ? 'rgba(167,139,250,0.25)' : 'rgba(var(--fg-rgb),0.06)', color: newNoteText.trim() ? '#a78bfa' : 'rgba(var(--fg-rgb),0.25)', fontSize: 13, fontWeight: 600, cursor: newNoteText.trim() ? 'pointer' : 'default', opacity: noteSaving ? 0.6 : 1 }}
                >
                  {noteSaving ? 'Сохраняю...' : 'Сохранить'}
                </button>
              </div>
            </div>
            {notes.length === 0 ? (
              <div style={{ color: 'rgba(var(--fg-rgb),0.25)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Нет заметок. Добавь первую выше.</div>
            ) : notes.map(note => (
              <div key={note.id} style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>{fmtDate(note.date)}</span>
                  <button onClick={() => removeNote(note.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.35)', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.text}</div>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* ── CONCEPT SHEET (outside fixed div for correct z-index) ── */}
      {showConceptSheet && selectedClient && (
        <BottomSheet onClose={() => setShowConceptSheet(false)}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>🗂 Концептуализация</div>
            {selectedClient.telegramId > 0 && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={handleRequestYsq}
                  style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.06)', color: ysqRequested ? '#06d6a0' : 'rgba(96,165,250,0.8)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  {ysqRequested ? '✓ Запрос отправлен' : '📋 Запросить тест YSQ'}
                </button>
                {ysqError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6, textAlign: 'center' }}>{ysqError}</div>}
              </div>
            )}
            {ysqSchemaIds.length > 0 && (
              <div style={{ background: 'rgba(79,163,247,0.07)', border: '1px solid rgba(79,163,247,0.2)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(79,163,247,0.8)', textTransform: 'uppercase', marginBottom: 8 }}>📊 YSQ — результаты теста</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {ysqSchemaIds.map(id => {
                    const schema = SCHEMA_DOMAINS.flatMap(d => d.schemas).find(s => s.id === id);
                    return schema ? <span key={id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(79,163,247,0.15)', color: 'rgba(79,163,247,0.9)' }}>{schema.emoji} {schema.name}</span> : null;
                  })}
                </div>
                {clientData?.ysqCompletedAt && <div style={{ fontSize: 10, color: 'rgba(var(--fg-rgb),0.25)', marginTop: 6 }}>Пройден: {fmtDate(clientData.ysqCompletedAt.slice(0, 10))}</div>}
              </div>
            )}
            {selfSchemaIds.length > 0 && (
              <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.35)', textTransform: 'uppercase', marginBottom: 8 }}>Схемы клиента (самооценка)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selfSchemaIds.map(id => {
                    const schema = SCHEMA_DOMAINS.flatMap(d => d.schemas).find(s => s.id === id);
                    return schema ? <span key={id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(var(--fg-rgb),0.07)', color: 'rgba(var(--fg-rgb),0.5)' }}>{schema.emoji} {schema.name}</span> : null;
                  })}
                </div>
              </div>
            )}
            <SectionLabel mb={8}>Актуальные схемы (ЭДС)</SectionLabel>
            {SCHEMA_DOMAINS.map(domain => (
              <div key={domain.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: domain.color + 'aa', textTransform: 'uppercase', marginBottom: 5, paddingLeft: 2 }}>{domain.domain}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {domain.schemas.map(schema => {
                    const active = activeSchemaIds.includes(schema.id);
                    const fromYsq = ysqSchemaIds.includes(schema.id);
                    return (
                      <button key={schema.id} onClick={() => toggleSchemaId(schema.id)}
                        style={{ padding: '5px 10px', borderRadius: 20, cursor: 'pointer', border: fromYsq ? `1px solid ${domain.color}55` : '1px solid transparent', background: active ? domain.color + '30' : 'rgba(var(--fg-rgb),0.05)', color: active ? domain.color : 'rgba(var(--fg-rgb),0.45)', fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s ease' }}
                        title={schema.desc}
                      >{schema.emoji} {schema.name}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 6 }}><SectionLabel mb={8}>Карта режимов</SectionLabel></div>
            {MODE_GROUPS.map(group => (
              <div key={group.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: group.color + 'aa', textTransform: 'uppercase', marginBottom: 5, paddingLeft: 2 }}>{group.group}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {group.items.map(mode => {
                    const active = activeModeIds.includes(mode.id);
                    return (
                      <button key={mode.id} onClick={() => toggleModeId(mode.id)}
                        style={{ padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', background: active ? group.color + '30' : 'rgba(var(--fg-rgb),0.05)', color: active ? group.color : 'rgba(var(--fg-rgb),0.45)', fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s ease' }}
                      >{mode.emoji} {mode.name}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              {CONCEPT_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.35)', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                  <textarea
                    value={(localConcept[key] as string) ?? ''}
                    onChange={e => patchConcept({ [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 12, padding: '10px 12px', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveConcept} disabled={conceptSaving || !conceptDirty}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: conceptDirty ? 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(79,163,247,0.2))' : 'rgba(var(--fg-rgb),0.05)', color: conceptDirty ? 'var(--text)' : 'rgba(var(--fg-rgb),0.25)', fontSize: 14, fontWeight: 600, cursor: conceptDirty ? 'pointer' : 'default', opacity: conceptSaving ? 0.6 : 1 }}
            >
              {conceptSaving ? 'Сохраняю...' : conceptDirty ? 'Сохранить концептуализацию' : concept ? `✓ Сохранено ${fmtDate(concept.updatedAt.slice(0, 10))}` : 'Нет изменений'}
            </button>
            {conceptError && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 6 }}>{conceptError}</div>}
            {concept && (
              <button
                onClick={handleExport}
                style={{ width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: exportCopied ? 'rgba(6,214,160,0.1)' : 'transparent', color: exportCopied ? '#06d6a0' : 'rgba(var(--fg-rgb),0.4)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {exportCopied ? '✓ Скопировано' : '↗ Экспорт / Поделиться'}
              </button>
            )}
            {concept && (concept.history as unknown[])?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  style={{ background: 'none', border: 'none', color: 'rgba(var(--fg-rgb),0.3)', fontSize: 12, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
                >
                  <span>{showHistory ? '▲' : '▼'}</span>
                  История изменений ({(concept.history as unknown[]).length})
                </button>
                {showHistory && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(concept.history as import('../api').ConceptSnapshot[]).map((snap, i) => {
                      const snapSchemas = (snap.schemaIds ?? []).map(id => {
                        const domain = SCHEMA_DOMAINS.find(d => d.schemas.some(s => s.id === id));
                        const schema = domain?.schemas.find(s => s.id === id);
                        return schema ? { schema, color: domain!.color } : null;
                      }).filter(Boolean) as { schema: { id: string; name: string; emoji: string }; color: string }[];
                      const textFields = [
                        { label: 'Цель', val: snap.goals },
                        { label: 'Опыт', val: snap.earlyExperience },
                        { label: 'Потребности', val: snap.unmetNeeds },
                        { label: 'Триггеры', val: snap.triggers },
                        { label: 'Копинг', val: snap.copingStyles },
                        { label: 'Переходы', val: snap.modeTransitions },
                        { label: 'Проблемы', val: snap.currentProblems },
                      ].filter(f => f.val);
                      return (
                        <div key={i} style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.06)', borderRadius: 14, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(var(--fg-rgb),0.4)' }}>{fmtDate(snap.savedAt.slice(0, 10))}</span>
                            <button
                              onClick={() => { setLocalConcept({ schemaIds: snap.schemaIds ?? [], modeIds: snap.modeIds ?? [], earlyExperience: snap.earlyExperience ?? '', unmetNeeds: snap.unmetNeeds ?? '', triggers: snap.triggers ?? '', copingStyles: snap.copingStyles ?? '', goals: snap.goals ?? '', currentProblems: snap.currentProblems ?? '', modeTransitions: snap.modeTransitions ?? '' }); setConceptDirty(true); setShowHistory(false); }}
                              style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                            >Восстановить</button>
                          </div>
                          {snapSchemas.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                              {snapSchemas.map(({ schema, color }) => (
                                <span key={schema.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: color + '20', color }}>{schema.emoji} {schema.name}</span>
                              ))}
                            </div>
                          )}
                          {(snap.modeIds ?? []).length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              {MODE_GROUPS.map(group => {
                                const gm = group.items.filter(m => (snap.modeIds ?? []).includes(m.id));
                                if (gm.length === 0) return null;
                                return (
                                  <div key={group.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 3 }}>
                                    {gm.map(m => <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: group.color + '20', color: group.color }}>{m.emoji} {m.name}</span>)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {textFields.map(({ label, val }) => (
                            <div key={label} style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.5)', marginBottom: 3 }}>
                              <span style={{ color: 'rgba(var(--fg-rgb),0.2)', fontWeight: 600 }}>{label}: </span>
                              {(val ?? '').slice(0, 140)}{(val ?? '').length > 140 ? '...' : ''}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </BottomSheet>
      )}

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
