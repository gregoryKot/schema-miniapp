import { useEffect, useState } from 'react';
import { Need, UserProfile, COLORS } from '../types';
import { api } from '../api';
import { Section } from '../components/BottomNav';
import { SCHEMA_DOMAINS } from '../diaryData';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from '../components/YSQTestSheet';

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  onNavigate: (s: Section) => void;
  onOpenSchema: (startTest?: boolean) => void;
}

function formatGreetingDate(): string {
  const now = new Date();
  const dow = now.toLocaleDateString('ru-RU', { weekday: 'long' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${dow[0].toUpperCase()}${dow.slice(1)}, ${date}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const ALL_SCHEMAS = SCHEMA_DOMAINS.flatMap(d => d.schemas.map(s => ({ ...s, domainColor: d.color })));

export function HomeSection({ needs, ratings, onNavigate, onOpenSchema }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
  }, []);

  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const streak = profile?.streak ?? 0;
  const ratedCount = needs.filter(n => ratings[n.id] !== undefined).length;
  const allRated = needs.length > 0 && ratedCount === needs.length;

  const ysqDone = !!(profile?.ysq.completedAt ?? localStorage.getItem(YSQ_RESULT_KEY));
  const ysqInProgress = !ysqDone && !!localStorage.getItem(YSQ_PROGRESS_KEY);

  const activeSchemas = (profile?.ysq.activeSchemaIds ?? [])
    .map(id => ALL_SCHEMAS.find(s => s.id === id))
    .filter(Boolean) as { id: string; name: string; domainColor: string }[];

  const lastDiary = profile?.lastActivity.schemaDiary
    ?? profile?.lastActivity.modeDiary
    ?? profile?.lastActivity.gratitudeDiary;

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 80, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6, letterSpacing: '0.02em' }}>
          {formatGreetingDate()}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          {firstName ? `Привет, ${firstName}` : 'Добро пожаловать'}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── SCHEMAS BLOCK — foundation of everything ── */}
        {!ysqDone ? (
          /* YSQ not done — CTA */
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.07))',
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 20, padding: '20px',
              animation: 'pop-in 0.3s ease both',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Схема-терапия
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Узнай свои схемы
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 18 }}>
              Схемы — устойчивые паттерны мышления и поведения, которые сформировались в детстве. YSQ-тест покажет какие из них активны у тебя — это точка отсчёта для всего остального.
            </div>
            <button
              onClick={() => onOpenSchema(true)}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '-0.2px',
              }}
            >
              {ysqInProgress ? 'Продолжить YSQ-тест' : 'Пройти YSQ-тест'}
            </button>
          </div>
        ) : (
          /* YSQ done — show schemas */
          <div
            style={{
              background: 'rgba(167,139,250,0.05)',
              border: '1px solid rgba(167,139,250,0.12)',
              borderRadius: 20, padding: '16px 18px',
              animation: 'pop-in 0.3s ease both',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(167,139,250,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Твои схемы
              </div>
              <div
                onClick={() => onOpenSchema()}
                style={{ fontSize: 12, color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}
              >
                Подробнее →
              </div>
            </div>
            {activeSchemas.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeSchemas.map(s => (
                  <span key={s.id} style={{
                    fontSize: 12, borderRadius: 10, padding: '5px 11px',
                    background: `${s.domainColor}15`,
                    border: `1px solid ${s.domainColor}30`,
                    color: s.domainColor, fontWeight: 500,
                  }}>{s.name}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Схемы не выявлены — результаты в норме
              </div>
            )}
          </div>
        )}

        {/* ── Streak + Today's needs ── */}
        <div style={{ display: 'flex', gap: 10, animation: 'slide-up 0.3s ease 0.05s both' }}>

          {/* Streak */}
          <div style={{
            width: 110, flexShrink: 0,
            background: streak > 0
              ? 'linear-gradient(145deg, rgba(251,146,60,0.15), rgba(251,146,60,0.06))'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${streak > 0 ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 20, padding: '16px 14px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 28 }}>{streak > 7 ? '🔥' : streak > 0 ? '✨' : '💤'}</div>
            <div>
              <div style={{
                fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1,
                color: streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)',
              }}>{streak}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 }}>
                {plural(streak, 'день', 'дня', 'дней')}
              </div>
            </div>
          </div>

          {/* Today's needs */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '16px 14px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              {allRated ? 'Готово сегодня' : `${ratedCount} из ${needs.length}`}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {needs.map((need, idx) => {
                const val = ratings[need.id];
                const color = COLORS[need.id] ?? '#888';
                const filled = val !== undefined;
                return (
                  <div key={need.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: `slide-up 0.3s ease ${0.05 + idx * 0.04}s both` }}>
                    <div style={{
                      width: '100%', height: 44, borderRadius: 8, position: 'relative', overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${filled ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      {filled && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: `${(val / 10) * 100}%`,
                          background: `linear-gradient(to top, ${color}66, ${color}22)`,
                          transition: 'height 0.4s ease',
                        }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: filled ? 13 : 16, fontWeight: 700,
                        color: filled ? '#fff' : 'rgba(255,255,255,0.2)',
                      }}>
                        {filled ? val : need.emoji}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tracker card ── */}
        <div
          onClick={() => onNavigate('tracker')}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '18px 20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
            position: 'relative', overflow: 'hidden',
            animation: 'slide-up 0.3s ease 0.1s both',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'linear-gradient(to bottom, #a78bfa, #60a5fa)',
            borderRadius: '0 2px 2px 0',
          }} />
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>📊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Трекер потребностей</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {allRated
                ? '✓ Всё заполнено на сегодня'
                : ratedCount > 0
                  ? `Осталось ${needs.length - ratedCount} потребности`
                  : 'Не заполнено сегодня'}
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, flexShrink: 0 }}>›</div>
        </div>

        {/* ── Diary card ── */}
        <div
          onClick={() => onNavigate('diaries')}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '18px 20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
            position: 'relative', overflow: 'hidden',
            animation: 'slide-up 0.3s ease 0.15s both',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'linear-gradient(to bottom, #60a5fa, #34d399)',
            borderRadius: '0 2px 2px 0',
          }} />
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>📔</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Дневники</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {lastDiary
                ? `Последняя запись ${new Date(lastDiary).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`
                : 'Схемы, режимы, благодарность'}
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, flexShrink: 0 }}>›</div>
        </div>

      </div>
    </div>
  );
}
