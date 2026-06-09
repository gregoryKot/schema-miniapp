import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Размонтировать React-дерево и почистить localStorage после каждого теста —
// изоляция: ни один тест не должен зависеть от состояния предыдущего.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom не реализует matchMedia — нужен для theme.ts и медиа-запросов.
// По умолчанию «не совпадает» (тёмная тема как дефолт приложения).
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

// Хелпер: подставить (или убрать) Telegram WebApp в конкретном тесте.
// Использование: setTelegram({ colorScheme: 'light' })  /  setTelegram(null)
export function setTelegram(webApp: Record<string, unknown> | null) {
  if (webApp === null) {
    delete (window as unknown as { Telegram?: unknown }).Telegram;
    return;
  }
  (window as unknown as { Telegram: { WebApp: unknown } }).Telegram = {
    WebApp: webApp,
  };
}
