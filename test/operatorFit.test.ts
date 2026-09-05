import { describe, expect, it } from 'vitest';

import { FIT_BASE_PX, FIT_MIN_PX, fitOperatorLabel } from '../src/ui/operatorFit';
import type { OperatorFitTarget } from '../src/ui/operatorFit';

/**
 * 幅180pxのチップで、ラベルに使える内寸は **132px**
 * （180 − 枠線2 − 左右padding24 − アイコン16 − gap6。2026-09-05 実ブラウザ実測値）。
 */
const LABEL_INNER_PX = 132;

/**
 * 全角の日本語は、どの UI フォントでも 1文字＝1em で送る（実測: 14px の「ア」×N が 14N px）。
 * その実測どおりに振る舞う模型を作って、算法だけを試験する。
 * 実ブラウザでの照合は `scripts/verify-operator-fit.mjs` と、各アプリの `qa:visual` が受け持つ。
 */
function makeTarget(chars: number, innerPx = LABEL_INNER_PX): OperatorFitTarget & { readonly state: { fontSize: number; letterSpacing: number } } {
  const state = { fontSize: FIT_BASE_PX, letterSpacing: 0 };
  return {
    state,
    get scrollWidth() {
      // 字間は「各文字のうしろ」に入る（Chrome の実装と同じ＝最後の1文字ぶんも入る）。
      return Math.max(0, chars * state.fontSize + chars * state.letterSpacing);
    },
    get clientWidth() {
      return innerPx;
    },
    get textLength() {
      return chars;
    },
    setFontSize(px) {
      state.fontSize = px;
    },
    setLetterSpacing(px) {
      state.letterSpacing = px ?? 0;
    },
  };
}

describe('操作者チップ：名前は必ず枠に収まる（省略記号にしない）', () => {
  // 6字=そのまま／13字=縮小のみ／17字=下限＋字間／20字=下限＋字間（外国籍職員の長い氏名）
  for (const chars of [1, 3, 6, 9, 13, 17, 20, 24, 30, 40]) {
    it(`${chars}字の名前が枠(${LABEL_INNER_PX}px)からはみ出さない`, () => {
      const target = makeTarget(chars);
      const result = fitOperatorLabel(target);
      expect(target.scrollWidth).toBeLessThanOrEqual(target.clientWidth);
      expect(result.overflowed).toBe(false);
      // 読めなくなる下限は守る（字を 7px より小さくしない）。
      expect(result.fontSize).toBeGreaterThanOrEqual(FIT_MIN_PX);
      expect(result.fontSize).toBeLessThanOrEqual(FIT_BASE_PX);
    });
  }

  it('短い名前では何も縮めない（14pxのまま・字間もいじらない）', () => {
    const result = fitOperatorLabel(makeTarget(6));
    expect(result.fontSize).toBe(FIT_BASE_PX);
    expect(result.letterSpacing).toBe(0);
  });

  it('字の大きさだけで収まる長さでは、字間に手を出さない（13字＝10px）', () => {
    const result = fitOperatorLabel(makeTarget(13));
    expect(result.fontSize).toBe(10);
    expect(result.letterSpacing).toBe(0);
  });

  it('17字・18字は下限7pxちょうどで収まる（字間には手を出さない）', () => {
    for (const chars of [17, 18]) {
      const result = fitOperatorLabel(makeTarget(chars));
      expect(result.fontSize).toBe(FIT_MIN_PX);
      expect(result.letterSpacing).toBe(0);
    }
  });

  it('下限まで縮めても入らない19字以上でだけ、字間を詰める', () => {
    for (const chars of [19, 20, 24]) {
      const result = fitOperatorLabel(makeTarget(chars));
      expect(result.fontSize).toBe(FIT_MIN_PX);
      expect(result.letterSpacing).toBeLessThan(0);
    }
  });

  /**
   * 負例＝**これが赤くならないなら、この試験は効いていない**。
   * 「下限で止めて、収まりきらないまま抜ける」旧実装（下限10px・字間詰めなし）を模したもの。
   */
  it('負例：下限で止めて抜ける実装なら、17字は枠からはみ出す', () => {
    const target = makeTarget(17);
    let size = FIT_BASE_PX;
    target.setFontSize(size);
    while (size > 10 && target.scrollWidth > target.clientWidth) {
      size -= 1;
      target.setFontSize(size);
    }
    expect(target.scrollWidth).toBeGreaterThan(target.clientWidth);
  });
});
