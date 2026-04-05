import { useState } from 'react';
import { getTelegramSafeTop } from '../utils/safezone';
import { SchemaFlashcard } from '../components/SchemaFlashcard';
import { LetterToSelf } from '../components/LetterToSelf';
import { BeliefCheck } from '../components/BeliefCheck';
import { SafePlace } from '../components/SafePlace';
import { TherapyNote } from '../components/TherapyNote';
import { CHILDHOOD_DONE_KEY } from '../components/ChildhoodWheelSheet';

interface Props {
  onOpenChildhoodWheel: () => void;
  onOpenPractices: () => void;
  onOpenPlans: () => void;
  practiceCount?: number | null;
  planCount?: number | null;
}

function ToolRow({ emoji, label, sub, divider, onClick, accent }: { emoji: string; label: string; sub?: string; divider?: boolean; onClick: () => void; accent?: string }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', borderTop: divider ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
      <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: accent ?? '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

export function HelpSection({ onOpenChildhoodWheel, onOpenPractices, onOpenPlans, practiceCount, planCount }: Props) {
  const safeTop = getTelegramSafeTop();
  const childhoodDone = !!localStorage.getItem(CHILDHOOD_DONE_KEY);

  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showBeliefCheck, setShowBeliefCheck] = useState(false);
  const [showLetterToSelf, setShowLetterToSelf] = useState(false);
  const [showSafePlace, setShowSafePlace] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Самопомощь</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5 }}>
          Упражнения схема-терапии для самостоятельной работы
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Emergency */}
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.7)' }}>🚨 Прямо сейчас</div>
          </div>
          <ToolRow emoji="🆘" label="Мне сейчас плохо" sub="Разобрать что происходит — 5 шагов" onClick={() => setShowFlashcard(true)} accent="rgba(255,200,200,0.9)" />
        </div>

        {/* Работа с мыслями */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)' }}>💭 Работа с мыслями</div>
          </div>
          <ToolRow emoji="🔍" label="Проверить убеждение" sub="Правда ли это? Собрать доказательства за и против" onClick={() => setShowBeliefCheck(true)} />
          <ToolRow emoji="✉️" label="Письмо Уязвимому Ребёнку" sub="Написать себе из прошлого" divider onClick={() => setShowLetterToSelf(true)} />
        </div>

        {/* Ресурс */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.6)' }}>🌿 Ресурс</div>
          </div>
          <ToolRow emoji="🏡" label="Безопасное место" sub="Описать и перечитывать в тревожный момент" onClick={() => setShowSafePlace(true)} />
          <ToolRow emoji="🌱" label="Колесо детства" sub={childhoodDone ? 'Паттерны из детства' : 'Не заполнено — займёт 2 минуты'} divider onClick={onOpenChildhoodWheel} />
        </div>

        {/* Отслеживание */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.6)' }}>📊 Отслеживание</div>
          </div>
          <ToolRow emoji="🗂" label="Мои практики" sub={practiceCount == null ? undefined : practiceCount === 0 ? 'Привычки для каждой потребности' : `${practiceCount} ${plural(practiceCount, 'практика', 'практики', 'практик')}`} onClick={onOpenPractices} />
          <ToolRow emoji="🗓" label="История планов" sub={planCount == null ? undefined : planCount === 0 ? 'Создаются в трекере потребностей' : `${planCount} ${plural(planCount, 'план', 'плана', 'планов')} за 30 дней`} divider onClick={onOpenPlans} />
        </div>

        <div style={{ padding: '4px 0 0' }}>
          <TherapyNote compact />
        </div>

      </div>

      {showFlashcard && <SchemaFlashcard onClose={() => setShowFlashcard(false)} />}
      {showBeliefCheck && <BeliefCheck onClose={() => setShowBeliefCheck(false)} />}
      {showLetterToSelf && <LetterToSelf onClose={() => setShowLetterToSelf(false)} />}
      {showSafePlace && <SafePlace onClose={() => setShowSafePlace(false)} />}
    </div>
  );
}
