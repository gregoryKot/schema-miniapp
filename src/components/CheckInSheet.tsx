import { useState } from 'react';
import { api, PracticePlan } from '../api';
import { BottomSheet } from './BottomSheet';

interface Props {
  plan: PracticePlan;
  needEmoji: string;
  needLabel: string;
  color: string;
  onDone: () => void;
}

export function CheckInSheet({ plan, needEmoji, needLabel, color, onDone }: Props) {
  const [saving, setSaving] = useState(false);

  async function checkin(done: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await api.checkinPlan(plan.id, done);
    } catch (e) { console.error('checkinPlan failed', e); }
    onDone();
  }

  return (
    <BottomSheet onClose={onDone} zIndex={250}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
          Вчера ты планировал
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          {needEmoji} {needLabel}
        </div>
      </div>

      <div style={{
        background: color + '18',
        border: `1px solid ${color}33`,
        borderRadius: 14, padding: '16px 18px',
        marginBottom: 28,
        fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55,
        textAlign: 'center',
      }}>
        {plan.practiceText}
      </div>

      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 16 }}>
        Получилось?
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => checkin(false)}
          disabled={saving}
          style={{
            flex: 1, padding: '15px 0', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer',
          }}
        >
          Не вышло
        </button>
        <button
          onClick={() => checkin(true)}
          disabled={saving}
          style={{
            flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
            background: saving ? 'rgba(255,255,255,0.1)' : color,
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
          }}
        >
          Да, сделал ✓
        </button>
      </div>
    </BottomSheet>
  );
}
