import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { api } from '../api';
import { SCHEMA_DOMAINS, getModeById } from '../schemaTherapyData';
import { SchemaIntroSheet } from './SchemaIntroSheet';
import { ModeIntroSheet } from './ModeIntroSheet';

type SchemaNote = { schemaId: string; triggers: string; feelings: string; thoughts: string; origins: string; reality: string; healthyView: string; behavior: string };
type ModeNote   = { modeId: string; triggers: string; feelings: string; thoughts: string; needs: string; behavior: string };

function getSchemaById(id: string) {
  for (const d of SCHEMA_DOMAINS) {
    const s = d.schemas.find(x => x.id === id);
    if (s) return { ...s, domainName: d.domain, color: d.color };
  }
  return null;
}

function notePreview(note: SchemaNote | ModeNote): string {
  const skip = new Set(['schemaId', 'modeId']);
  for (const [k, v] of Object.entries(note)) {
    if (!skip.has(k) && typeof v === 'string' && v.trim()) {
      return v.length > 70 ? v.slice(0, 70) + '…' : v;
    }
  }
  return '';
}

interface Props {
  onClose: () => void;
}

export function MyNotesSheet({ onClose }: Props) {
  const [schemaNotes, setSchemaNotes] = useState<SchemaNote[]>([]);
  const [modeNotes, setModeNotes]     = useState<ModeNote[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openSchemaId, setOpenSchemaId] = useState<string | null>(null);
  const [openModeId, setOpenModeId]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getSchemaNotes().then(setSchemaNotes).catch(() => {}),
      api.getModeNotes().then(setModeNotes).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const total = schemaNotes.length + modeNotes.length;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>Мои записи</span>
          {total > 0 && <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{total}</span>}
        </div>

        {loading ? (
          <div style={{ fontSize: 14, color: 'var(--text-sub)', padding: '16px 0' }}>Загрузка…</div>
        ) : total === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📝</div>
            <div style={{ fontSize: 15, color: 'var(--text-sub)', lineHeight: 1.6 }}>
              Здесь появятся заполненные<br />карточки схем и режимов
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.5 }}>
              Найди их в разделе Паттерны
            </div>
          </div>
        ) : (
          <>
            {schemaNotes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
                  Схемы · {schemaNotes.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {schemaNotes.map(n => {
                    const s = getSchemaById(n.schemaId);
                    if (!s) return null;
                    const preview = notePreview(n);
                    return (
                      <div key={n.schemaId} onClick={() => setOpenSchemaId(n.schemaId)} style={{
                        background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{(s as any).emoji ?? '●'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.name}</div>
                          {preview && (
                            <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{preview}</div>
                          )}
                        </div>
                        <span style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {modeNotes.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
                  Режимы · {modeNotes.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {modeNotes.map(n => {
                    const m = getModeById(n.modeId);
                    if (!m) return null;
                    const preview = notePreview(n);
                    return (
                      <div key={n.modeId} onClick={() => setOpenModeId(n.modeId)} style={{
                        background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{m.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{m.name}</div>
                          {preview && (
                            <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{preview}</div>
                          )}
                        </div>
                        <span style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {openSchemaId && (
        <SchemaIntroSheet
          schemaId={openSchemaId}
          onClose={() => setOpenSchemaId(null)}
        />
      )}
      {openModeId && (
        <ModeIntroSheet
          modeId={openModeId}
          onClose={() => setOpenModeId(null)}
        />
      )}
    </BottomSheet>
  );
}
