import { useEffect, useState } from 'react';
import { api } from '../api';
import { SCHEMA_DOMAINS, MODE_GROUPS, ALL_MODES } from '../schemaTherapyData';
import { NEED_DATA } from '../needData';
import { useSafeTop } from '../utils/safezone';
import { SchemaPickerSheet } from '../components/SchemaPickerSheet';
import { BottomSheet } from '../components/BottomSheet';
import { ModeIntroSheet } from '../components/ModeIntroSheet';
import { SchemaIntroSheet } from '../components/SchemaIntroSheet';
import { NeedDetailSheet } from '../components/NeedDetailSheet';
import { TherapyNote } from '../components/TherapyNote';
import { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY } from '../utils/storageKeys';

// CSS-переменные не резолвятся в template literals — маппинг для hex-фонов карточек
const VAR_HEX: Record<string, string> = {
  'var(--accent-red)':    '#f87171',
  'var(--accent-orange)': '#fb923c',
  'var(--accent-yellow)': '#facc15',
  'var(--accent-green)':  '#34d399',
  'var(--accent-indigo)': '#818cf8',
  'var(--accent-blue)':   '#60a5fa',
  'var(--accent)':        '#a78bfa',
};
function hex(color: string) { return VAR_HEX[color] ?? color; }

const NEED_IDS: { id: string; color: string }[] = [
  { id: 'attachment', color: '#ff6b9d' },
  { id: 'autonomy',   color: '#4fa3f7' },
  { id: 'expression', color: '#facc15' },
  { id: 'play',       color: '#06d6a0' },
  { id: 'limits',     color: '#a78bfa' },
];

function readLocalIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

interface Props {
  onOpenSchema: (opts?: { startTest?: boolean; tab?: 'needs'|'schemas'|'modes'; highlight?: string }) => void;
  childhoodRatings?: Record<string, number>;
  onOpenChildhoodWheel?: () => void;
}

function needScoreColor(v: number) {
  if (v <= 3) return 'var(--accent-red)';
  if (v <= 6) return 'var(--accent-yellow)';
  return 'var(--accent-green)';
}

