/**
 * 画像アセットの型宣言（バンドラ経由の import を tsc に通すため）。
 *
 * Vite 等のバンドラは `import logo from './brand/x.png'` を「配備後のURL文字列」へ
 *   解決する。tsc 自身は画像を解決できないので、ワイルドカード宣言で string と教える。
 *   （vite/client の型に依存しない＝@magi/core は採用側の型設定に左右されない）
 * この .d.ts は入力専用で dist へは出力されない。採用側は dist の .d.ts しか読まないため、
 *   この宣言が採用側アプリの型空間を汚すことはない。
 */
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
