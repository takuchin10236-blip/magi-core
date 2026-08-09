/**
 * 開発者検証用ショーケースの dev サーバ設定（M1・2026-08-09）。
 *
 * 置き場が `dev/` である理由:
 *   `src/` に置くと `npm run build`（tsc・include: ["src"]）が拾って dist へ出てしまい、
 *   採用アプリへ検証用ページが配られる。ショーケースは **配らない** ので src の外に置く。
 *
 * package.json を触らない理由:
 *   `verify:matrix` が core の package.json 内容の SHA-256 を版SoTとして固定している。
 *   script を1行足すだけで `npm run check` が赤になる（＝版マトリクスの再生成が要る）。
 *   本便は「既存コード不変更」の発注なので、起動は `npx vite --config dev/vite.config.ts` で行う。
 *
 * alias の意図:
 *   ショーケースの import 文は採用アプリと同じ書き味（'@magi/core/ui'）に保ったまま、
 *   実体は repo の `src/` を直接読む。dist 経由にすると build しないと変更が映らず、
 *   「実装の現物を見る」というページの目的から外れるため。
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

export default defineConfig({
  root: here,
  resolve: {
    // 長い方（css）を先に置く＝前方一致のため順序が意味を持つ。
    alias: [
      { find: '@magi/core/ui/design-system.css', replacement: resolve(repoRoot, 'src/ui/design-system.css') },
      { find: '@magi/core/ui', replacement: resolve(repoRoot, 'src/ui/index.ts') },
    ],
  },
  // @vitejs/plugin-react は core の依存に無い（＝入れると package.json が動く）。
  // JSX 変換は vite が tsconfig の "jsx": "react-jsx" を読んで automatic runtime で行う
  //   （＝ここで jsx を明示しない。Fast Refresh は無いので変更は再読込で見る）。
  server: {
    // root の外（repo の src/）を読むため明示的に許可する。
    fs: { allow: [repoRoot] },
    // ci/check-contrast.mjs の使用例（http://127.0.0.1:5273）と URL を揃える。
    // host を明示しないと ::1 だけで待ち受け、127.0.0.1 を指す検査ツールが繋がらない。
    host: '127.0.0.1',
    port: 5273,
    strictPort: true,
    open: false,
  },
});
