/**
 * 検証ページの型宣言（dev/ 専用・dist へは出ない）。
 *
 * CSS の副作用 import（`import '@magi/core/ui/design-system.css'`）は tsc が解決できないので、
 * 中身を持たないモジュールとして宣言する。実体の解決はバンドラ（vite）が行う。
 * ＝ core 側の `src/ui/assets.d.ts` が画像に対してやっているのと同じ作法。
 */
declare module '*.css';
