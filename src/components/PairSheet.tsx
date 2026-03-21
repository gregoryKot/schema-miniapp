import { useState, useEffect } from 'react';
import { api } from '../api';
import { BottomSheet } from './BottomSheet';

interface PairData {
  paired: boolean;
  partnerIndex: number | null;
  partnerTodayDone: boolean;
  code: string | null;
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

  useEffect(() => { api.getPair().then(setData).catch(e => console.error('getPair failed', e)); }, []);

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
    try {
      await api.joinPair(joinCode.trim().toUpperCase());
      const updated = await api.getPair();
      setData(updated);
      setView('main');
    } catch (e) {
      console.error('joinPair failed', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    await api.leavePair();
    setData(await api.getPair());
  }

  // suppress unused variable warning
  void inviteUrl;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Вместе</div>

        {!data ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>Загрузка...</div>
        ) : data.paired ? (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Партнёр сегодня</div>
              {data.partnerTodayDone && data.partnerIndex !== null ? (
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
                  {data.partnerIndex.toFixed(1)}
                  <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/10</span>
                </div>
              ) : (
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Ещё не заполнил дневник</div>
              )}
            </div>
            <button
              onClick={handleLeave}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 12,
                background: 'rgba(255,100,100,0.1)', color: 'rgba(255,100,100,0.7)',
                fontSize: 14, cursor: 'pointer',
              }}
            >Выйти из пары</button>
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
