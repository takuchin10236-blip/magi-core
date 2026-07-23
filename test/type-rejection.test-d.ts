/**
 * 型レベル拒否テスト（tsc で検証・vitest では実行しない）。
 *
 * DeclarableState は許可リスト型（kind: 'businessLive' のみ）。
 *   本番URL・書込状態を表す kind は型に存在しない＝アプリが自己申告する経路を型で塞ぐ。
 *   下の @ts-expect-error は「型エラーが起きること」を要求する。もし将来 DeclarableState が
 *   書込・本番 kind を受け入れるよう緩んだら、@ts-expect-error が未使用エラーになり tsc が落ちる。
 */
import type { DeclarableState, RuntimeDetectorConfig } from '../src/ui/statusDetection';
import type { MagiStatusSummaryProps } from '../src/ui/MagiStatusSummary';

// 許可された宣言（businessLive）は型として通る。
export const okBusiness: DeclarableState = { kind: 'businessLive', value: true, basis: '運用開始台帳' };

// @ts-expect-error 書込ON/OFF を騙る kind は型で拒否される。
export const rejectWrite: DeclarableState = { kind: 'writable', value: false, basis: '偽装' };

// @ts-expect-error 本番URL を騙る kind は型で拒否される。
export const rejectProduction: DeclarableState = { kind: 'production', value: true, basis: '偽装' };

// @ts-expect-error basis 欠落は型で拒否される（宣言根拠の必須化）。
export const rejectNoBasis: DeclarableState = { kind: 'businessLive', value: true };

// ── R1-C2-PROP-TYPE-BYPASS: 公開 Props 経路そのものの型拒否 ──

// 許可された宣言（businessLive）は declaredStates に通る。
export const okProps: MagiStatusSummaryProps = {
  declaredStates: [{ kind: 'businessLive', value: true, basis: '運用開始台帳' }],
};

// @ts-expect-error 公開 declaredStates は許可リスト型＝不正 kind はコンパイルエラー。
export const rejectPropsKind: MagiStatusSummaryProps = { declaredStates: [{ kind: 'production', value: true, basis: '偽装' }] };

// @ts-expect-error declaredStates の要素は DeclarableState 構造必須（basis 欠落は拒否）。
export const rejectPropsShape: MagiStatusSummaryProps = { declaredStates: [{ kind: 'businessLive', value: true }] };

// JS/外部境界用の unsafeDeclaredStates は unknown[] なので不正 kind もコンパイルは通る
//   （＝実行時に validateDeclaredState が拒否する経路。型では止めない設計）。
export const okUnsafeProps: MagiStatusSummaryProps = {
  unsafeDeclaredStates: [{ kind: 'production', value: true, basis: '偽装' }],
};

// R1-C2-DETECTOR-SELFDECLARATION: 任意 classify コールバックは公開 Config から撤去済み。
// @ts-expect-error classify は RuntimeDetectorConfig に存在しない（自己申告経路を塞ぐ）。
export const rejectClassify: RuntimeDetectorConfig = { classify: () => 'local' };
