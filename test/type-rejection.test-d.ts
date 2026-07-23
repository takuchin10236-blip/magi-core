/**
 * 型レベル拒否テスト（tsc で検証・vitest では実行しない）。
 *
 * DeclarableState は許可リスト型（kind: 'businessLive' のみ）。
 *   本番URL・書込状態を表す kind は型に存在しない＝アプリが自己申告する経路を型で塞ぐ。
 *   下の @ts-expect-error は「型エラーが起きること」を要求する。もし将来 DeclarableState が
 *   書込・本番 kind を受け入れるよう緩んだら、@ts-expect-error が未使用エラーになり tsc が落ちる。
 */
import type { DeclarableState } from '../src/ui/statusDetection';

// 許可された宣言（businessLive）は型として通る。
export const okBusiness: DeclarableState = { kind: 'businessLive', value: true, basis: '運用開始台帳' };

// @ts-expect-error 書込ON/OFF を騙る kind は型で拒否される。
export const rejectWrite: DeclarableState = { kind: 'writable', value: false, basis: '偽装' };

// @ts-expect-error 本番URL を騙る kind は型で拒否される。
export const rejectProduction: DeclarableState = { kind: 'production', value: true, basis: '偽装' };

// @ts-expect-error basis 欠落は型で拒否される（宣言根拠の必須化）。
export const rejectNoBasis: DeclarableState = { kind: 'businessLive', value: true };
