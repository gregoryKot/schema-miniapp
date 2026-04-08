import { useEffect, useRef, useState } from 'react';
import { api, TherapyClientSummary, UserTask, TherapistNote, ClientConceptualization, ClientData } from '../api';
import { TaskCreateSheet } from './TaskCreateSheet';
import { SectionLabel } from './SectionLabel';
import { fmtDate, todayStr } from '../utils/format';
import { useSafeTop } from '../utils/safezone';
import { SCHEMA_DOMAINS, MODE_GROUPS } from '../schemaTherapyData';

interface Props {
  view: 'list' | 'client';
  onViewChange: (v: 'list' | 'client') => void;
  onClose: () => void;
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

// Fields for the conceptualization form (МИСТ terminology)
const CONCEPT_FIELDS: { key: keyof ClientConceptualization; label: string; placeholder: string }[] = [
  {
    key: 'earlyExperience',
    label: 'Ранний дисфункциональный опыт',
    placeholder: 'Значимые события и паттерны из детства и юности, которые сформировали схемы...',
  },
  {
    key: 'unmetNeeds',
    label: 'Неудовлетворённые базовые потребности',
    placeholder: 'Привязанность, автономия, свобода выражения, игра/спонтанность, реалистичные границы...',
  },
  {
    key: 'triggers',
    label: 'Схемные триггеры',
    placeholder: 'Ситуации, слова, интонации, отношения — что запускает схемные реакции...',
  },
  {
    key: 'copingStyles',
    label: 'Стили совладания',
    placeholder: 'Капитуляция, избегание, гиперкомпенсация — типичные паттерны для каждой схемы...',
  },
  {
    key: 'currentProblems',
    label: 'Актуальные проблемы и симптомы',
    placeholder: 'С чем обратился клиент, текущие жалобы, симптоматика...',
  },
  {
    key: 'goals',
    label: 'Цели схема-терапии',
    placeholder: 'Что должно измениться? Конкретные результаты, на которые направлена работа...',
  },
];

type ClientTab = 'tasks' | 'notes' | 'concept';

export function TherapistClientSheet({ view, onViewChange, onClose }: Props) {
  const safeTop = useSafeTop();
  const [clients, setClients] = useState<TherapyClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<TherapyClientSummary | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('tasks');
  const [clientTasks, setClientTasks] = useState<UserTask[]>([]);
  const [notes, setNotes] = useState<TherapistNote[]>([]);
  const [concept, setConcept] = useState<ClientConceptualization | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [localConcept, setLocalConcept] = useState<Partial<ClientConceptualization>>({});
  const [conceptDirty, setConceptDirty] = useState(false);
  const [conceptSaving, setConceptSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [renamingAlias, setRenamingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasSaving, setAliasSaving] = useState(false);
  const [ysqRequested, setYsqRequested] = useState(false);
  const [manualIdInput, setManualIdInput] = useState('');
  const [manualIdLoading, setManualIdLoading] = useState(false);
  const [manualIdError, setManualIdError] = useState('');
  const [virtualNameInput, setVirtualNameInput] = useState('');
  const [virtualNameLoading, setVirtualNameLoading] = useState(false);
  const [virtualNameError, setVirtualNameError] = useState('');
  const [conceptError, setConceptError] = useState('');
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    api.getTherapyClients().then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function openClient(client: TherapyClientSummary) {
    setSelectedClient(client);
    setClientTab('tasks');
    setClientTasks([]);
    setNotes([]);
    setConcept(null);
    setClientData(null);
    setLocalConcept({});
    setConceptDirty(false);
    setShowHistory(false);
    setYsqRequested(false);
    setRenamingAlias(false);
    onViewChange('client');

    const [tasks, fetchedNotes, fetchedConcept, fetchedData] = await Promise.all([
      api.getTherapyTasksForClient(client.telegramId).catch(() => []),
      api.getTherapistNotes(client.telegramId).catch(() => []),
      api.getConceptualization(client.telegramId).catch(() => null),
      api.getTherapyClientData(client.telegramId).catch(() => null),
    ]);
    setClientTasks(tasks);
    setNotes(fetchedNotes);
    setConcept(fetchedConcept);
    setClientData(fetchedData);
    if (fetchedConcept) setLocalConcept(fetchedConcept);
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
    } catch { inviteInputRef.current?.select(); }
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

  async function saveAlias() {
    if (!selectedClient) return;
    setAliasSaving(true);
    try {
      await api.renameClient(selectedClient.telegramId, aliasInput);
      const updated = { ...selectedClient, clientAlias: aliasInput.trim() || null };
      setSelectedClient(updated);
      setClients(prev => prev.map(c => c.telegramId === selectedClient.telegramId ? updated : c));
      setRenamingAlias(false);
    } catch { /* ignore */ } finally { setAliasSaving(false); }
  }

  async function handleRequestYsq() {
    if (!selectedClient) return;
    try {
      await api.requestYsq(selectedClient.telegramId);
      setYsqRequested(true);
      setTimeout(() => setYsqRequested(false), 3000);
    } catch { /* ignore */ }
  }

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

    const row = (label: string, value: string | null | undefined) =>
      `${label}\n${value?.trim() || '—'}\n`;
    const div = '─'.repeat(44);

    return [
      `Терапевт: ${therapistName}   Клиент: ${clientName}   Дата: ${date}`,
      '',
      '══════ КРАТКАЯ КОНЦЕПТУАЛИЗАЦИЯ ══════',
      '',
      div,
      row('АКТУАЛЬНЫЕ СХЕМЫ (ЭДС)', schemaNames.join(' · ') || null),
      div,
      row('КАРТА РЕЖИМОВ', modeNames.join(' · ') || null),
      div,
      row('РАННИЙ ДИСФУНКЦИОНАЛЬНЫЙ ОПЫТ', c.earlyExperience as string),
      div,
      row('НЕУДОВЛЕТВОРЁННЫЕ БАЗОВЫЕ ПОТРЕБНОСТИ', c.unmetNeeds as string),
      div,
      row('СХЕМНЫЕ ТРИГГЕРЫ', c.triggers as string),
      div,
      row('ДЕЗАДАПТИВНЫЕ КОПИНГИ', c.copingStyles as string),
      div,
      row('АКТУАЛЬНЫЕ ПРОБЛЕМЫ И СИМПТОМЫ', c.currentProblems as string),
      div,
      row('ЦЕЛИ СХЕМА-ТЕРАПИИ', c.goals as string),
      div,
      '',
      '@SchemeHappens · Схема-лаб',
    ].join('\n');
  }

  async function handleExport() {
    const text = buildExportText();
    if (!text) return;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2500);
      }
    } catch {
      try { await navigator.clipboard.writeText(text); setExportCopied(true); setTimeout(() => setExportCopied(false), 2500); } catch { /* ignore */ }
    }
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
      });
      setConcept(saved);
      setLocalConcept(saved);
      setConceptDirty(false);
    } catch { setConceptError('Ошибка сохранения. Проверь соединение.'); } finally { setConceptSaving(false); }
  }

  async function addVirtualClient() {
    const name = virtualNameInput.trim();
    if (!name) { setVirtualNameError('Введи имя клиента'); return; }
    setVirtualNameLoading(true);
    setVirtualNameError('');
    try {
      const updated = await api.addVirtualClient(name);
      setClients(updated);
      setVirtualNameInput('');
    } catch { setVirtualNameError('Ошибка. Попробуй ещё раз.'); } finally { setVirtualNameLoading(false); }
  }

  async function addClientManually() {
    const id = parseInt(manualIdInput.trim(), 10);
    if (!id || isNaN(id)) { setManualIdError('Введи числовой Telegram ID'); return; }
    setManualIdLoading(true);
    setManualIdError('');
    try {
      const updated = await api.addClientManually(id);
      setClients(updated);
      setManualIdInput('');
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('not found') || msg.includes('Not found')) setManualIdError('Пользователь не найден в базе');
      else if (msg.includes('Already') || msg.includes('already')) setManualIdError('Клиент уже подключён');
      else setManualIdError('Ошибка. Проверь ID.');
    } finally { setManualIdLoading(false); }
  }

  const activeSchemaIds = (localConcept.schemaIds ?? concept?.schemaIds ?? []) as string[];
  const activeModeIds = (localConcept.modeIds ?? concept?.modeIds ?? []) as string[];
  const ysqSchemaIds = clientData?.ysqActiveSchemaIds ?? [];
  const selfSchemaIds = clientData?.mySchemaIds ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: `${safeTop + 20}px 20px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            onClick={view === 'list' ? onClose : () => { onViewChange('list'); setRenamingAlias(false); setYsqRequested(false); }}
            style={{ fontSize: 24, color: 'rgba(var(--fg-rgb),0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            ‹
          </div>
          {view === 'list' || !selectedClient ? (
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Кабинет терапевта</div>
          ) : renamingAlias ? (
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveAlias()}
                placeholder={selectedClient.name ?? 'Имя клиента'}
                maxLength={40}
                style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.07)', border: '1px solid rgba(var(--fg-rgb),0.15)', borderRadius: 10, padding: '7px 10px', outline: 'none', color: 'var(--text)', fontSize: 15 }}
              />
              <button onClick={saveAlias} disabled={aliasSaving} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: '#a78bfa', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {aliasSaving ? '...' : '✓'}
              </button>
              <button onClick={() => setRenamingAlias(false)} style={{ padding: '7px 10px', borderRadius: 10, border: 'none', background: 'rgba(var(--fg-rgb),0.07)', color: 'rgba(var(--fg-rgb),0.5)', fontSize: 13, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {selectedClient.clientAlias ?? selectedClient.name ?? 'Клиент'}
              </div>
              <button
                onClick={() => { setAliasInput(selectedClient.clientAlias ?? selectedClient.name ?? ''); setRenamingAlias(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(var(--fg-rgb),0.3)', padding: '2px 4px' }}
              >
                ✎
              </button>
            </div>
          )}
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <SectionLabel purple mb={12}>Пригласить клиента</SectionLabel>
              {!inviteUrl ? (
                <button
                  onClick={createInvite} disabled={inviteLoading}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: inviteLoading ? 0.6 : 1 }}
                >
                  {inviteLoading ? 'Создаю...' : '+ Создать ссылку'}
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
            </div>

            {/* Add offline/virtual client */}
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', marginBottom: 10 }}>Добавить клиента (без Telegram)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={virtualNameInput}
                  onChange={e => { setVirtualNameInput(e.target.value); setVirtualNameError(''); }}
                  onKeyDown={e => e.key === 'Enter' && addVirtualClient()}
                  placeholder="Имя клиента"
                  style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.06)', border: `1px solid ${virtualNameError ? '#f87171' : 'rgba(var(--fg-rgb),0.12)'}`, borderRadius: 10, padding: '9px 12px', outline: 'none', color: 'var(--text)', fontSize: 14 }}
                />
                <button
                  onClick={addVirtualClient} disabled={virtualNameLoading || !virtualNameInput.trim()}
                  style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: virtualNameInput.trim() ? '#a78bfa' : 'rgba(var(--fg-rgb),0.05)', color: virtualNameInput.trim() ? '#fff' : 'rgba(var(--fg-rgb),0.3)', fontSize: 13, fontWeight: 600, cursor: virtualNameInput.trim() ? 'pointer' : 'default', flexShrink: 0 }}
                >
                  {virtualNameLoading ? '...' : '+ Добавить'}
                </button>
              </div>
              {virtualNameError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{virtualNameError}</div>}
            </div>

            {/* Add by Telegram ID */}
            <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 16, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Добавить по Telegram ID</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={manualIdInput}
                  onChange={e => { setManualIdInput(e.target.value); setManualIdError(''); }}
                  onKeyDown={e => e.key === 'Enter' && addClientManually()}
                  placeholder="123456789"
                  inputMode="numeric"
                  style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.06)', border: `1px solid ${manualIdError ? '#f87171' : 'rgba(var(--fg-rgb),0.12)'}`, borderRadius: 10, padding: '9px 12px', outline: 'none', color: 'var(--text)', fontSize: 14 }}
                />
                <button
                  onClick={addClientManually} disabled={manualIdLoading || !manualIdInput.trim()}
                  style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: manualIdInput.trim() ? 'rgba(var(--fg-rgb),0.1)' : 'rgba(var(--fg-rgb),0.05)', color: manualIdInput.trim() ? 'var(--text)' : 'rgba(var(--fg-rgb),0.3)', fontSize: 13, fontWeight: 600, cursor: manualIdInput.trim() ? 'pointer' : 'default', flexShrink: 0 }}
                >
                  {manualIdLoading ? '...' : 'Добавить'}
                </button>
              </div>
              {manualIdError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{manualIdError}</div>}
              <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)', marginTop: 6 }}>Клиент должен хотя бы раз открыть приложение</div>
            </div>

            <SectionLabel mb={10}>Клиенты</SectionLabel>
            {loading ? (
              <div style={{ color: 'rgba(var(--fg-rgb),0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Загружаю...</div>
            ) : clients.length === 0 ? (
              <div style={{ color: 'rgba(var(--fg-rgb),0.3)', fontSize: 14, textAlign: 'center', paddingTop: 20, lineHeight: 1.7 }}>
                Нет подключённых клиентов.<br />Пригласи по ссылке или добавь по ID выше.
              </div>
            ) : clients.map(c => (
              <div key={c.telegramId} onClick={() => openClient(c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{c.clientAlias ?? c.name ?? `ID ${c.telegramId}`}</div>
                  <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)' }}>
                    {streakEmoji(c.streak)} {c.streak} дн.{c.lastActiveDate && ` · ${fmtDate(c.lastActiveDate)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.todayIndex !== null && <div style={{ fontSize: 16, fontWeight: 700, color: indexColor(c.todayIndex) }}>{c.todayIndex}</div>}
                  <span style={{ color: 'rgba(var(--fg-rgb),0.2)', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── CLIENT VIEW ── */}
        {view === 'client' && selectedClient && (
          <>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 4 }}>Серия</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fb923c' }}>{streakEmoji(selectedClient.streak)} {selectedClient.streak}</div>
              </div>
              {selectedClient.todayIndex !== null && (
                <div style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 4 }}>Индекс</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: indexColor(selectedClient.todayIndex) }}>{selectedClient.todayIndex}</div>
                </div>
              )}
              {selectedClient.lastActiveDate && (
                <div style={{ flex: 1, background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 4 }}>Активность</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(var(--fg-rgb),0.7)' }}>{fmtDate(selectedClient.lastActiveDate)}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={handleRequestYsq}
                style={{ width: '100%', padding: '11px 16px', borderRadius: 14, border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.06)', color: ysqRequested ? '#06d6a0' : 'rgba(96,165,250,0.8)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {ysqRequested ? '✓ Запрос отправлен' : '📋 Запросить тест YSQ'}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(var(--fg-rgb),0.05)', borderRadius: 12, padding: 3, marginBottom: 20, gap: 2 }}>
              {([['tasks', '📋 Задания'], ['notes', '📝 Заметки'], ['concept', '🗂 Концептуализация']] as [ClientTab, string][]).map(([tab, label]) => (
                <button
                  key={tab} onClick={() => setClientTab(tab)}
                  style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, background: clientTab === tab ? 'rgba(167,139,250,0.25)' : 'transparent', color: clientTab === tab ? '#a78bfa' : 'rgba(var(--fg-rgb),0.4)', fontSize: 12, fontWeight: clientTab === tab ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── TASKS TAB ── */}
            {clientTab === 'tasks' && (
              <>
                <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  {clientTasks.length === 0 ? (
                    <div style={{ padding: '20px 16px', fontSize: 13, color: 'rgba(var(--fg-rgb),0.3)', textAlign: 'center' }}>Нет заданий</div>
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
                <button onClick={() => setShowAssign(true)} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  + Назначить задание
                </button>
              </>
            )}

            {/* ── NOTES TAB ── */}
            {clientTab === 'notes' && (
              <>
                <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
                  <textarea
                    value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                    placeholder="Заметка сессии: наблюдения, гипотезы, динамика, план следующей встречи..."
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
                      <button onClick={() => removeNote(note.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.4)', fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.text}</div>
                  </div>
                ))}
              </>
            )}

            {/* ── CONCEPTUALIZATION TAB ── */}
            {clientTab === 'concept' && (
              <>
                {/* YSQ hint section */}
                {ysqSchemaIds.length > 0 && (
                  <div style={{ background: 'rgba(79,163,247,0.07)', border: '1px solid rgba(79,163,247,0.2)', borderRadius: 14, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(79,163,247,0.8)', textTransform: 'uppercase', marginBottom: 8 }}>
                      📊 YSQ — результаты теста клиента
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {ysqSchemaIds.map(id => {
                        const schema = SCHEMA_DOMAINS.flatMap(d => d.schemas).find(s => s.id === id);
                        return schema ? (
                          <span key={id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(79,163,247,0.15)', color: 'rgba(79,163,247,0.9)' }}>
                            {schema.emoji} {schema.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    {clientData?.ysqCompletedAt && (
                      <div style={{ fontSize: 10, color: 'rgba(var(--fg-rgb),0.25)', marginTop: 6 }}>Тест пройден: {fmtDate(clientData.ysqCompletedAt.slice(0, 10))}</div>
                    )}
                  </div>
                )}

                {/* Self-selected schemas hint */}
                {selfSchemaIds.length > 0 && (
                  <div style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 14, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Схемы, отмеченные клиентом
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selfSchemaIds.map(id => {
                        const schema = SCHEMA_DOMAINS.flatMap(d => d.schemas).find(s => s.id === id);
                        return schema ? (
                          <span key={id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(var(--fg-rgb),0.07)', color: 'rgba(var(--fg-rgb),0.5)' }}>
                            {schema.emoji} {schema.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Active schemas selector */}
                <SectionLabel mb={10}>Актуальные схемы (ЭДС)</SectionLabel>
                {SCHEMA_DOMAINS.map(domain => (
                  <div key={domain.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: domain.color + 'aa', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>
                      {domain.domain}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {domain.schemas.map(schema => {
                        const active = activeSchemaIds.includes(schema.id);
                        const fromYsq = ysqSchemaIds.includes(schema.id);
                        return (
                          <button
                            key={schema.id} onClick={() => toggleSchemaId(schema.id)}
                            style={{
                              padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                              border: fromYsq ? `1px solid ${domain.color}55` : '1px solid transparent',
                              background: active ? domain.color + '30' : 'rgba(var(--fg-rgb),0.05)',
                              color: active ? domain.color : 'rgba(var(--fg-rgb),0.45)',
                              fontSize: 12, fontWeight: active ? 600 : 400,
                              transition: 'all 0.15s ease',
                            }}
                            title={schema.desc}
                          >
                            {schema.emoji} {schema.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Mode map */}
                <div style={{ marginTop: 8 }}><SectionLabel mb={10}>Карта режимов</SectionLabel></div>
                {MODE_GROUPS.map(group => (
                  <div key={group.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: group.color + 'aa', textTransform: 'uppercase', marginBottom: 5, paddingLeft: 2 }}>
                      {group.group}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {group.items.map(mode => {
                        const active = activeModeIds.includes(mode.id);
                        return (
                          <button
                            key={mode.id} onClick={() => toggleModeId(mode.id)}
                            style={{
                              padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              background: active ? group.color + '30' : 'rgba(var(--fg-rgb),0.05)',
                              color: active ? group.color : 'rgba(var(--fg-rgb),0.45)',
                              fontSize: 12, fontWeight: active ? 600 : 400,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {mode.emoji} {mode.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Text fields */}
                <div style={{ marginTop: 4 }}>
                  {CONCEPT_FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(var(--fg-rgb),0.35)', textTransform: 'uppercase', marginBottom: 6 }}>
                        {label}
                      </div>
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

                {/* Save button */}
                <button
                  onClick={saveConcept} disabled={conceptSaving || !conceptDirty}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: conceptDirty ? 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(79,163,247,0.2))' : 'rgba(var(--fg-rgb),0.05)', color: conceptDirty ? 'var(--text)' : 'rgba(var(--fg-rgb),0.25)', fontSize: 14, fontWeight: 600, cursor: conceptDirty ? 'pointer' : 'default', opacity: conceptSaving ? 0.6 : 1 }}
                >
                  {conceptSaving ? 'Сохраняю...' : conceptDirty ? 'Сохранить концептуализацию' : concept ? `✓ Сохранено ${fmtDate(concept.updatedAt.slice(0, 10))}` : 'Нет изменений'}
                </button>
                {conceptError && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 6 }}>{conceptError}</div>}

                {/* Export */}
                {concept && (
                  <button
                    onClick={handleExport}
                    style={{ width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: exportCopied ? 'rgba(6,214,160,0.1)' : 'transparent', color: exportCopied ? '#06d6a0' : 'rgba(var(--fg-rgb),0.4)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    {exportCopied ? '✓ Скопировано' : '↗ Экспорт / Поделиться'}
                  </button>
                )}

                {/* History */}
                {concept && (!concept.history || (concept.history as unknown[]).length === 0) && (
                  <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)', textAlign: 'center', marginTop: 12 }}>
                    История появится после следующего сохранения
                  </div>
                )}
                {concept && concept.history && (concept.history as unknown[]).length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <button
                      onClick={() => setShowHistory(h => !h)}
                      style={{ background: 'none', border: 'none', color: 'rgba(var(--fg-rgb),0.3)', fontSize: 12, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>{showHistory ? '▲' : '▼'}</span>
                      История изменений ({(concept.history as unknown[]).length})
                    </button>
                    {showHistory && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(concept.history as Array<{
                          savedAt: string; goals?: string | null; earlyExperience?: string | null;
                          schemaIds?: string[]; modeIds?: string[];
                        }>).map((snap, i) => (
                          <div key={i} style={{ background: 'rgba(var(--fg-rgb),0.02)', border: '1px solid rgba(var(--fg-rgb),0.05)', borderRadius: 12, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 6 }}>
                              {fmtDate(snap.savedAt.slice(0, 10))}
                            </div>
                            {snap.goals && (
                              <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.5)', marginBottom: 4 }}>
                                <span style={{ color: 'rgba(var(--fg-rgb),0.2)' }}>Цели: </span>{snap.goals.slice(0, 120)}{snap.goals.length > 120 ? '...' : ''}
                              </div>
                            )}
                            {snap.earlyExperience && (
                              <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.5)' }}>
                                <span style={{ color: 'rgba(var(--fg-rgb),0.2)' }}>Опыт: </span>{snap.earlyExperience.slice(0, 120)}{snap.earlyExperience.length > 120 ? '...' : ''}
                              </div>
                            )}
                            {(snap.schemaIds?.length ?? 0) > 0 && (
                              <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.25)', marginTop: 4 }}>
                                Схемы: {snap.schemaIds!.length}шт · Режимы: {snap.modeIds?.length ?? 0}шт
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
