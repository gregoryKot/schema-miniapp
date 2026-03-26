import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { api } from '../api';
import { COLORS } from '../types';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';
import { SCHEMA_DOMAINS } from './SchemaInfoSheet';

export const CHILDHOOD_DONE_KEY = 'childhood_wheel_done';

export function shouldShowChildhoodWheel(): boolean {
  return !localStorage.getItem(CHILDHOOD_DONE_KEY);
}

const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'] as const;
type NeedId = typeof NEED_IDS[number];

const NEED_META: Record<NeedId, { label: string; emoji: string; question: string }> = {
  attachment: {
    label: 'Привязанность',
    emoji: '🤝',
    question: 'Был ли рядом взрослый, на которого можно было стабильно рассчитывать — не иногда, а как правило? Ощущал ли ты себя принятым и в безопасности в семье в целом?',
  },
  autonomy: {
    label: 'Автономия',
    emoji: '🧭',
    question: 'Поощряли ли твою самостоятельность — право иметь своё мнение, делать выбор, справляться самому? Или тебя контролировали, критиковали или решали за тебя?',
  },
  expression: {
    label: 'Выражение чувств',
    emoji: '💬',
    question: 'Можно ли было регулярно выражать чувства — злость, страх, обиду, грусть — без того чтобы тебя наказывали, игнорировали или стыдили за это?',
  },
  play: {
    label: 'Спонтанность',
    emoji: '🎉',
    question: 'Было ли в детстве достаточно места для беззаботности, игры и радости — без постоянного давления, тревоги или чувства вины за то что просто отдыхаешь?',
  },
  limits: {
    label: 'Границы',
    emoji: '⚖️',
    question: 'Были ли правила в семье последовательными и справедливыми? Не слишком жёсткими (наказания, страх) и не слишком размытыми (хаос, вседозволенность)?',
  },
};

// Схемы, которые могут формироваться при дефиците каждой потребности
const SCHEMA_HINTS: Record<NeedId, { domain: string; color: string; schemas: string[] }> = {
  attachment: {
    domain: 'Отчуждение и отвержение',
    color: '#f87171',
    schemas: ['Покинутость / Нестабильность', 'Недоверие', 'Эмоциональная депривация', 'Дефективность / Стыд'],
  },
  autonomy: {
    domain: 'Нарушение автономии',
    color: '#fb923c',
    schemas: ['Зависимость / Беспомощность', 'Неуспешность', 'Спутанность / Неразвитая идентичность'],
  },
  expression: {
    domain: 'Ориентация на других + Бдительность',
    color: '#34d399',
    schemas: ['Покорность', 'Самопожертвование', 'Страх потери контроля над эмоциями', 'Эмоциональная скованность', 'Поиск одобрения'],
  },
  play: {
    domain: 'Бдительность и подавление',
    color: '#818cf8',
    schemas: ['Жёсткие стандарты / Придирчивость', 'Негативизм / Пессимизм', 'Пунитивность (на себя)', 'Пунитивность (на других)'],
  },
  limits: {
    domain: 'Нарушение границ',
    color: '#facc15',
    schemas: ['Привилегированность / Грандиозность', 'Недостаточность самоконтроля'],
  },
};

