/**
 * トークンを「書き写さずに読む」ための道具（M1ショーケース）。
 *
 * 設計の掟: このページはトークンの一覧を**手で持たない**。
 *   design-system.css が読み込まれた後の CSSOM を走査して `--*` の名前を集め、
 *   実際に適用中の値は getComputedStyle(:root) から読む。
 *   ＝ core 側でトークンを増減すると、このページの表も自動で増減する
 *     （手書きの写しが陳腐化して「実装と違う見本」になる事故を構造的に防ぐ）。
 */

export type TokenGroup = 'color' | 'motion' | 'typography' | 'shape' | 'layer' | 'space' | 'other';

export interface TokenView {
  name: string;
  /** 適用中のテーマで解決された値（getComputedStyle の実測）。 */
  value: string;
  group: TokenGroup;
}

/** ルート（:root / html）に対して宣言されたカスタムプロパティ名を CSSOM から集める。 */
export function collectRootTokenNames(): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const takeRule = (rule: CSSRule): void => {
    // グループ規則（@media / @supports / @layer）は中を辿る。
    const grouping = rule as CSSGroupingRule;
    if (typeof CSSGroupingRule !== 'undefined' && rule instanceof CSSGroupingRule && grouping.cssRules) {
      for (const child of Array.from(grouping.cssRules)) takeRule(child);
      return;
    }
    if (typeof CSSStyleRule === 'undefined' || !(rule instanceof CSSStyleRule)) return;
    const selector = rule.selectorText ?? '';
    // ルート側で宣言されたものだけを「トークン」と見なす（部品内部の局所変数は除く）。
    if (!/(^|,)\s*(:root|html)\b/.test(selector)) return;
    for (const prop of Array.from(rule.style)) {
      if (!prop.startsWith('--') || seen.has(prop)) continue;
      seen.add(prop);
      names.push(prop);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // 別オリジンのシートは読めない（dev では起きない。起きても他のシートは読み続ける）。
      continue;
    }
    for (const rule of Array.from(rules)) takeRule(rule);
  }

  return names;
}

/** 読み込まれた CSS に実在する @keyframes 名（@media の中にあるものも拾う）。 */
export function collectKeyframeNames(): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const takeRule = (rule: CSSRule): void => {
    if (typeof CSSKeyframesRule !== 'undefined' && rule instanceof CSSKeyframesRule) {
      if (!seen.has(rule.name)) {
        seen.add(rule.name);
        names.push(rule.name);
      }
      return;
    }
    const grouping = rule as CSSGroupingRule;
    if (typeof CSSGroupingRule !== 'undefined' && rule instanceof CSSGroupingRule && grouping.cssRules) {
      for (const child of Array.from(grouping.cssRules)) takeRule(child);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) takeRule(rule);
  }

  return names;
}

/** 適用中テーマでの実値（トークンの解決結果）。 */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const GRADIENT = /^(linear|radial|conic|repeating-)/;

/** 名前と実値から所属グループを決める（表示の並べ替え用。実装上の分類ではない）。 */
export function groupOf(name: string, value: string): TokenGroup {
  if (name.includes('font')) return 'typography';
  if (/^--(duration|motion|ease|transition)/.test(name)) return 'motion';
  if (name.includes('radius') || name.includes('shadow')) return 'shape';
  if (/^--(magi-)?z-/.test(name)) return 'layer';
  if (GRADIENT.test(value)) return 'color';
  if (/(padding|gap|height|width|max|min|tap-)/.test(name)) return 'space';
  if (value !== '' && CSS.supports('color', value)) return 'color';
  return 'other';
}

/** 現在のテーマで解決した全トークン（CSSOM の宣言順）。 */
export function readAllTokens(): TokenView[] {
  return collectRootTokenNames().map((name) => {
    const value = readToken(name);
    return { name, value, group: groupOf(name, value) };
  });
}

/** 実測用: 見本要素の実際の描画値を読む（書き写しでなく計測で示すため）。 */
export function measureText(el: HTMLElement): { fontSize: string; fontWeight: string; lineHeight: string; fontFamily: string } {
  const cs = getComputedStyle(el);
  return {
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    fontFamily: cs.fontFamily,
  };
}
