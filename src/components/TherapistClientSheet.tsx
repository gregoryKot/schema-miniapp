import { useEffect, useState } from 'react';
import { api, TherapyClientSummary, UserTask } from '../api';
import { TaskCreateSheet } from './TaskCreateSheet';
import { SectionLabel } from './SectionLabel';

interface Props {
  onClose: () => void;
}

type View = 'list' | 'client';

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
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

export function TherapistClientSheet({ onClose }: Props) {
  const [view, setView] = useState<View>('list');
  const [clients, setClients] = useState<TherapyClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<TherapyClientSummary | null>(null);
  const [clientTasks, setClientTasks] = useState<UserTask[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    api.getTherapyClients().then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function openClient(client: TherapyClientSummary) {
    setSelectedClient(client);
    setView('client');
    const tasks = await api.getTherapyTasksForClient(client.telegramId).catch(() => []);
    setClientTasks(tasks);
  }

  async function createInvite() {
    setInviteLoading(true);
    try {
      const { url } = await api.createTherapyInvite();
      setInviteUrl(url);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    } catch { /* ignore */ } finally { setInviteLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#060a12', overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            onClick={view === 'list' ? onClose : () => setView('list')}
            style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: 1 }}
          >
            ‹
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>
            {view === 'list' ? 'Кабинет терапевта' : selectedClient?.name ?? 'Клиент'}
          </div>
        </div>

        {view === 'list' && (
          <>
            {/* Invite button */}
            <div
              onClick={createInvite}
              style={{
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>
                  {inviteLoading ? 'Создаю...' : '+ Пригласить клиента'}
                </div>
                {inviteUrl && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    Ссылка скопирована: {inviteUrl.slice(0, 40)}...
                  </div>
                )}
              </div>
            </div>

            {/* Client list */}
            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>
                Загружаю...
              </div>
            ) : clients.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>
                Нет подключённых клиентов.<br />Пригласи клиента по ссылке выше.
              </div>
            ) : clients.map(c => (
              <div
                key={c.telegramId}
                onClick={() => openClient(c)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {c.name ?? `ID ${c.telegramId}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {streakEmoji(c.streak)} {c.streak} дн.
                    {c.lastActiveDate && ` · Активен: ${formatDate(c.lastActiveDate)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.todayIndex !== null && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: indexColor(c.todayIndex) }}>
                      {c.todayIndex}
                    </div>
                  )}
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </>
        )}

        {view === 'client' && selectedClient && (
          <>
            {/* Tasks */}
            <SectionLabel mb={12}>Задания</SectionLabel>
            {clientTasks.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 16 }}>
                Нет заданий
              </div>
            ) : clientTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>
                  {task.done === true ? '✅' : task.done === false ? '❌' : '⏳'}
                </span>
                <div>
                  <div style={{ fontSize: 14, color: '#fff' }}>{task.text}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {task.dueDate ? `Срок: ${formatDate(task.dueDate)}` : formatDate(task.createdAt)}
                    {task.needId && ` · ${task.needId}`}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowAssign(true)}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
                background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16,
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