function ChildhoodWheel({ ratings }: { ratings: Record<NeedId, number> }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;
  const angles = useMemo(
    () => NEED_IDS.map((_, i) => (i * 2 * Math.PI / 5) - Math.PI / 2),
    []
  );
  const valuePoints = NEED_IDS.map((id, i) => {
    const r = (ratings[id] / 10) * maxR;
    return `${(cx + r * Math.cos(angles[i])).toFixed(1)},${(cy + r * Math.sin(angles[i])).toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <polygon key={pct}
          points={angles.map(a => `${(cx + maxR * pct * Math.cos(a)).toFixed(1)},${(cy + maxR * pct * Math.sin(a)).toFixed(1)}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={(cx + maxR * Math.cos(a)).toFixed(1)} y2={(cy + maxR * Math.sin(a)).toFixed(1)}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1}
        />
      ))}
      {/* Value polygon */}
      <polygon points={valuePoints} fill="rgba(167,139,250,0.18)" stroke="#a78bfa" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Per-need dots + value labels */}
      {NEED_IDS.map((id, i) => {
        const r = (ratings[id] / 10) * maxR;
        const color = COLORS[id] ?? '#888';
        const dotX = cx + r * Math.cos(angles[i]);
        const dotY = cy + r * Math.sin(angles[i]);
        const labelR = maxR + 22;
        const labelX = cx + labelR * Math.cos(angles[i]);
        const labelY = cy + labelR * Math.sin(angles[i]);
        return (
          <g key={id}>
            <circle cx={dotX.toFixed(1)} cy={dotY.toFixed(1)} r={4} fill={color} />
            <text x={labelX.toFixed(1)} y={labelY.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={13} style={{ userSelect: 'none' }}>
              {NEED_META[id].emoji}
            </text>
            <text x={labelX.toFixed(1)} y={(labelY + 14).toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill={color} fontWeight={600} style={{ userSelect: 'none' }}>
              {ratings[id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Slider({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchstart', prevent, { passive: false });
    return () => el.removeEventListener('touchstart', prevent);
  }, []);
  const pct = value * 10;

  const calcValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    onChange(Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 10));
  }, [onChange]);

  const onPtrDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    calcValue(e.clientX);
  }, [calcValue]);

  const onPtrMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    calcValue(e.clientX);
  }, [calcValue]);

  return (
    <div ref={trackRef} onPointerDown={onPtrDown} onPointerMove={onPtrMove}
      style={{ position: 'relative', padding: '12px 0', cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}>
      <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: `linear-gradient(to right, ${color}55, ${color})` }} />
      </div>
      <div style={{
        position: 'absolute', left: `${pct}%`, top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 20, height: 20, borderRadius: '50%',
        background: color, border: '2px solid #0f1117', pointerEvents: 'none',
      }} />
    </div>
  );
}

type Phase = 'intro' | 'fill' | 'result';

interface Props {
  onClose: () => void;
  onOpenSchemas: () => void;
  onSaved?: (ratings: Record<string, number>) => void;
}

