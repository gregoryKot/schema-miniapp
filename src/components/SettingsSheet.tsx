import { useState, useEffect } from 'react';
import { api, UserSettings, PairsData } from '../api';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from './YSQTestSheet';
import { BottomSheet } from './BottomSheet';
import { Loader } from './Loader';
import { getTelegramSafeTop } from '../utils/safezone';

const TIMEZONES = [
  { label: 'Лос-Анджелес (UTC−8)', iana: 'America/Los_Angeles' },
  { label: 'Нью-Йорк (UTC−5)',      iana: 'America/New_York' },
  { label: 'Лондон (UTC+0)',         iana: 'Europe/London' },
  { label: 'Берлин (UTC+1)',         iana: 'Europe/Berlin' },
  { label: 'Киев / Израиль (UTC+2)', iana: 'Europe/Kyiv' },
  { label: 'Москва (UTC+3)',         iana: 'Europe/Moscow' },
  { label: 'Дубай (UTC+4)',          iana: 'Asia/Dubai' },
  { label: 'Ташкент (UTC+5)',        iana: 'Asia/Tashkent' },
  { label: 'Алматы (UTC+6)',         iana: 'Asia/Almaty' },
  { label: 'Пекин (UTC+8)',          iana: 'Asia/Shanghai' },
];

const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

function pad(n: number) { return String(n).padStart(2, '0'); }

type View = 'main' | 'time' | 'tz';

interface Props {
  onClose: () => void;
}

