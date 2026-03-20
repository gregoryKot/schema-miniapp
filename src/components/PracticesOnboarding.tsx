import { useState } from 'react';
import { Need } from '../types';
import { api } from '../api';
import { NEED_DATA } from '../needData';
import { COLORS } from '../types';
import { BottomSheet } from './BottomSheet';

const ONBOARDING_KEY = 'practices_onboarding_done';

export function shouldShowPracticesOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}

interface Props {
  needs: Need[];
  onDone: () => void;
}

export function PracticesOnboarding({ needs, onDone }: Props) {
  const [step, setStep] = useState<'intro' | number>('intro');
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  function finish() {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  }

  async function handleAdd() {
    const text = input.trim();
    const idx = step as number;
    if (!text || saving) return;
    setSaving(true);
    try {
      await api.addPractice(needs[idx].id, text);
    } catch { /* silent */ }
    setSaving(false);
    setInput('');
    next();
  }

  function next() {
    const idx = step === 'intro' ? 0 : (step as number) + 1;
    if (idx >= needs.length) { finish(); return; }
    setStep(idx);
    setInput('');
  }

  const currentNeed = step !== 'intro' ? needs[step as number] : null;
  const color = currentNeed ? COLORS[currentNeed.id] ?? '#888' : '#a78bfa';
  const emoji = currentNeed ? NEED_DATA[currentNeed.id]?.emoji ?? '' : '';
  const total = needs.length;
  const progress = step === 'intro' ? 0 : ((step as number) + 1) / total;

  return (
    <BottomSheet onClose={finish} zIndex={250}>
      {step === 'intro' ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
              Что тебя вытаскивает?
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
              Когда потребность низкая — сложно вспомнить что помогает.{' '}
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Добавь заранее</span> — и они будут под рукой в нужный момент.
            </div>
          </div>

          <div style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              В схема-терапии это называют <span style={{ color: '#a78bfa', fontWeight: 500 }}>копинг-карточками</span> — маленькими напоминаниями себе о том, что реально работает. Не воля, а конкретный шаг.
            </div>
          </div>

          <button
            onClick={() => setStep(0)}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #a78bfa, #4fa3f7)',
              color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
            }}
          >
            Заполнить — займёт 2 минуты
          </button>
          <button
            onClick={finish}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer',
            }}
          >
            Пропустить, сделаю позже
          </button>
        </div>
      ) : currentNeed && (
        <div>
          {/* Progress */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 24 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progress * 100}%`,
              background: color,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Need header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: color + '26',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {emoji}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                {(step as number) + 1} из {total}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>
                {currentNeed.chartLabel}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20 }}>
            Что обычно помогает, когда эта потребность не удовлетворена?
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
            placeholder="Например: позвонить другу, выйти погулять..."
            maxLength={200}
            rows={2}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${input.trim() ? color + '55' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, padding: '12px 14px',
              color: '#fff', fontSize: 15, lineHeight: 1.5,
              resize: 'none', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
              marginBottom: 12,
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={next}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                fontSize: 14, cursor: 'pointer',
              }}
            >
              {(step as number) === total - 1 ? 'Готово' : 'Пропустить →'}
            </button>
            <button
              onClick={handleAdd}
              disabled={!input.trim() || saving}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
                background: input.trim() ? color : 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              {saving ? '...' : 'Сохранить →'}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