export function ChildhoodWheelSheet({ onClose, onOpenSchemas, onSaved }: Props) {
  const alreadyDone = !!localStorage.getItem(CHILDHOOD_DONE_KEY);
  const [phase, setPhase] = useState<Phase>(alreadyDone ? 'result' : 'intro');
  const [activeSchema, setActiveSchema] = useState<{ name: string; desc: string; color: string } | null>(null);
  const [ratings, setRatings] = useState<Record<NeedId, number>>({
    attachment: 5, autonomy: 5, expression: 5, play: 5, limits: 5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (alreadyDone) {
      api.getChildhoodRatings().then(saved => {
        setRatings(prev => ({ ...prev, ...(saved as Record<NeedId, number>) }));
      }).catch(() => {});
    }
  }, []);

  const lowNeeds = NEED_IDS.filter(id => ratings[id] <= 4);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await api.saveChildhoodRatings(ratings as Record<string, number>);
      localStorage.setItem(CHILDHOOD_DONE_KEY, '1');
      onSaved?.(ratings as Record<string, number>);
      setPhase('result');
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    localStorage.setItem(CHILDHOOD_DONE_KEY, '1');
    onClose();
  }

  return (
    <>
    <BottomSheet onClose={finish} zIndex={200}>

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
              Колесо детства
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
              Те же пять потребностей — но про детство.
            </div>
          </div>

          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
              В схема-терапии считается, что схемы формируются когда базовые потребности{' '}
              <span style={{ color: '#a78bfa', fontWeight: 500 }}>систематически не удовлетворялись в детстве</span>.
              Это упражнение поможет увидеть, какие области могут быть особенно чувствительными — и почему дневник сегодня показывает то, что показывает.
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Это не диагностика. Оценки приблизительны и субъективны. Результаты — для твоего понимания, не для выводов.
            </div>
          </div>

          <button
            onClick={() => setPhase('fill')}
            style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #4fa3f7)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
          >
            Оценить детство — 2 минуты
          </button>
          <button onClick={finish} style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer' }}>
            Пропустить
          </button>
        </div>
      )}

      {/* ── FILL ── */}
      {phase === 'fill' && (
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.5 }}>
            Оцени каждую потребность: насколько она удовлетворялась в твоём детстве (0 — совсем нет, 10 — полностью)
          </div>

          {NEED_IDS.map(id => {
            const meta = NEED_META[id];
            const color = COLORS[id] ?? '#888';
            const value = ratings[id];
            return (
              <div key={id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{meta.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>{meta.question}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color, flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
                    {value}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/10</span>
                  </div>
                </div>
                <Slider value={value} color={color} onChange={v => setRatings(prev => ({ ...prev, [id]: v }))} />
              </div>
            );
          })}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a78bfa, #4fa3f7)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}
          >
            {saving ? '...' : 'Посмотреть результат'}
          </button>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Твоё колесо детства</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Сравнение отобразится в разделе История поверх дневника
            </div>
          </div>

          {/* Wheel */}
          <div style={{ marginBottom: 20 }}>
            <ChildhoodWheel ratings={ratings} />
          </div>

          {/* Compact score legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {NEED_IDS.map(id => {
              const value = ratings[id];
              const color = COLORS[id] ?? '#888';
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{NEED_META[id].emoji}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{NEED_META[id].label.split(' ')[0]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: value <= 4 ? '#f87171' : value <= 6 ? '#fbbf24' : color }}>{value}</span>
                </div>
              );
            })}
          </div>

          {/* Schema hints for low needs */}
          {lowNeeds.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Возможные активные схемы</SectionLabel>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, lineHeight: 1.6 }}>
                Когда потребность хронически не удовлетворялась в детстве, психика вырабатывает стратегии выживания. Это и есть схемы — не диагноз, а паттерн, который когда-то помогал.
              </div>
              {lowNeeds.map(id => {
                const meta = NEED_META[id];
                const hint = SCHEMA_HINTS[id];
                return (
                  <div key={id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{meta.label}</span>
                      <span style={{ fontSize: 12, color: hint.color, marginLeft: 'auto' }}>{ratings[id]}/10 в детстве</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Домен: {hint.domain}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {hint.schemas.map(s => {
                        const schemaData = SCHEMA_DOMAINS.flatMap(d => d.schemas.map(sc => ({ ...sc, color: d.color }))).find(sc => sc.name === s);
                        return (
                          <span
                            key={s}
                            onClick={() => schemaData && setActiveSchema(schemaData)}
                            style={{
                              fontSize: 11, padding: '3px 10px', borderRadius: 20,
                              background: hint.color + '18', color: hint.color,
                              cursor: schemaData ? 'pointer' : 'default',
                              textDecoration: schemaData ? 'underline dotted' : 'none',
                              textUnderlineOffset: 3,
                            }}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div
                onClick={() => { finish(); onOpenSchemas(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', marginTop: 4 }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#a78bfa' }}>Подробнее о схемах</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Что они значат и как с ними работать</div>
                </div>
                <span style={{ fontSize: 18, color: 'rgba(167,139,250,0.6)' }}>›</span>
              </div>
            </div>
          )}

          {lowNeeds.length === 0 && (
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#34d399', fontWeight: 500, marginBottom: 6 }}>Хорошее детство по всем зонам</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                Все потребности выше 4/10 — это редкость и ресурс. Если сейчас что-то низкое, скорее всего это ситуативное, а не схема.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPhase('fill')}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}
            >
              ✎ Изменить
            </button>
            <button
              onClick={finish}
              style={{ flex: 2, padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Готово
            </button>
          </div>
        </div>
      )}

    </BottomSheet>

    {activeSchema && (
      <BottomSheet onClose={() => setActiveSchema(null)} zIndex={300}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeSchema.color, flexShrink: 0 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{activeSchema.name}</div>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{activeSchema.desc}</div>
        </div>
      </BottomSheet>
    )}
    </>
  );
}