export function SchemasSection({ onOpenSchema, childhoodRatings = {}, onOpenChildhoodWheel }: Props) {
  const [manualSchemaIds, setManualSchemaIds] = useState<string[]>(() => readLocalIds(MY_SCHEMA_IDS_KEY));
  const [myModeIds, setMyModeIds] = useState<string[]>(() => readLocalIds(MY_MODE_IDS_KEY));
  const [ysqSchemaIds, setYsqSchemaIds] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showSchemaPicker, setShowSchemaPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [introModeId, setIntroModeId] = useState<string | null>(null);
  const [introSchemaId, setIntroSchemaId] = useState<string | null>(null);
  const [detailNeedId, setDetailNeedId] = useState<string | null>(null);
  const [needsOpen, setNeedsOpen] = useState(false);
  const [schemasOpen, setSchemasOpen] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const [showSectionInfo, setShowSectionInfo] = useState(false);
  const safeTop = useSafeTop();

  useEffect(() => {
    api.getProfile().then(p => {
      const serverSchemas = p.mySchemaIds ?? [];
      const serverModes   = p.myModeIds ?? [];
      setManualSchemaIds(serverSchemas);
      if (serverSchemas.length > 0) localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(serverSchemas));
      setMyModeIds(serverModes);
      if (serverModes.length > 0) localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(serverModes));
      setYsqSchemaIds(p.ysq.activeSchemaIds ?? []);
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, []);

  const allSchemaIds = [...new Set([...ysqSchemaIds, ...manualSchemaIds])];
  const myModes = myModeIds
    .map(id => ALL_MODES.find(m => m.id === id))
    .filter(Boolean) as typeof ALL_MODES;

  function saveSchemas(ids: string[]) {
    localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(ids));
    setManualSchemaIds(ids);
    api.updateSettings({ mySchemaIds: ids }).catch(() => {});
  }

  const hasAnySchemas = allSchemaIds.length > 0;
  const hasChildhood = Object.keys(childhoodRatings).length > 0;

  const allSchemaObjects = SCHEMA_DOMAINS.flatMap(d => d.schemas).filter(s => allSchemaIds.includes(s.id));
  const previewSchemaEmojis = allSchemaObjects.slice(0, 6).map(s => (s as any).emoji).filter(Boolean) as string[];
  const previewModeEmojis = myModes.slice(0, 6).map(m => m.emoji);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 20px 16px' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
            Мои паттерны
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
            Потребности, схемы и режимы
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setShowSectionInfo(true)}
            style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(var(--fg-rgb),0.06)', color: 'var(--text-sub)', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >?</button>
          <button
            onClick={() => onOpenSchema()}
            style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(var(--fg-rgb),0.06)', color: 'var(--text-sub)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Теория"
          >📚</button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Потребности ── */}
        <div style={{ background: 'rgba(var(--fg-rgb),0.02)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div
            onClick={() => setNeedsOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-sub)' }}>
                Потребности
              </div>
              {hasChildhood ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  {NEED_IDS.map(n => {
                    const v = childhoodRatings[n.id];
                    return v !== undefined ? (
                      <span key={n.id} style={{ fontSize: 13, color: needScoreColor(v) }}>{NEED_DATA[n.id]?.emoji}</span>
                    ) : (
                      <span key={n.id} style={{ fontSize: 13, opacity: 0.3 }}>{NEED_DATA[n.id]?.emoji}</span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  {NEED_IDS.map(n => (
                    <span key={n.id} style={{ fontSize: 13 }}>{NEED_DATA[n.id]?.emoji}</span>
                  ))}
                </div>
              )}
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: needsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
          </div>
          {needsOpen && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!hasChildhood && (
                <div
                  onClick={() => onOpenChildhoodWheel?.()}
                  style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.08)', cursor: 'pointer', marginBottom: 4 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Как потребности удовлетворялись в детстве?</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>Заполнить колесо детства →</div>
                </div>
              )}
              {NEED_IDS.map(({ id, color }) => {
                const d = NEED_DATA[id];
                if (!d) return null;
                const childScore = childhoodRatings[id];
                return (
                  <div
                    key={id}
                    onClick={() => setDetailNeedId(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                      background: `${color}0d`, border: `1px solid ${color}22`,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {d.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 3, lineHeight: 1.4 }}>{d.hint}</div>
                    </div>
                    {childScore !== undefined ? (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: needScoreColor(childScore), lineHeight: 1 }}>{childScore}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.04em', marginTop: 2 }}>детство</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 14, flexShrink: 0 }}>›</span>
                    )}
                  </div>
                );
              })}
              {hasChildhood && (
                <div
                  onClick={() => onOpenChildhoodWheel?.()}
                  style={{ textAlign: 'center', paddingTop: 4, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Изменить ответы детства →</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Схемы ── */}
        <div style={{ background: 'rgba(var(--fg-rgb),0.02)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div
            onClick={() => setSchemasOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-sub)' }}>
                Схемы
              </div>
              {!profileLoading && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {previewSchemaEmojis.length > 0
                    ? previewSchemaEmojis.map((e, i) => <span key={i} style={{ fontSize: 13 }}>{e}</span>)
                    : <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>не выбраны</span>
                  }
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={e => { e.stopPropagation(); setShowSchemaPicker(true); }} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>
                {hasAnySchemas ? 'Изменить' : 'Выбрать'}
              </div>
              <span style={{ color: 'var(--text-faint)', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: schemasOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </div>
          </div>
          {schemasOpen && (
            <div style={{ padding: '0 14px 14px' }}>
              {profileLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[90, 75, 60].map((w, i) => (
                    <div key={i} style={{ height: 62, borderRadius: 14, width: `${w}%`, background: 'linear-gradient(90deg,rgba(var(--fg-rgb),0.04) 25%,rgba(var(--fg-rgb),0.08) 50%,rgba(var(--fg-rgb),0.04) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                  ))}
                </div>
              ) : hasAnySchemas ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {SCHEMA_DOMAINS.map(domain => {
                    const domainActive = domain.schemas.filter(s => allSchemaIds.includes(s.id));
                    if (domainActive.length === 0) return null;
                    return (
                      <div key={domain.id}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: domain.color, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                          {domain.domain}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {domainActive.map(s => {
                            const introSaved = !!localStorage.getItem(`schema_intro_${s.id}`);
                            return (
                              <div
                                key={s.id}
                                onClick={() => setIntroSchemaId(s.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                                  background: `${hex(domain.color)}0d`, border: `1px solid ${hex(domain.color)}22`,
                                }}
                              >
                                <div style={{
                                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                  background: `${hex(domain.color)}18`, border: `1px solid ${hex(domain.color)}30`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                }}>
                                  {(s as any).emoji ?? '●'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{s.name}</div>
                                  <div style={{ fontSize: 11, color: introSaved ? domain.color : 'var(--text-faint)', marginTop: 2 }}>
                                    {introSaved ? 'Заполнено' : 'Познакомиться →'}
                                  </div>
                                </div>
                                <span style={{ color: 'var(--text-faint)', fontSize: 14, flexShrink: 0 }}>›</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>Узнай свои схемы</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.65, marginBottom: 16 }}>
                    Схемы — устойчивые паттерны мышления и поведения из детства. Они влияют на то, как ты реагируешь сегодня.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onOpenSchema({ startTest: true })} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Пройти YSQ-тест
                    </button>
                    <button onClick={() => setShowSchemaPicker(true)} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.08)', color: 'var(--accent)', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Выбрать
                    </button>
                  </div>
                  <div onClick={() => onOpenSchema({ startTest: true })} style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 12, cursor: 'pointer' }}>
                    YSQ-тест →
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Режимы ── */}
        <div style={{ background: 'rgba(var(--fg-rgb),0.02)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div
            onClick={() => setModesOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-sub)' }}>
                Режимы
              </div>
              {!profileLoading && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {previewModeEmojis.length > 0
                    ? previewModeEmojis.map((e, i) => <span key={i} style={{ fontSize: 13 }}>{e}</span>)
                    : <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>не выбраны</span>
                  }
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={e => { e.stopPropagation(); setShowModePicker(true); }} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>
                {myModes.length > 0 ? 'Изменить' : 'Добавить'}
              </div>
              <span style={{ color: 'var(--text-faint)', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: modesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </div>
          </div>
          {modesOpen && (
            <div style={{ padding: '0 14px 14px' }}>
              {profileLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[85, 70].map((w, i) => (
                    <div key={i} style={{ height: 62, borderRadius: 14, width: `${w}%`, background: 'linear-gradient(90deg,rgba(var(--fg-rgb),0.04) 25%,rgba(var(--fg-rgb),0.08) 50%,rgba(var(--fg-rgb),0.04) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                  ))}
                </div>
              ) : myModes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {myModes.map(m => {
                    const introSaved = !!localStorage.getItem(`mode_intro_${m.id}`);
                    return (
                      <div
                        key={m.id}
                        onClick={() => setIntroModeId(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                          background: `${hex(m.groupColor)}0d`, border: `1px solid ${hex(m.groupColor)}20`,
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: `${hex(m.groupColor)}18`, border: `1px solid ${hex(m.groupColor)}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          {m.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: introSaved ? m.groupColor : 'var(--text-faint)', marginTop: 1 }}>
                            {introSaved ? 'Заполнено' : 'Познакомиться →'}
                          </div>
                        </div>
                        <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  Добавь режимы которые тебе близки — и познакомься с каждым
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Therapy note */}
      <div style={{ padding: '0 20px', marginTop: 4, marginBottom: 12 }}>
        <TherapyNote compact />
      </div>

      {/* Section info sheet */}
      {showSectionInfo && (
        <BottomSheet onClose={() => setShowSectionInfo(false)} zIndex={200}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Мои паттерны</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 20 }}>
              Схема-терапия говорит: нас ведут паттерны — устойчивые способы реагировать, защищаться, получать или избегать. Осознать их — первый шаг к изменению.
            </div>
            {[
              { emoji: '🌱', title: 'Потребности', text: 'Пять базовых эмоциональных потребностей. Заполни колесо детства — и увидишь, что формировало твои схемы.' },
              { emoji: '🧩', title: 'Схемы', text: 'Убеждения и паттерны из прошлого, которые продолжают управлять настоящим. Узнай свои — через тест или вручную.' },
              { emoji: '🔄', title: 'Режимы', text: 'Текущие состояния психики — они меняются в течение дня. Знать режим прямо сейчас — значит уже что-то с ним сделать.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => { setShowSectionInfo(false); onOpenSchema({ tab: 'modes' }); }}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(var(--fg-rgb),0.06)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Познакомиться с режимами →
            </button>
          </div>
        </BottomSheet>
      )}

      {showSchemaPicker && (
        <SchemaPickerSheet
          selected={manualSchemaIds}
          onSave={saveSchemas}
          onClose={() => setShowSchemaPicker(false)}
        />
      )}

      {showModePicker && (
        <ModePickerSheet
          selected={myModeIds}
          onSave={ids => { localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(ids)); setMyModeIds(ids); api.updateSettings({ myModeIds: ids }).catch(() => {}); }}
          onClose={() => setShowModePicker(false)}
        />
      )}

      {introModeId && (
        <ModeIntroSheet modeId={introModeId} onClose={() => setIntroModeId(null)} />
      )}

      {introSchemaId && (
        <SchemaIntroSheet schemaId={introSchemaId} onClose={() => setIntroSchemaId(null)} />
      )}

      {detailNeedId && (
        <NeedDetailSheet
          needId={detailNeedId}
          childhoodRating={childhoodRatings[detailNeedId]}
          activeSchemaIds={allSchemaIds}
          onClose={() => setDetailNeedId(null)}
        />
      )}
    </div>
  );
}

// ── Mode picker sheet ──────────────────────────────────────────────────────────

const POPULAR_MODE_IDS = ['vulnerable_child', 'detached_protector', 'demanding_critic', 'abandoned_child', 'compliant_surrenderer'];

const MODE_DESC: Record<string, string> = {
  vulnerable_child:      'Беспомощность, грусть, страх — нуждается в защите',
  lonely_child:          'Одиночество и непонятость даже среди людей',
  abandoned_child:       'Страх быть брошенным, тревога при угрозе отношениям',
  humiliated_child:      'Стыд и ощущение дефективности, страх осуждения',
  dependent_child:       'Нужна постоянная поддержка, боится самостоятельных решений',
  angry_child:           'Злость из-за неудовлетворённых потребностей',
  stubborn_child:        'Упрямое сопротивление требованиям и контролю',
  enraged_child:         'Неконтролируемая ярость при угрозе или несправедливости',
  impulsive_child:       'Действует не думая, следует желаниям без учёта последствий',
  undisciplined_child:   'Избегает скучного, быстро теряет интерес и бросает',
  compliant_surrenderer: 'Соглашается со всем, чтобы избежать конфликта',
  helpless_surrenderer:  'Ощущает себя беспомощным, ждёт что другие всё решат',
  detached_protector:    'Отключается эмоционально, уходит в себя чтобы не чувствовать',
  detached_self_soother: 'Успокаивает себя через еду, экраны, привычки',
  avoidant_protector:    'Избегает ситуаций и людей, которые могут причинить боль',
  angry_protector:       'Отталкивает других злостью, защищаясь от уязвимости',
  self_aggrandiser:      'Ощущение особости и превосходства над другими',
  overcontroller:        'Стремится всё контролировать, тревожится от неопределённости',
  perfectionistic_oc:    'Недостижимые стандарты, страх малейшей ошибки',
  suspicious_oc:         'Постоянная настороженность, ищет скрытые угрозы',
  invincible_oc:         'Отрицает слабость — должен быть сильным всегда',
  flagellating_oc:       'Наказывает себя за ошибки строже чем нужно',
  compulsive_oc:         'Навязчивые ритуалы и действия для снижения тревоги',
  worrying_oc:           'Хроническое беспокойство о будущих катастрофах',
  bully_attack:          'Добивается своего через запугивание и агрессию',
  manipulative:          'Влияет на людей косвенно, скрывая истинные намерения',
  predator:              'Использует других в своих интересах без сочувствия',
  attention_seeker:      'Постоянно ищет признания и похвалы от окружающих',
  pollyanna:             'Отрицает проблемы, видит всё в розовом цвете',
  demanding_critic:      'Внутренний голос завышенных требований и критики',
  punitive_critic:       'Жёсткое внутреннее осуждение и приговоры себе',
  guilt_critic:          'Постоянное чувство вины и самообвинения',
  happy_child:           'Спонтанность, радость и игривость без тревоги',
  healthy_adult:         'Взвешенные решения, забота о себе и других',
  good_parent:           'Внутренний поддерживающий голос, ободряет и успокаивает',
};

function ModePickerSheet({ selected, onSave, onClose }: { selected: string[]; onSave: (ids: string[]) => void; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>(selected);
  const toggle = (id: string) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Мои режимы</div>
        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20, lineHeight: 1.5 }}>
          Выбери режимы которые ты замечаешь у себя. Потом можно познакомиться с каждым.
        </div>

        {/* Популярные */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 8 }}>
            С чего начать
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {POPULAR_MODE_IDS.map(id => {
              const mode = ALL_MODES.find(m => m.id === id);
              if (!mode) return null;
              const active = ids.includes(id);
              const groupColor = mode.groupColor;
              return (
                <div key={id} onClick={() => toggle(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: active ? `${groupColor}12` : 'rgba(var(--fg-rgb),0.04)', border: `1px solid ${active ? `${groupColor}30` : 'rgba(var(--fg-rgb),0.08)'}`, transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{mode.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: active ? 'var(--text)' : 'var(--text-sub)', fontWeight: active ? 500 : 400 }}>{mode.name}</div>
                    {MODE_DESC[id] && <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.4 }}>{MODE_DESC[id]}</div>}
                  </div>
                  {active && <span style={{ color: groupColor, fontSize: 14, flexShrink: 0 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(var(--fg-rgb),0.06)', marginBottom: 18 }} />
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 14 }}>Все режимы</div>

        {MODE_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: group.color, marginBottom: 8, opacity: 0.8 }}>
              {group.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {group.items.filter(m => !POPULAR_MODE_IDS.includes(m.id)).map(m => {
                const active = ids.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggle(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: active ? `${group.color}12` : 'rgba(var(--fg-rgb),0.03)', border: `1px solid ${active ? `${group.color}30` : 'rgba(var(--fg-rgb),0.06)'}`, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: active ? 'var(--text)' : 'var(--text-sub)', fontWeight: active ? 500 : 400 }}>{m.name}</div>
                      {MODE_DESC[m.id] && <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.4 }}>{MODE_DESC[m.id]}</div>}
                    </div>
                    {active && <span style={{ color: group.color, fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button onClick={() => { onSave(ids); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: 'var(--text)', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
          Сохранить{ids.length > 0 ? ` (${ids.length})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
}
