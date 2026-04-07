import { useEffect, useRef, useState } from 'react';
import { api, TherapyClientSummary, UserTask } from '../api';
import { TaskCreateSheet } from './TaskCreateSheet';
import { SectionLabel } from './SectionLabel';
import { fmtDate } from '../utils/format';
import { getTelegramSafeTop } from '../utils/safezone';

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

export function TherapistClientSheet({ view, onViewChange, onClose }: Props) {
  const safeTop = getTelegramSafeTop();
  const [clients, setClients] = useState<TherapyClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<TherapyClientSummary | null>(null);
  const [clientTasks, setClientTasks] = useState<UserTask[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getTherapyClients().then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function openClient(client: TherapyClientSummary) {
    setSelectedClient(client);
    onViewChange('client');
    const tasks = await api.getTherapyTasksForClient(client.telegramId).catch(() => []);
    setClientTasks(tasks);
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#060a12', overflowY: 'auto' }}>
      <div style={{ padding: `${safeTop + 20}px 20px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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
            <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
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
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>
                Загружаю...
              </div>
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
                    <div style={{ fontSize: 16, fontWeight: 700, color: indexColor(c.todayIndex) }}>
                      {c.todayIndex}
                    </div>
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Серия</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fb923c' }}>{streakEmoji(selectedClient.streak)} {selectedClient.streak}</div>
              </div>
              {selectedClient.todayIndex !== null && (
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Индекс сегодня</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: indexColor(selectedClient.todayIndex) }}>{selectedClient.todayIndex}</div>
                </div>
              )}
              {selectedClient.lastActiveDate && (
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Активность</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{fmtDate(selectedClient.lastActiveDate)}</div>
                </div>
              )}
            </div>

            {/* Tasks */}
            <SectionLabel mb={10}>Задания</SectionLabel>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              {clientTasks.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Нет заданий
                </div>
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
                      {task.dueDate ? `Срок: ${fmtDate(task.dueDate)}` : fmtDate(task.createdAt)}
                      {task.needId && ` · ${task.needId}`}
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
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Назначить задание
            </button>
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
