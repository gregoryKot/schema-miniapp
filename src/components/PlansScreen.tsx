import { useState, useEffect } from 'react';
import { api, PracticePlan } from '../api';
import { Loader } from './Loader';
import { getTelegramSafeTop } from '../utils/safezone';

interface Props {
  onClose: () => void;
  onOpenTracker?: () => void;
}

export function PlansScreen({ onClose, onOpenTracker }: Props) {
  const safeTop = getTelegramSafeTop();
  const [plans, setPlans] = useState<PracticePlan[] | null>(null);

  useEffect(() => {
    api.getPlanHistory(30).then(setPlans).catch(() => setPlans([]));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#060a12', overflowY: 'auto', paddingTop: safeTop }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
        <span onClick={onClose} style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1 }}>‹</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>История планов</span>
      </div>

      <div style={{ padding: '12px 16px 140px' }}>
        {!plans ? (
          <Loader minHeight="30vh" />
        ) : plans.length === 0 ? (
          <div style={{ padding: '32px 0' }}>
            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 16 }}>📋</div>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Планов пока нет
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: 20 }}>
              Планы создаются в трекере — выбери потребность и нажми «Запланировать практику»
            </div>
            {onOpenTracker && (
              <button onClick={() => { onClose(); onOpenTracker(); }} style={{ display: 'block', margin: '0 auto', padding: '12px 28px', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Открыть трекер
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{
                background: plan.done === true ? 'rgba(6,214,160,0.07)' : plan.done === false ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${plan.done === true ? 'rgba(6,214,160,0.2)' : plan.done === false ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14, padding: '13px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{plan.scheduledDate}</div>
                  <div style={{ fontSize: 15 }}>{plan.done === true ? '✅' : plan.done === false ? '❌' : '⏳'}</div>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{plan.practiceText}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
