import { useState, useEffect } from 'react';
import { api, PracticePlan } from '../api';
import { Loader } from './Loader';
import { getTelegramSafeTop } from '../utils/safezone';

interface Props {
  onClose: () => void;
}

export function PlansScreen({ onClose }: Props) {
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
            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
              Планы создаются в трекере потребностей —<br />в разделе «Сегодня» выбери потребность<br />и нажми «Запланировать практику»
            </div>
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
