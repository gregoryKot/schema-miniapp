import { useState } from 'react';
import { SchemaDiaryEntry, ModeDiaryEntry, GratitudeDiaryEntry, DiaryType } from '../../types';
import { EMOTIONS, getModeById, getSchemaById } from '../../schemaTherapyData';
import { useSafeTop } from '../../utils/safezone';
import { loadDraft, clearDraft, formatDraftAge } from '../../utils/drafts';

interface Props {
  type: DiaryType;
  schemaEntries: SchemaDiaryEntry[];
  modeEntries: ModeDiaryEntry[];
  gratitudeEntries: GratitudeDiaryEntry[];
  onBack: () => void;
  onNewEntry: () => void;
  onDelete: (type: DiaryType, id: number) => void;
}

const DIARY_META: Record<DiaryType, { title: string; emoji: string; color: string; emptyText: string }> = {
  schema:    { title: 'Дневник схем',          emoji: '📓', color: '#f87171', emptyText: 'Ещё нет записей. Запиши момент, когда активировалась схема.' },
  mode:      { title: 'Дневник режимов',       emoji: '🔄', color: '#60a5fa', emptyText: 'Ещё нет записей. Зафиксируй режим, когда заметишь его.' },
  gratitude: { title: 'Дневник благодарности', emoji: '🌱', color: '#34d399', emptyText: 'Ещё нет записей. Начни с трёх вещей за сегодня.' },
};

function formatDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function DeleteBtn({ color, onClick }: { color: string; onClick: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} style={{ marginTop: 8, background: `${color}22`, border: 'none', borderRadius: 8, padding: '6px 12px', color, fontSize: 12, cursor: 'pointer' }}>
        Удалить запись
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button onClick={onClick} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        Удалить навсегда
      </button>
      <button onClick={() => setConfirm(false)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'rgba(var(--fg-rgb),0.06)', color: 'rgba(var(--fg-rgb),0.4)', fontSize: 12, cursor: 'pointer' }}>
        Отмена
      </button>
    </div>
  );
}

