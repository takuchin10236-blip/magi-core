/**
 * devWarn — 開発ビルドの判定（v0.9.4）。
 *
 * 開発者向けの助言（console.warn）を、本番の利用者（職員）の画面では鳴らさないため、
 *   バンドラが置換する `process.env.NODE_ENV` を見て開発ビルドのときだけ true を返す。
 *   判定できない環境（置換もされず process も無い）では**黙る**＝安全側に倒す。
 */
export declare function isDevBuild(): boolean;
//# sourceMappingURL=devWarn.d.ts.map