import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { api } from '../api';
import { SCHEMA_DOMAINS, getModeById } from '../schemaTherapyData';
import { SchemaIntroSheet } from './SchemaIntroSheet';
import { ModeIntroSheet } from './ModeIntroSheet';

// ─── Types ───────────────────────────────────────────────────────────────────

type SchemaNote = { schemaId: string; triggers: string; feelings: string; thoughts: string; origins: string; reality: string; healthyView: string; behavior: string };
type ModeNote   = { modeId: string; triggers: string; feelings: string; thoughts: string; needs: string; behavior: string };
type DiaryEntry = { id: number; createdAt: string; type: 'schema' | 'mode' | 'gratitude'; label: string; preview: string };
type Exercise   = { id: number; createdAt: string; type: 'belief' | 'letter' | 'flashcard'; label: string; preview: string };
type SafeEntry  = { description: string; updatedAt: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
      const s = v.trim();
      return s.length > 70 ? s.slice(0, 70) + '…' : s;
    }
  }
  return '';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'cards' | 'diary' | 'exercises';

interface Props { onClose: () => void; }

export function MyNotesSheet({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('cards');
  const [loading, setLoading] = useState(true);

  // Cards
  const [schemaNotes, setSchemaNotes] = useState<SchemaNote[]>([]);
  const [modeNotes, setModeNotes]     = useState<ModeNote[]>([]);
  const [openSchemaId, setOpenSchemaId] = useState<string | null>(null);
  const [openModeId, setOpenModeId]     = useState<string | null>(null);

  // Diary
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  // Exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [safePlace, setSafePlace] = useState<SafeEntry>(null);

  useEffect(() => {
    Promise.all([
      api.getSchemaNotes().then(setSchemaNotes).catch(() => {}),
      api.getModeNotes().then(setModeNotes).catch(() => {}),
      // Diary
      Promise.all([
        api.getSchemaDiary().catch(() => [] as any[]),
        api.getModeDiary().catch(() => [] as any[]),
        api.getGratitudeDiary().catch(() => [] as any[]),
      ]).then(([sd, md, gd]) => {
        const entries: DiaryEntry[] = [
          ...sd.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'schema' as const, label: 'Схемный дневник', preview: e.trigger ?? '' })),
          ...md.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'mode' as const, label: `Режим: ${getModeById(e.modeId)?.name ?? e.modeId}`, preview: e.situation ?? '' })),
          ...gd.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'gratitude' as const, label: 'Благодарность', preview: Array.isArray(e.items) ? e.items.slice(0, 2).join(', ') : '' })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30);
        setDiaryEntries(entries);
      }),
      // Exercises
      Promise.all([
        api.getBeliefChecks().catch(() => [] as any[]),
        api.getLetters().catch(() => [] as any[]),
        api.getFlashcards().catch(() => [] as any[]),
        api.getSafePlace().catch(() => null),
      ]).then(([bc, lt, fc, sp]) => {
        setSafePlace(sp);
        const exs: Exercise[] = [
          ...bc.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'belief' as const, label: 'Проверка убеждения', preview: e.belief ?? '' })),
          ...lt.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'letter' as const, label: 'Письмо себе', preview: e.text?.slice(0, 70) ?? '' })),
          ...fc.map((e: any) => ({ id: e.id, createdAt: e.createdAt, type: 'flashcard' as const, label: `Кризис: ${e.modeId}`, preview: e.action ?? e.reflection ?? '' })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30);
        setExercises(exs);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'cards',     label: 'Карточки',   count: schemaNotes.length + modeNotes.length },
    { id: 'diary',     label: 'Дневник',     count: diaryEntries.length },
    { id: 'exercises', label: 'Упражнения', count: exercises.length + (safePlace ? 1 : 0) },
  ];

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Мои записи</div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '7px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(167,139,250,0.15)' : 'rgba(var(--fg-rgb),0.04)',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-sub)',
              fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            }}>
              {t.label}{t.count > 0 ? ` · ${t.count}` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontSize: 14, color: 'var(--text-sub)', padding: '16px 0' }}>Загрузка…</div>
        ) : (
          <>
            {/* ── Карточки ── */}
            {tab === 'cards' && (
              <>
                {schemaNotes.length === 0 && modeNotes.length === 0 ? (
                  <EmptyState emoji="🧩" text="Заполненные карточки схем и режимов" sub="Найди их в разделе Паттерны" />
                ) : (
                  <>
                    {schemaNotes.length > 0 && (
                      <Section label={`Схемы · ${schemaNotes.length}`}>
                        {schemaNotes.map(n => {
                          const s = getSchemaById(n.schemaId);
                          if (!s) return null;
                          return (
                            <NoteRow key={n.schemaId} emoji={(s as any).emoji ?? '●'} title={s.name} preview={notePreview(n)} onClick={() => setOpenSchemaId(n.schemaId)} />
                          );
                        })}
                      </Section>
                    )}
                    {modeNotes.length > 0 && (
                      <Section label={`Режимы · ${modeNotes.length}`}>
                        {modeNotes.map(n => {
                          const m = getModeById(n.modeId);
                          if (!m) return null;
                          return (
                            <NoteRow key={n.modeId} emoji={m.emoji} title={m.name} preview={notePreview(n)} onClick={() => setOpenModeId(n.modeId)} />
                          );
                        })}
                      </Section>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Дневник ── */}
            {tab === 'diary' && (
              diaryEntries.length === 0 ? (
                <EmptyState emoji="📔" text="Записи из дневника" sub="Дневники доступны на вкладке Дневник" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {diaryEntries.map(e => (
                    <div key={`${e.type}-${e.id}`} style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{e.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(e.createdAt)}</span>
                      </div>
                      {e.preview && (
                        <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.preview}</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Упражнения ── */}
            {tab === 'exercises' && (
              exercises.length === 0 && !safePlace ? (
                <EmptyState emoji="🔍" text="Выполненные упражнения" sub="Проверки убеждений, письма, карточки кризиса" />
              ) : (
                <>
                  {safePlace && (
                    <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>🏡 Безопасное место</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(safePlace.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{safePlace.description}</div>
                    </div>
                  )}
                  {exercises.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {exercises.map(e => {
                        const EMOJI: Record<string, string> = { belief: '🔍', letter: '✉️', flashcard: '🆘' };
                        return (
                          <div key={`${e.type}-${e.id}`} style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{EMOJI[e.type]} {e.label}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(e.createdAt)}</span>
                            </div>
                            {e.preview && (
                              <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{e.preview}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}
      </div>

      {openSchemaId && <SchemaIntroSheet schemaId={openSchemaId} onClose={() => setOpenSchemaId(null)} />}
      {openModeId   && <ModeIntroSheet   modeId={openModeId}   onClose={() => setOpenModeId(null)} />}
    </BottomSheet>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function NoteRow({ emoji, title, preview, onClick }: { emoji: string; title: string; preview: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.07)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
        {preview && <div style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{preview}</div>}
      </div>
      <span style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>›</span>
    </div>
  );
}

function EmptyState({ emoji, text, sub }: { emoji: string; text: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{emoji}</div>
      <div style={{ fontSize: 15, color: 'var(--text-sub)', lineHeight: 1.6 }}>{text}</div>
      <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>{sub}</div>
    </div>
  );
}
