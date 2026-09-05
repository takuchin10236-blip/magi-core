/**
 * operatorFit — 操作者チップのラベルを「枠に収まるまで」縮める算法（v0.27.0）
 * ─────────────────────────────────────────────────────────────────────
 * なぜ別ファイルに切り出すか:
 *   2026-09-05、17字の職員名が幅180pxのチップから**はみ出して切れていた**。
 *   縮小ループが下限10pxで止まり、収まりきらないまま抜けていたためである
 *   （`text-overflow: ellipsis` も無いので「…」すら出ず、切れたことに誰も気づけない）。
 *   DOM から切り離しておけば、実ブラウザを起こさずに**算法そのもの**を試験できる
 *   ——「入れた」ではなく「効いた」を機械で示せる形にする。
 *
 * 型として守ること（`Operator.tsx` の型v1.6）:
 *   1. **全文表示が絶対**。省略記号にしない。
 *   2. 読めなくなる下限は要る（字の大きさは 7px より下げない）。
 *   3. **下限で止めて切れたまま抜けない**。下限でも入らない長さの名前は、
 *      字間を詰めて枠へ入れ切る（外国籍職員の長い氏名は施設に実在する）。
 */

/** 縮小の起点。CSS の `.operator-chip` の font-size と同値。 */
export const FIT_BASE_PX = 14;
/** 字の大きさの下限。これ以下は読めない（2026-09-05 実測で下限10px→7pxへ）。 */
export const FIT_MIN_PX = 7;
/** 字間を詰める時の刻み。推定値の丸め誤差を詰め切るためだけに使う。 */
export const FIT_TRACK_STEP_PX = 0.1;
/** 刻みの上限回数。推定から始めるので、実際は数回で収まる（無限ループを作らないための蓋）。 */
export const FIT_TRACK_MAX_STEPS = 24;

/**
 * 測って直す相手。DOM でも試験用の模型でも同じ形で扱う。
 * `scrollWidth`／`clientWidth` は**直前の指示が反映された後の値**を返すこと。
 */
export interface OperatorFitTarget {
  /** 中身の実寸（はみ出しを含む）。 */
  readonly scrollWidth: number;
  /** 枠の内寸。 */
  readonly clientWidth: number;
  /** ラベルの文字数（字間の見積りに使う）。 */
  readonly textLength: number;
  setFontSize(px: number): void;
  /** null で字間の指定を外す（初期化）。 */
  setLetterSpacing(px: number | null): void;
}

export interface OperatorFitResult {
  fontSize: number;
  /** 0 なら字間はいじっていない。 */
  letterSpacing: number;
  /** 上限まで詰めても収まらなかった＝設計の想定外の長さ。呼び手が気づけるように返す。 */
  overflowed: boolean;
}

/**
 * ラベルが枠に収まるまで、①字を小さく ②それでも駄目なら字間を詰める、の順で当てる。
 * 収まった時点で止めるので、短い名前は 14px のまま何も起きない。
 */
export function fitOperatorLabel(target: OperatorFitTarget): OperatorFitResult {
  target.setLetterSpacing(null);
  let fontSize = FIT_BASE_PX;
  target.setFontSize(fontSize);

  // ① 1px ずつ落とす（名前は長くても数十文字＝ループは小さい）。
  while (fontSize > FIT_MIN_PX && target.scrollWidth > target.clientWidth) {
    fontSize -= 1;
    target.setFontSize(fontSize);
  }
  if (target.scrollWidth <= target.clientWidth) {
    return { fontSize, letterSpacing: 0, overflowed: false };
  }

  // ② 下限まで縮めても入らない長さ。はみ出し量を文字数で割って字間の当たりを付け、
  //    丸め誤差だけ刻んで詰め切る（0.1px 刻み・上限あり）。
  const chars = Math.max(target.textLength, 1);
  let letterSpacing = (target.clientWidth - target.scrollWidth) / chars;
  target.setLetterSpacing(letterSpacing);
  for (let i = 0; i < FIT_TRACK_MAX_STEPS && target.scrollWidth > target.clientWidth; i += 1) {
    letterSpacing -= FIT_TRACK_STEP_PX;
    target.setLetterSpacing(letterSpacing);
  }
  return { fontSize, letterSpacing, overflowed: target.scrollWidth > target.clientWidth };
}

/** HTML 要素を測って直す実体。`Operator.tsx` から使う。 */
export function domFitTarget(span: HTMLElement): OperatorFitTarget {
  return {
    get scrollWidth() {
      return span.scrollWidth;
    },
    get clientWidth() {
      return span.clientWidth;
    },
    get textLength() {
      return span.textContent?.length ?? 0;
    },
    setFontSize(px) {
      span.style.fontSize = `${px}px`;
    },
    setLetterSpacing(px) {
      span.style.letterSpacing = px === null ? '' : `${px}px`;
    },
  };
}
