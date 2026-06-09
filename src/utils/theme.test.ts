import { describe, it, expect } from 'vitest';
import { getTheme, applyTheme, toggleTheme, resetToSystemTheme } from './theme';
import { setTelegram } from '../test/setup';

describe('getTheme', () => {
  it('возвращает сохранённый ручной выбор приоритетнее всего', () => {
    applyTheme('light');
    setTelegram({ colorScheme: 'dark' });
    expect(getTheme()).toBe('light');
  });

  it('берёт colorScheme из Telegram, если ручного выбора нет', () => {
    setTelegram({ colorScheme: 'light' });
    expect(getTheme()).toBe('light');
  });

  it('по умолчанию тёмная тема (нет Telegram, нет системного light)', () => {
    setTelegram(null);
    expect(getTheme()).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('ставит data-theme на <html> и сохраняет выбор', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });
});

describe('toggleTheme', () => {
  it('переключает dark → light → dark и возвращает новое значение', () => {
    applyTheme('dark');
    expect(toggleTheme()).toBe('light');
    expect(toggleTheme()).toBe('dark');
  });
});

describe('resetToSystemTheme', () => {
  it('убирает ручной выбор и применяет тему Telegram', () => {
    applyTheme('light');
    setTelegram({ colorScheme: 'dark' });
    expect(resetToSystemTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
