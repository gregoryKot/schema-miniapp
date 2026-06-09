import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Конфиг тестов миниаппа. Отдельный от vite.config.ts, чтобы не тянуть
// jsdom/setup в продакшн-сборку. Запуск: npm test / npm run test:cov
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Тесты лежат рядом с кодом: foo.ts → foo.test.ts
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Показывать в отчёте даже файлы без единого теста (честная картина покрытия)
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        // Чистые данные без логики — покрывать нечего
        'src/needData.ts',
        'src/aboutData.ts',
        'src/schemaTherapyData.ts',
      ],
      // Политика «храповика»: цифры только растут, никогда не вниз.
      // При добавлении кода поднимай порог так, чтобы он отражал реальность.
      // См. TESTING.md → «Покрытие и храповик».
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});
