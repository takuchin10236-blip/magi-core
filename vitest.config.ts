import { defineConfig } from 'vitest/config';

// AppShell v0.5 の単体テスト設定。jsdom 環境で React コンポーネントを検証する。
// テストは test/ 配下のみ（src の build tsconfig には含めない＝dist を汚さない）。
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
