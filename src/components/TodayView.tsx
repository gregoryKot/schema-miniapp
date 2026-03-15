import { useCallback, useRef } from 'react';
import { Need } from '../types';
import { api } from '../api';
import { NeedSlider } from './NeedSlider';

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  saved: Record<string, boolean>;
  onChange: (needId: string, value: number) => void;
  onSaved: (needId: string) => void;
}

export function TodayView({ needs, ratings, saved, onChange, onSaved }: Props) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleChange = useCallback((needId: string, value: number) => {
    onChange(needId, value);
    clearTimeout(timers.current[needId]);
    timers.current[needId] = setTimeout(async () => {
      await api.saveRating(needId, value);
      onSaved(needId);
    }, 600);
  }, [onChange, onSaved]);

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14, marginBottom: 24 }}>
        {today}
      </p>

      {needs.map((n) => (
        <NeedSlider
          key={n.id}
          id={n.id}
          emoji={n.emoji}
          label={n.chartLabel}
          value={ratings[n.id] ?? 0}
          saved={!!saved[n.id]}
          onChange={(v) => handleChange(n.id, v)}
        />
      ))}
    </div>
  );
}
