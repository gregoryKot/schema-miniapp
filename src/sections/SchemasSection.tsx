import { useEffect, useState } from 'react';
import { api } from '../api';
import { SCHEMA_DOMAINS, MODE_GROUPS, ALL_MODES } from '../diaryData';
import { getTelegramSafeTop } from '../utils/safezone';
import { SchemaPickerSheet } from '../components/SchemaPickerSheet';
import { BottomSheet } from '../components/BottomSheet';
import { ModeIntroSheet } from '../components/ModeIntroSheet';
import { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY } from '../utils/storageKeys';

function readLocalIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

interface Props {
  onOpenSchema: (opts?: { startTest?: boolean; tab?: 'needs'|'schemas'|'modes'; highlight?: string }) => void;
}

export function SchemasSection({ onOpenSchema }: Props) {
  const [manualSchemaIds, setManualSchemaIds] = useState<string[]>(() => readLocalIds(MY_SCHEMA_IDS_KEY));
  const [myModeIds, setMyModeIds] = useState<string[]>(() => readLocalIds(MY_MODE_IDS_KEY));
  const [ysqSchemaIds, setYsqSchemaIds] = useState<string[]>([]);
  const [showSchemaPicker, setShowSchemaPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [introModeId, setIntroModeId] = useState<string | null>(null);
  const safeTop = getTelegramSafeTop();

  useEffect(() => {
    api.getProfile().then(p => {
      if (p.mySchemaIds.length > 0) {
        setManualSchemaIds(p.mySchemaIds);
        localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(p.mySchemaIds));
      }
      if (p.myModeIds.length > 0) {
        setMyModeIds(p.myModeIds);
        localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(p.myModeIds));
      }
      setYsqSchemaIds(p.ysq.activeSchemaIds ?? []);
    }).catch(() => {});
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

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          Мои схемы и режимы
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          Личная карта паттернов
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Схемы ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Схемы
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div onClick={() => setShowSchemaPicker(true)} style={{ fontSize: 12, color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>
                {hasAnySchemas ? 'Изменить' : 'Выбрать'}
              </div>
              <div onClick={() => onOpenSchema({ startTest: true })} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                YSQ-тест →
              </div>
            </div>
          </div>

          {hasAnySchemas ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SCHEMA_DOMAINS.map(domain => {
                const domainActive = domain.schemas.filter(s => allSchemaIds.includes(s.id));
                if (domainActive.length === 0) return null;
                return (
                  <div key={domain.id}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: domain.color, opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {domain.domain}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {domainActive.map(s => (
                        <div
                          key={s.id}
                          onClick={() => onOpenSchema({ tab: 'schemas', highlight: s.name })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 12, cursor: 'pointer',
                            background: `${domain.color}10`, border: `1px solid ${domain.color}28`,
                          }}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: domain.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500, flex: 1 }}>{s.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
                Узнай свои схемы
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 16 }}>
                Схемы — устойчивые паттерны мышления и поведения из детства. Они влияют на то, как ты реагируешь сегодня.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onOpenSchema({ startTest: true })} style={{
                  flex: 1, padding: '12px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  Пройти YSQ-тест
                </button>
                <button onClick={() => setShowSchemaPicker(true)} style={{
                  padding: '12px 16px', borderRadius: 14,
                  border: '1px solid rgba(167,139,250,0.25)',
                  background: 'rgba(167,139,250,0.08)',
                  color: '#a78bfa', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  Выбрать
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Режимы ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: myModes.length > 0 ? 14 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Режимы
            </div>
            <div onClick={() => setShowModePicker(true)} style={{ fontSize: 12, color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>
              {myModes.length > 0 ? 'Изменить' : 'Добавить'}
            </div>
          </div>

          {myModes.length > 0 ? (
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
                      background: `${m.groupColor}0d`, border: `1px solid ${m.groupColor}20`,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: introSaved ? m.groupColor : 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        {introSaved ? 'Заполнено' : 'Познакомиться →'}
                      </div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8, lineHeight: 1.5 }}>
              Добавь режимы которые тебе близки — и познакомься с каждым
            </div>
          )}
        </div>

        {/* ── Библиотека схемотерапии ── */}
        <div
          onClick={() => onOpenSchema({ tab: 'schemas' })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#a78bfa' }}>Библиотека схемотерапии</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Описания схем, режимов, потребностей</div>
          </div>
          <span style={{ color: 'rgba(167,139,250,0.4)', fontSize: 18 }}>›</span>
        </div>

      </div>

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
    </div>
  );
}

// ── Mode picker sheet ──────────────────────────────────────────────────────────

function ModePickerSheet({ selected, onSave, onClose }: { selected: string[]; onSave: (ids: string[]) => void; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>(selected);
  const toggle = (id: string) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Мои режимы</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.5 }}>
          Выбери режимы которые ты замечаешь у себя. Потом можно познакомиться с каждым.
        </div>

        {MODE_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: group.color, marginBottom: 8, opacity: 0.8 }}>
              {group.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {group.items.map(m => {
                const active = ids.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggle(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, cursor: 'pointer', background: active ? `${group.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? `${group.color}30` : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18 }}>{m.emoji}</span>
                    <span style={{ fontSize: 14, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? 500 : 400, flex: 1 }}>{m.name}</span>
                    {active && <span style={{ color: group.color, fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button onClick={() => { onSave(ids); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
          Сохранить{ids.length > 0 ? ` (${ids.length})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
}