export function SettingsSheet({ onClose }: Props) {
  const safeTop = getTelegramSafeTop();
  const [view, setView]             = useState<View>('main');
  const [settings, setSettings]     = useState<UserSettings | null>(null);
  const [pairData, setPairData]     = useState<PairsData | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairInviteUrl, setPairInviteUrl] = useState('');
  const [pairInviteCopied, setPairInviteCopied] = useState(false);
  const [joinCode, setJoinCode]     = useState('');
  const [joinView, setJoinView]     = useState<'main' | 'join'>('main');
  const [joinError, setJoinError]   = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showNotifyInfo, setShowNotifyInfo] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setSettings({ notifyEnabled: false, notifyLocalHour: 21, notifyTimezone: 'Europe/Moscow', notifyReminderEnabled: false, pairCardDismissed: false, mySchemaIds: [], myModeIds: [] }));
    setPairLoading(true);
    api.getPair().then(setPairData).catch(() => {}).finally(() => setPairLoading(false));
  }, []);

  async function patch(update: Partial<UserSettings>) {
    if (!settings) return;
    setSettings(s => s ? { ...s, ...update } : s);
    await api.updateSettings(update).catch(() => {});
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  }

  async function handleCreateInvite() {
    setPairLoading(true);
    try {
      const { url } = await api.createPairInvite();
      await api.getPair().then(setPairData);
      setPairInviteUrl(url);
      try { if (navigator.share) await navigator.share({ text: `Давай отслеживать потребности вместе! ${url}` }); } catch {}
    } finally { setPairLoading(false); }
  }

  async function handleCopyPairInvite() {
    try { await navigator.clipboard.writeText(pairInviteUrl); setPairInviteCopied(true); setTimeout(() => setPairInviteCopied(false), 2000); } catch {}
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setPairLoading(true);
    setJoinError(false);
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      await api.getPair().then(setPairData);
      setJoinView('main');
    } catch {
      setJoinError(true);
    } finally {
      setPairLoading(false);
    }
  }

  async function handleLeave(code: string) {
    await api.leavePair(code).catch(() => {});
    await api.getPair().then(setPairData).catch(() => {});
  }

  if (!settings) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#060a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader minHeight="40vh" />
      </div>
    );
  }

  const localHour = settings.notifyLocalHour;
  const tzLabel = TIMEZONES.find(t => t.iana === settings.notifyTimezone)?.label ?? settings.notifyTimezone;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 80, background: '#060a12',
        overflowY: 'auto', paddingTop: safeTop,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
          <span onClick={() => view !== 'main' ? setView('main') : onClose()} style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1 }}>‹</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#fff', flex: 1 }}>
            {view === 'time' ? 'Время уведомления' : view === 'tz' ? 'Часовой пояс' : 'Настройки'}
          </span>
          <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, opacity: savedToast ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            Сохранено ✓
          </span>
        </div>

        <div style={{ padding: '8px 16px 120px' }}>

          {/* ── TIME VIEW ── */}
          {view === 'time' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {HOURS.map(h => {
                const active = h === localHour;
                return (
                  <div key={h} onClick={async () => { await patch({ notifyLocalHour: h }); setView('main'); }}
                    style={{ padding: '12px 0', borderRadius: 12, textAlign: 'center', background: active ? '#a78bfa' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: active ? 600 : 400, cursor: 'pointer' }}
                  >{pad(h)}:00</div>
                );
              })}
            </div>
          )}

          {/* ── TZ VIEW ── */}
          {view === 'tz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TIMEZONES.map(tz => {
                const active = tz.iana === settings.notifyTimezone;
                return (
                  <div key={tz.iana} onClick={async () => { await patch({ notifyTimezone: tz.iana }); setView('main'); }}
                    style={{ padding: '13px 16px', borderRadius: 12, background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#a78bfa' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  >{tz.label}{active && <span>✓</span>}</div>
                );
              })}
            </div>
          )}

          {/* ── MAIN VIEW ── */}
          {view === 'main' && (
            <>
              {/* Уведомления */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <SettingsLabel>УВЕДОМЛЕНИЯ</SettingsLabel>
                  <span onClick={() => setShowNotifyInfo(true)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginBottom: 10 }}>?</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: settings.notifyEnabled ? 0 : 8 }}>
                  <Row label="Итоги дня" right={<Toggle on={settings.notifyEnabled} onClick={() => patch({ notifyEnabled: !settings.notifyEnabled })} />} />
                  {settings.notifyEnabled && (
                    <>
                      <Row label="Напоминание заполнить" right={<Toggle on={!!settings.notifyReminderEnabled} onClick={() => patch({ notifyReminderEnabled: !settings.notifyReminderEnabled })} />} divider />
                      <Row label="Время" right={<RowRight text={`${pad(localHour)}:00`} />} onClick={() => setView('time')} divider />
                      <Row label="Часовой пояс" right={<RowRight text={tzLabel} small />} onClick={() => setView('tz')} divider />
                    </>
                  )}
                </div>
                {settings.notifyEnabled && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 8, padding: '0 4px' }}>
                    Уведомления приходят через{' '}
                    <a href="https://t.me/Emotional_Needs_bot" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }}>@Emotional_Needs_bot</a>
                  </div>
                )}
              </div>

              {/* Партнёр */}
              <div style={{ marginBottom: 8 }}>
                <SettingsLabel>ПАРТНЁР</SettingsLabel>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
                  {pairLoading && !pairData ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Загрузка...</div>
                  ) : pairData && pairData.partners.length > 0 ? (
                    <div>
                      {pairData.partners.map(p => (
                        <div key={p.code} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{p.partnerName ?? 'Друг'} сегодня</div>
                          {p.partnerTodayDone && p.partnerIndex !== null ? (
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                              {(p.partnerIndex ?? 0).toFixed(1)}<span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/10</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Ещё не заполнил дневник</div>
                          )}
                          <button onClick={() => handleLeave(p.code)} style={{ width: '100%', padding: 12, border: 'none', borderRadius: 12, background: 'rgba(255,100,100,0.1)', color: 'rgba(255,100,100,0.7)', fontSize: 14, cursor: 'pointer' }}>
                            Выйти из пары
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : joinView === 'main' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 4 }}>
                        Приглашай друга — видите индексы дня друг друга
                      </div>
                      <button onClick={handleCreateInvite} disabled={pairLoading} style={{ padding: 14, border: 'none', borderRadius: 12, background: '#a78bfa', color: '#fff', fontSize: 14, fontWeight: 600, cursor: pairLoading ? 'default' : 'pointer' }}>
                        {pairLoading ? '...' : pairData?.pendingCode ? 'Создать новую ссылку' : 'Создать приглашение'}
                      </button>
                      {pairInviteUrl && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Скопируй и отправь другу:</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 10, userSelect: 'all' }}>{pairInviteUrl}</div>
                          <button onClick={handleCopyPairInvite} style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: pairInviteCopied ? 'rgba(6,214,160,0.2)' : 'rgba(167,139,250,0.2)', color: pairInviteCopied ? '#06d6a0' : '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {pairInviteCopied ? '✓ Скопировано' : 'Скопировать ссылку'}
                          </button>
                        </div>
                      )}
                      <button onClick={() => setJoinView('join')} style={{ padding: 14, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>
                        Есть код приглашения
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span onClick={() => setJoinView('main')} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Ввести код</span>
                      </div>
                      <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Код из приглашения"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, fontFamily: 'monospace', outline: 'none', letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box', marginBottom: 12 }}
                      />
                      {joinError && (
                        <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginBottom: 8 }}>
                          Код не найден или уже использован
                        </div>
                      )}
                      <button onClick={handleJoin} disabled={!joinCode.trim() || pairLoading}
                        style={{ width: '100%', padding: 14, border: 'none', borderRadius: 12, background: joinCode.trim() ? '#a78bfa' : 'rgba(167,139,250,0.3)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                        Присоединиться
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Поделиться + Экспорт */}
              <div style={{ marginBottom: 8 }}>
                <SettingsLabel>ПОДЕЛИТЬСЯ</SettingsLabel>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                  <Row label="Пригласить друга" sub="Поделиться ссылкой на бота" emoji="🔗" onClick={async () => {
                    const text = 'Трекер потребностей — отслеживай своё состояние каждый день. t.me/Emotional_Needs_bot';
                    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { try { await navigator.clipboard.writeText(text); } catch {} }
                  }} />
                  <Row label="Для терапевта" sub="Сводка за 30 дней" emoji="📤" divider onClick={async () => {
                    const { text } = await api.getExport();
                    let shared = false;
                    try { if (navigator.share) { await navigator.share({ text }); shared = true; } } catch {}
                    if (!shared) { try { await navigator.clipboard.writeText(text); } catch {} setExportText(text); }
                  }} />
                </div>
              </div>

              {/* Конфиденциальность */}
              <div style={{ marginBottom: 8 }}>
                <SettingsLabel>ДАННЫЕ</SettingsLabel>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                  <Row label="О данных и конфиденциальности" emoji="🔒" onClick={() => setShowPrivacy(true)} />
                  <Row label="Удалить все данные" emoji="🗑" divider color="#f87171" onClick={() => { setDeleteConfirm(false); setShowDeleteSheet(true); }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export text overlay */}
      {exportText && (
        <BottomSheet onClose={() => { setExportText(null); setExportCopied(false); }} zIndex={300}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Сводка для терапевта</div>
            <pre style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 14, userSelect: 'all', fontFamily: 'monospace' }}>
              {exportText}
            </pre>
            <button onClick={async () => { try { await navigator.clipboard.writeText(exportText); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000); } catch {} }}
              style={{ width: '100%', padding: '13px 0', border: 'none', borderRadius: 12, background: exportCopied ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.08)', color: exportCopied ? '#06d6a0' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {exportCopied ? '✓ Скопировано' : 'Скопировать'}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Notify info */}
      {showNotifyInfo && (
        <BottomSheet onClose={() => setShowNotifyInfo(false)} zIndex={300}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 16 }}>Зачем уведомления</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>Регулярность — это всё. Один раз в день, в одно и то же время, формирует привычку наблюдать за собой.</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}><b style={{ color: '#fff' }}>Итоги дня</b> — приходят в это же время, если дневник заполнен.</p>
          </div>
        </BottomSheet>
      )}

      {/* Privacy */}
      {showPrivacy && (
        <BottomSheet onClose={() => { setShowPrivacy(false); setDeleteConfirm(false); }} zIndex={300}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Данные и конфиденциальность</div>

            {[
              { title: 'Что хранится на сервере', text: 'Дневник, оценки, заметки, практики, результаты тестов — всё привязано к Telegram-аккаунту и доступно с любого устройства.' },
              { title: 'Передача третьим лицам', text: 'Данные не продаются и не передаются рекламным сетям или третьим лицам. Никогда.' },
            ].map(block => (
              <div key={block.title} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>{block.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{block.text}</div>
              </div>
            ))}

            {(!!localStorage.getItem(YSQ_PROGRESS_KEY) || !!localStorage.getItem(YSQ_RESULT_KEY)) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Удалить данные теста YSQ-R</div>
                <button onClick={() => { localStorage.removeItem(YSQ_PROGRESS_KEY); localStorage.removeItem(YSQ_RESULT_KEY); api.deleteYsqResult().catch(() => {}); setShowPrivacy(false); }}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Удалить результаты теста
                </button>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Удалить все мои данные</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 10 }}>
                Дневник, оценки, практики, колесо детства — всё удалится с сервера. Действие необратимо.
              </div>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Удалить все данные
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', marginBottom: 12, fontWeight: 500 }}>Уверен(а)? Это нельзя отменить.</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>
                      Отмена
                    </button>
                    <button disabled={deleting} onClick={async () => { setDeleting(true); try { await api.deleteAllUserData(); localStorage.clear(); sessionStorage.clear(); window.location.reload(); } catch { setDeleting(false); setDeleteConfirm(false); } }}
                      style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'default' : 'pointer' }}>
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

      {/* Delete sheet — прямой флоу */}
      {showDeleteSheet && (
        <BottomSheet onClose={() => { setShowDeleteSheet(false); setDeleteConfirm(false); }} zIndex={300}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Удалить все данные</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
              Дневник, оценки, практики, колесо детства, результаты тестов — всё удалится с сервера. Это действие необратимо.
            </div>
            {!deleteConfirm ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDeleteSheet(false)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>
                  Отмена
                </button>
                <button onClick={() => setDeleteConfirm(true)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Удалить
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, color: '#f87171', textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>Точно? Восстановить невозможно.</div>
                <button disabled={deleting} onClick={async () => { setDeleting(true); try { await api.deleteAllUserData(); localStorage.clear(); sessionStorage.clear(); window.location.reload(); } catch { setDeleting(false); setDeleteConfirm(false); } }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#ef4444', color: '#fff', fontSize: 15, fontWeight: 700, cursor: deleting ? 'default' : 'pointer' }}>
                  {deleting ? 'Удаляем...' : 'Да, удалить всё навсегда'}
                </button>
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SettingsLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 10, paddingTop: 4 }}>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ width: 44, height: 26, borderRadius: 13, flexShrink: 0, background: on ? '#a78bfa' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}

function RowRight({ text, small }: { text: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: small ? 13 : 15, color: 'rgba(255,255,255,0.5)', textAlign: 'right', maxWidth: 160 }}>{text}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
    </div>
  );
}

function Row({ label, sub, emoji, right, onClick, divider, color }: { label: string; sub?: string; emoji?: string; right?: React.ReactNode; onClick?: () => void; divider?: boolean; color?: string }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: onClick ? 'pointer' : 'default', borderTop: divider ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
      {emoji && <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: color ?? '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right ?? (onClick && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>)}
    </div>
  );
}
