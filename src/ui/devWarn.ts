/**
 * devWarn — 開発ビルドの判定（v0.9.4）。
 *
 * 開発者向けの助言（console.warn）を、本番の利用者（職員）の画面では鳴らさないため、
 *   バンドラが置換する `process.env.NODE_ENV` を見て開発ビルドのときだけ true を返す。
 *   判定できない環境（置換もされず process も無い）では**黙る**＝安全側に倒す。
 */

// バンドラ（Vite 等）は本番ビルドで `process.env.NODE_ENV` を文字列へ置換する。
// Node の型に依存しないよう、ここで最小限のアンビエント宣言だけ置く（dist へは出ない）。
declare const process: { env: { NODE_ENV?: string } };

export function isDevBuild(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    // process が無く置換もされないブラウザ環境＝判定不能。助言は出さない。
    return false;
  }
}
