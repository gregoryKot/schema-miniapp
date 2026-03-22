import { useState, useEffect } from 'react';
import { api } from '../api';
import { BottomSheet } from './BottomSheet';

interface PairData {
  paired: boolean;
  partnerIndex: number | null;
  partnerTodayDone: boolean;
  code: string | null;
  partnerName: string | null;
}

interface Props {
  onClose: () => void;
}

export function PairSheet({ onClose }: Props) {
  const [data, setData] = useState<PairData | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState<'main' | 'join'>('main');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    api.getPair().then(setData).catch(e => { console.error('getPair failed', e); setLoadError(true); });
  }, []);

  async function handleCreateInvite() {
    setLoading(true);
    try {
      const { url } = await api.createPairInvite();
      setInviteUrl(url);
      try {
        if (navigator.share) { await navigator.share({ text: `Давай отслеживать потребности вместе! ${url}` }); }
        else { await navigator.clipboard.writeText(url); }
      } catch {}
      api.getPair().then(setData).catch(() => {});
    } catch (e) {
      console.error('createPairInvite failed', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setJoinError('');
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      const updated = await api.getPair();
      setData(updated);
      setView('main');
    } catch (e) {
      console.error('joinPair failed', e);
      setJoinError('Код не найден или уже использован');
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    try {
      await api.leavePair();
      setData(await api.getPair());
    } catch (e) {
      console.error('leavePair failed', e);
    }
  }

  // suppress unused variable warning
  void inviteUrl;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Вместе</div>

        {!data ? (
          <div style={{ textAlign: 'center', color: loadError ? '#f87171' : 'rgba(255,255,255,0.3)', padding: '40px 0' }}>
            {loadError ? 'Ошибка загрузки — попробуй закрыть и открыть снова' : 'Загрузка...'}
          </div>
        ) : data.paired ? (
          <div>
            {(() => {
              const name = data.partnerName ?? 'Партнёр';
              const done = data.partnerTodayDone && data.partnerIndex !== null;
              const idx = data.partnerIndex ?? 0;
              const color = done ? (idx >= 7 ? '#06d6a0' : idx >= 4 ? '#ffd166' : '#f87171') : 'rgba(255,255,255,0.3)';
              const contextMsg = !done
                ? `${name} ещё не заполнил дневник — когда заполнит, увидишь как день`
                : idx < 4
                  ? `Сегодня у ${name} непростой день. Иногда просто написать пару слов — уже помогает`
                  : idx < 7
                    ? `${name} в норме сегодня. Отслеживаете вместе — это уже кое-что`
                    : `У ${name} хороший день. Приятно, когда у обоих всё неплохо`;
              return (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{name} сегодня</div>
                    {done ? (
                      <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>
                        {idx.toFixed(1)}
                        <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/10</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Ещё не заполнил</div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                    padding: '12px 14px', marginBottom: 16,
                  }}>
                    {contextMsg}
                  </div>
                </>
              );
            })()}

            {confirmLeave ? (
              <div style={{ background: 'rgba(255,100,100,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Выйти из пары с {data.partnerName ?? 'партнёром'}?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmLeave(false)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Отмена</button>
                  <button onClick={handleLeave} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: 'rgba(255,100,100,0.2)', color: '#f87171', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Выйти</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 12, background: 'rgba(255,100,100,0.1)', color: 'rgba(255,100,100,0.7)', fontSize: 14, cursor: 'pointer' }}
              >Выйти из пары</button>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              Приглашай друга или партнёра — видите индексы дня друг друга. Не детали, только число. Просто знать, как день у другого.
            </p>

            {view === 'main' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleCreateInvite}
                  disabled={loading}
                  style={{
                    padding: '14px', border: 'none', borderRadius: 12,
                    background: '#a78bfa', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {data.code ? 'Поделиться ссылкой снова' : 'Создать приглашение'}
                </button>
                <button
                  onClick={() => setView('join')}
                  style={{
                    padding: '14px', border: 'none', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                    fontSize: 14, cursor: 'pointer',
                  }}
                >Есть код приглашения</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span onClick={() => setView('main')} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Ввести код</span>
                </div>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Код из приглашения"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 16, fontFamily: 'monospace', outline: 'none',
                    letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box', marginBottom: 12,
                  }}
                />
                {joinError && (
                  <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', marginBottom: 10 }}>{joinError}</div>
                )}
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim() || loading}
                  style={{
                    width: '100%', padding: '14px', border: 'none', borderRadius: 12,
                    background: joinCode.trim() ? '#a78bfa' : 'rgba(167,139,250,0.3)',
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >Присоединиться</button>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
