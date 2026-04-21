import { useState, useEffect } from 'react';
import { api, PracticePlan } from '../api';
import { Loader } from './Loader';
import { useSafeTop } from '../utils/safezone';

interface Props {
  onClose: () => void;
  onOpenTracker?: () => void;
}

export function PlansScreen({ onClose, onOpenTracker }: Props) {
  const safeTop = useSafeTop();
  const [plans, setPlans] = useState<PracticePlan[] | null>(null);

  useEffect(() => {
    api.getPlanHistory(30).then(setPlans).catch(() => setPlans([]));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--bg)', overflowY: 'auto', paddingTop: safeTop }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
        <span onClick={onClose} style={{ fontSize: 26, color: 'var(--text-sub)', cursor: 'pointer', lineHeight: 1 }}>‹</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>История планов</span>
      </div>

      <div style={{ padding: '12px 16px 140px' }}>
        {!plans ? (
          <Loader minHeight="30vh" />
        ) : plans.length === 0 ? (
          <div style={{ padding: '32px 0' }}>
            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 16 }}>📋</div>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8 }}>
              Планов пока нет
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 20 }}>
              Планы создаются в трекере — выбери потребность и нажми «Запланировать практику»
            </div>
            {onOpenTracker && (
              <button onClick={() => { onClose(); onOpenTracker(); }} style={{ display: 'block', margin: '0 auto', padding: '12px 28px', borderRadius: 14, border: 'none', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Открыть трекер
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plans.map(plan => {
              const isPending = plan.done === null;
              return (
                <div key={plan.id} style={{
                  background: plan.done === true ? 'color-mix(in srgb, var(--accent-green) 7%, transparent)' : plan.done === false ? 'color-mix(in srgb, var(--accent-red) 5%, transparent)' : 'rgba(var(--fg-rgb),0.03)',
                  border: `1px solid ${plan.done === true ? 'color-mix(in srgb, var(--accent-green) 20%, transparent)' : plan.done === false ? 'color-mix(in srgb, var(--accent-red) 15%, transparent)' : 'rgba(var(--fg-rgb),0.07)'}`,
                  borderRadius: 14, padding: '13px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{plan.scheduledDate}</div>
                    <div style={{ fontSize: 15 }}>{plan.done === true ? '✅' : plan.done === false ? '❌' : '⏳'}</div>
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.85)', lineHeight: 1.5 }}>{plan.practiceText}</div>
                  {isPending && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => {
                          const snapshot = plans!;
                          setPlans(prev => prev!.map(p => p.id === plan.id ? { ...p, done: true } : p));
                          api.checkinPlan(plan.id, true).catch(() => setPlans(snapshot));
                        }}
                        style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, background: 'color-mix(in srgb, var(--accent-green) 15%, transparent)', color: '#06d6a0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        ✓ Выполнено
                      </button>
                      <button
                        onClick={() => {
                          const snapshot = plans!;
                          setPlans(prev => prev!.map(p => p.id === plan.id ? { ...p, done: false } : p));
                          api.checkinPlan(plan.id, false).catch(() => setPlans(snapshot));
                        }}
                        style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)', color: 'var(--accent-red)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Не вышло
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
