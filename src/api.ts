const BASE = import.meta.env.VITE_API_URL as string;

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

export const api = {
  needs:      () => get<import('./types').Need[]>('/api/needs'),
  ratings:    () => get<Record<string, number>>('/api/ratings'),
  saveRating: (needId: string, value: number) => post('/api/rating', { needId, value }),
  history:    (days = 7) => get<import('./types').DayHistory[]>(`/api/history?days=${days}`),
};
