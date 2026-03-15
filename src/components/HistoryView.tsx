import { Need, DayHistory, COLORS } from '../types';

interface Props {
  needs: Need[];
  history: DayHistory[];
}

const SHORT_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${SHORT_MONTHS[parseInt(m) - 1]}`;
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
        <div style={{
          width: `${value * 10}%`,
          height: '100%',
          borderRadius: 4,
          background: color,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ minWidth: 24, fontSize: 13, fontWeight: 600, color, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function HistoryView({ needs, history }: Props) {
  if (history.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)' }}>
        Пока нет данных.<br />Заполни дневник сегодня!
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      {history.map(({ date, ratings }) => (
        <div key={date} style={{
          marginBottom: 20,
          padding: '14px 16px',
          borderRadius: 16,
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 12 }}>
            {formatDate(date)}
          </p>
          {needs.map((n) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{n.emoji}</span>
              <div style={{ flex: 1 }}>
                <Bar value={ratings[n.id] ?? 0} color={COLORS[n.id] ?? '#888'} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
