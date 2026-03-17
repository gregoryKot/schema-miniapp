const rawBase = (import.meta.env.VITE_API_URL as string) ?? '';
const BASE = rawBase && !rawBase.startsWith('http') ? `https://${rawBase}` : rawBase;

function authHeaders(): Record<string, string> {
  return {
    'x-telegram-init-data': window.Telegram?.WebApp?.initData ?? '',
    'Content-Type': 'application/json',
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export interface UserSettings {
  notifyEnabled: boolean;
  notifyUtcHour: number;
  notifyTzOffset: number;
  notifyReminderEnabled: boolean;
}

export interface Achievement {
  id: string;
  earned: boolean;
}

export const api = {
  needs:          () => get<import('./types').Need[]>('/api/needs'),
  ratings:        () => get<Record<string, number>>('/api/ratings'),
  saveRating:     (needId: string, value: number) => post('/api/rating', { needId, value }),
  history:        (days = 7) => get<import('./types').DayHistory[]>(`/api/history?days=${days}`),
  getSettings:    () => get<UserSettings>('/api/settings'),
  updateSettings: (body: Partial<UserSettings>) => post('/api/settings', body),
  getAchievements: () => get<Achievement[]>('/api/achievements'),
  getNote:         (date: string) => get<{ text: string | null; tags: string[] }>(`/api/note?date=${date}`),
  saveNote:        (date: string, text: string, tags?: string[]) => post('/api/note', { date, text, tags }),
  getStreak:      () => get<{
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    todayDone: boolean;
    weekDots: boolean[];
  }>('/api/streak'),
  getInsights:    () => get<{
    weeklyStats: Array<{ needId: string; avg: number | null; trend: '↑' | '↓' | '→' }>;
    bestDayOfWeek: string | null;
    worstDayOfWeek: string | null;
    totalDays: number;
  }>('/api/insights'),
  getExport: () => get<{ text: string }>('/api/export'),
  getPair: () => get<{ paired: boolean; partnerIndex: number | null; partnerTodayDone: boolean; code: string | null }>('/api/pair'),
  createPairInvite: async () => {
    const rawBase = (import.meta.env.VITE_API_URL as string) ?? '';
    const BASE = rawBase && !rawBase.startsWith('http') ? `https://${rawBase}` : rawBase;
    const res = await fetch(`${BASE}/api/pair/invite`, { method: 'POST', headers: { 'x-telegram-init-data': window.Telegram?.WebApp?.initData ?? '', 'Content-Type': 'application/json' }, body: '{}' });
    return res.json() as Promise<{ code: string; url: string }>;
  },
  joinPair: (code: string) => post('/api/pair/join', { code }),
  leavePair: async () => {
    const rawBase = (import.meta.env.VITE_API_URL as string) ?? '';
    const BASE = rawBase && !rawBase.startsWith('http') ? `https://${rawBase}` : rawBase;
    await fetch(`${BASE}/api/pair`, { method: 'DELETE', headers: { 'x-telegram-init-data': window.Telegram?.WebApp?.initData ?? '', 'Content-Type': 'application/json' } });
  },
};