function SchemaCard({ entry, color, onDelete }: { entry: SchemaDiaryEntry; color: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const emotionMetas = EMOTIONS.filter(e => entry.emotions.some(em => em.id === e.id));
  const schemas = entry.schemaIds.map(id => getSchemaById(id)).filter(Boolean);

  return (
    <div style={{ background: 'rgba(var(--fg-rgb),0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(var(--fg-rgb),0.06)' }}>
      <div onClick={() => setOpen(v => !v)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>{formatDt(entry.createdAt)}</span>
          <span style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.25)' }}>{open ? '▲' : '▼'}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>
          {entry.trigger.length > 80 && !open ? entry.trigger.slice(0, 80) + '…' : entry.trigger}
        </div>
        {!open && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {emotionMetas.slice(0, 3).map(e => <span key={e.id} style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.5)' }}>{e.emoji}</span>)}
            {schemas.slice(0, 2).map(s => s && <span key={s.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: `${color}22`, color }}>{s.name}</span>)}
          </div>
        )}
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          {emotionMetas.length > 0 && <Field label="Чувства" text={emotionMetas.map(e => `${e.emoji} ${e.label}`).join(', ')} />}
          {entry.thoughts && <Field label="Мысли" text={entry.thoughts} />}
          {entry.bodyFeelings && <Field label="Тело" text={entry.bodyFeelings} />}
          {entry.actualBehavior && <Field label="Поведение" text={entry.actualBehavior} />}
          {schemas.length > 0 && <Field label="Схемы" text={schemas.map(s => s?.name).join(', ')} />}
          {entry.schemaOrigin && <Field label="Происхождение" text={entry.schemaOrigin} />}
          {entry.healthyView && <Field label="Здоровый взгляд" text={entry.healthyView} />}
          {entry.realProblems && <Field label="Реальные проблемы" text={entry.realProblems} />}
          {entry.excessiveReactions && <Field label="Чрезмерные реакции" text={entry.excessiveReactions} />}
          {entry.healthyBehavior && <Field label="Здоровое поведение" text={entry.healthyBehavior} />}
          <DeleteBtn color={color} onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function ModeCard({ entry, color, onDelete }: { entry: ModeDiaryEntry; color: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const mode = getModeById(entry.modeId);

  return (
    <div style={{ background: 'rgba(var(--fg-rgb),0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(var(--fg-rgb),0.06)' }}>
      <div onClick={() => setOpen(v => !v)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>{formatDt(entry.createdAt)}</span>
          <span style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.25)' }}>{open ? '▲' : '▼'}</span>
        </div>
        {mode && <div style={{ fontSize: 13, color, marginBottom: 4 }}>{mode.emoji} {mode.name}</div>}
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
          {entry.situation.length > 80 && !open ? entry.situation.slice(0, 80) + '…' : entry.situation}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          {entry.thoughts && <Field label="Мысли" text={entry.thoughts} />}
          {entry.feelings && <Field label="Чувства" text={entry.feelings} />}
          {entry.bodyFeelings && <Field label="Тело" text={entry.bodyFeelings} />}
          {entry.actions && <Field label="Действия" text={entry.actions} />}
          {entry.actualNeed && <Field label="Что было нужно" text={entry.actualNeed} />}
          {entry.childhoodMemories && <Field label="Воспоминания" text={entry.childhoodMemories} />}
          <DeleteBtn color={color} onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function GratitudeCard({ entry, color, onDelete }: { entry: GratitudeDiaryEntry; color: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: 'rgba(var(--fg-rgb),0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(var(--fg-rgb),0.06)' }}>
      <div onClick={() => setOpen(v => !v)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>
            {new Date(entry.date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.25)' }}>{open ? '▲' : '▼'}</span>
        </div>
        {!open && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {entry.items.slice(0, 2).map((item, i) => (
              <span key={i} style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.6)' }}>
                {i > 0 && '· '}{item.length > 40 ? item.slice(0, 40) + '…' : item}
              </span>
            ))}
            {entry.items.length > 2 && <span style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.3)' }}>+{entry.items.length - 2}</span>}
          </div>
        )}
        {open && <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2 }}>{entry.items.length} записи</div>}
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          {entry.items.map((item, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', marginBottom: 6, paddingLeft: 4, borderLeft: `2px solid ${color}44`, lineHeight: 1.5 }}>
              {item}
            </div>
          ))}
          <DeleteBtn color={color} onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function DraftCard({ type, color, onContinue, onDelete }: { type: DiaryType; color: string; onContinue: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const draft = loadDraft<any>(type);
  if (!draft) return null;

  const preview = type === 'schema' ? draft.data?.trigger :
    type === 'mode' ? draft.data?.situation :
    draft.data?.items?.[0];

  return (
    <div style={{
      borderRadius: 16, padding: '14px 16px', marginBottom: 14,
      background: `${color}0a`,
      border: `1px dashed ${color}44`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '3px 7px', borderRadius: 6, background: `${color}22`, color,
          }}>Черновик</span>
          <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)' }}>{formatDraftAge(draft.startedAt)}</span>
        </div>
      </div>
      {preview && (
        <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.55)', marginBottom: 10, lineHeight: 1.4 }}>
          {preview.length > 80 ? preview.slice(0, 80) + '…' : preview}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onContinue}
          style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: color, color: type === 'gratitude' ? 'var(--bg)' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Продолжить
        </button>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'rgba(var(--fg-rgb),0.06)', color: 'rgba(var(--fg-rgb),0.4)', fontSize: 13, cursor: 'pointer' }}
          >
            Удалить
          </button>
        ) : (
          <button
            onClick={onDelete}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Точно удалить
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(var(--fg-rgb),0.35)', fontSize: 14, lineHeight: 1.6 }}>{text}</div>;
}

export function DiaryListView({ type, schemaEntries, modeEntries, gratitudeEntries, onBack, onNewEntry, onDelete }: Props) {
  const meta = DIARY_META[type];
  const safeTop = useSafeTop();
  const [draftKey, setDraftKey] = useState(0); // force re-render after draft delete

  const hasDraftEntry = !!loadDraft(type);

  function handleDeleteDraft() {
    clearDraft(type);
    setDraftKey(k => k + 1);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', animation: 'slide-in-right 250ms ease' }}>
      <div style={{
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
        padding: `${safeTop + 12}px 16px 12px`,
        borderBottom: '1px solid rgba(var(--fg-rgb),0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(var(--fg-rgb),0.08)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'var(--text)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ‹
          </button>
          <span style={{ fontSize: 22 }}>{meta.emoji}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{meta.title}</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 120px' }}>
        {hasDraftEntry && (
          <DraftCard
            key={draftKey}
            type={type}
            color={meta.color}
            onContinue={onNewEntry}
            onDelete={handleDeleteDraft}
          />
        )}

        {type === 'schema' && (
          schemaEntries.length === 0 && !hasDraftEntry ? <Empty text={meta.emptyText} /> :
            schemaEntries.map(e => <SchemaCard key={e.id} entry={e} color={meta.color} onDelete={() => onDelete('schema', e.id)} />)
        )}
        {type === 'mode' && (
          modeEntries.length === 0 && !hasDraftEntry ? <Empty text={meta.emptyText} /> :
            modeEntries.map(e => <ModeCard key={e.id} entry={e} color={meta.color} onDelete={() => onDelete('mode', e.id)} />)
        )}
        {type === 'gratitude' && (
          gratitudeEntries.length === 0 && !hasDraftEntry ? <Empty text={meta.emptyText} /> :
            gratitudeEntries.map(e => <GratitudeCard key={e.id} entry={e} color={meta.color} onDelete={() => onDelete('gratitude', e.id)} />)
        )}
      </div>

      <button onClick={onNewEntry} style={{
        position: 'fixed', bottom: 80, right: 20,
        background: meta.color, border: 'none', borderRadius: 20,
        padding: '14px 20px', color: type === 'gratitude' ? 'var(--bg)' : '#fff',
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        boxShadow: `0 4px 24px ${meta.color}66`,
      }}>
        + Новая запись
      </button>
    </div>
  );
}
