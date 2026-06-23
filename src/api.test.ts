import { describe, it, expect, vi } from 'vitest';
import { api } from './api';
import { setTelegram } from './test/setup';

function mockFetch(impl: (url: string, init: any) => any) {
  // async-обёртка: fetch возвращает Promise (api использует и await, и .then())
  const fn = vi.fn(async (url: string, init: any) => impl(url, init));
  vi.stubGlobal('fetch', fn);
  return fn;
}
const ok = (json: unknown = {}) => ({ ok: true, json: async () => json });

describe('authHeaders (initData)', () => {
  it('берёт x-telegram-init-data из Telegram WebApp', async () => {
    setTelegram({ initData: 'init-abc' });
    const f = mockFetch(() => ok());
    await api.getProfile();
    expect(f.mock.calls[0][1].headers['x-telegram-init-data']).toBe('init-abc');
    expect(f.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
  });

  it('без Telegram → пустая строка', async () => {
    setTelegram(null);
    const f = mockFetch(() => ok());
    await api.getProfile();
    expect(f.mock.calls[0][1].headers['x-telegram-init-data']).toBe('');
  });
});

describe('GET', () => {
  it('возвращает JSON при 2xx', async () => {
    mockFetch(() => ok({ name: 'Аня' }));
    expect(await api.getProfile()).toEqual({ name: 'Аня' });
  });

  it('бросает при не-2xx', async () => {
    mockFetch(() => ({ ok: false, status: 404, json: async () => ({}) }));
    await expect(api.getProfile()).rejects.toThrow('API error: 404');
  });

  it('кодирует query date', async () => {
    const f = mockFetch(() => ok({}));
    await api.ratings('2026-06-08');
    expect(f.mock.calls[0][0]).toContain('/api/ratings?date=2026-06-08');
  });

  it('ratings без даты → без query', async () => {
    const f = mockFetch(() => ok({}));
    await api.ratings();
    expect(f.mock.calls[0][0]).toMatch(/\/api\/ratings$/);
  });
});

describe('POST', () => {
  it('метод POST + тело JSON', async () => {
    const f = mockFetch(() => ok());
    await api.saveNote('2026-06-08', 'текст', ['a']);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/api/note');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ date: '2026-06-08', text: 'текст', tags: ['a'] });
  });

  it('извлекает message из тела ошибки', async () => {
    mockFetch(() => ({ ok: false, status: 400, json: async () => ({ message: 'Invalid' }) }));
    await expect(api.saveNote('d', 't')).rejects.toThrow('Invalid');
  });

  it('фолбэк на статус, если тело без message', async () => {
    mockFetch(() => ({ ok: false, status: 500, json: async () => { throw new Error('no json'); } }));
    await expect(api.saveNote('d', 't')).rejects.toThrow('API error: 500');
  });
});

describe('saveRating / deletePractice', () => {
  it('saveRating POST /api/rating с телом и JSON-ответом', async () => {
    const f = mockFetch(() => ok({ ok: true, allDone: false }));
    const res = await api.saveRating('attachment', 7, '2026-06-08');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/api/rating');
    expect(JSON.parse(init.body)).toEqual({ needId: 'attachment', value: 7, date: '2026-06-08' });
    expect(res.ok).toBe(true);
  });

  it('deletePractice DELETE + бросает при не-2xx', async () => {
    const okF = mockFetch(() => ok());
    await api.deletePractice(7);
    expect(okF.mock.calls[0][1].method).toBe('DELETE');
    mockFetch(() => ({ ok: false, status: 403 }));
    await expect(api.deletePractice(7)).rejects.toThrow('API error: 403');
  });
});
