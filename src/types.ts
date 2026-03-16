export interface Need {
  id: string;
  emoji: string;
  title: string;
  chartLabel: string;
}

export interface DayHistory {
  date: string;
  ratings: Record<string, number>;
}

export const COLORS: Record<string, string> = {
  attachment: '#FF5C93',
  autonomy:   '#4DA3FF',
  expression: '#FFC83D',
  play:       '#58D68D',
  limits:     '#9B6DFF',
};
