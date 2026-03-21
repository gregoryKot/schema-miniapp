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

export interface UserPractice {
  id: number;
  needId: string;
  text: string;
}

export interface PracticePlan {
  id: number;
  needId: string;
  practiceText: string;
  scheduledDate: string;
  reminderUtcHour: number | null;
  done: boolean | null;
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
  getPractices:  (needId: string) => get<UserPractice[]>(`/api/practices?needId=${needId}`),
  addPractice:   (needId: string, text: string) => post('/api/practices', { needId, text }),
  deletePractice:(id: number) => fetch(`${BASE}/api/practices/${id}`, { method: 'DELETE', headers: authHeaders() }).then(r => { if (!r.ok) throw new Error(`API error: ${r.status}`); }),
  deleteAllUserData: () => fetch(`${BASE}/api/user`, { method: 'DELETE', headers: authHeaders() }).then(r => { if (!r.ok) throw new Error('Failed'); }),
  getPendingPlans:() => get<PracticePlan[]>('/api/plan/pending'),
  getPlanHistory: (days = 30) => get<PracticePlan[]>(`/api/plans/history?days=${days}`),
  createPlan:    (needId: string, practiceText: string, reminderUtcHour?: number) =>
    post('/api/plan', { needId, practiceText, reminderUtcHour }),
  checkinPlan:   (id: number, done: boolean) => post(`/api/plan/${id}/checkin`, { done }),
  getPair: () => get<{ paired: boolean; partnerIndex: number | null; partnerTodayDone: boolean; code: string | null }>('/api/pair'),
  createPairInvite: async () => {
    const res = await fetch(`${BASE}/api/pair/invite`, { method: 'POST', headers: authHeaders(), body: '{}' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ code: string; url: string }>;
  },
  joinPair: (code: string) => post('/api/pair/join', { code }),
  leavePair: async () => {
    const res = await fetch(`${BASE}/api/pair`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  },
  getChildhoodRatings: () => get<Partial<Record<string, number>>>('/api/childhood-ratings'),
  saveChildhoodRatings: (ratings: Record<string, number>) => post('/api/childhood-ratings', ratings),
  getYsqResult: () => get<{ answers: number[]; completedAt: string } | null>('/api/ysq-result'),
  saveYsqResult: (answers: number[]) => post('/api/ysq-result', { answers }),
};
