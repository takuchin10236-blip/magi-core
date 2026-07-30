/**
 * v0.10.0 レイアウト標準の試験。
 *   (a) 寸法トークンが :root に揃っているか（基準実体＝職員マスタの実測値）
 *   (b) 作業面の横あふれ防止（シェルを押し広げない）
 *   (c) MagiBusinessSummary の列数を部品が自分で決めるか
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup } from '@testing-library/react';
import { MagiAppShell } from '../src/ui/MagiAppShell';
import { MagiBusinessSummary, type MagiSummaryItem } from '../src/ui/MagiBusinessSummary';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'design-system.css');
const css = readFileSync(CSS_PATH, 'utf8');

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
});

afterEach(() => {
  cleanup();
});

/** :root に定義されたトークンの値を読む（jsdom は var() を解決しないので本文から取る）。 */
function token(name: string): string {
  const matched = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  expect(matched, `--${name} が定義されていない`).toBeTruthy();
  return matched![1].trim();
}

describe('(a) レイアウトトークン（基準実体＝職員マスタ 267a671 の実測値）', () => {
  const expected: Array<[string, string]> = [
    ['magi-shell-padding', '18px'],
    ['magi-shell-padding-sm', '10px'],
    ['magi-panel-gap', '10px'],
    ['magi-header-min-height', '88px'],
    ['magi-header-padding', '14px 18px'],
    ['magi-panel-padding', '18px 20px'],
    ['magi-card-padding', '15px'],
    ['magi-card-gap', '12px'],
    ['magi-button-min-height', '44px'],
    ['magi-button-padding', '8px 14px'],
    ['magi-button-radius', '9px'],
    ['magi-action-gap', '8px'],
    ['magi-button-icon-gap', '8px'],
    ['magi-field-min-height', '44px'],
    ['magi-field-padding', '9px 11px'],
    ['magi-field-radius', '9px'],
    ['magi-field-label-gap', '7px'],
    ['magi-segment-padding', '4px'],
    ['magi-segment-gap', '4px'],
    ['magi-segment-radius', '12px'],
    ['magi-empty-padding', '42px 20px'],
    ['magi-list-item-padding', '12px'],
  ];

  for (const [name, value] of expected) {
    it(`--${name} = ${value}`, () => {
      expect(token(name)).toBe(value);
    });
  }

  it('既存トークン（--app-shell-max / --card-radius）と名前が衝突しない', () => {
    expect(css).toContain('--app-shell-max');
    expect(css).toContain('--card-radius');
    for (const [name] of expected) {
      expect(name.startsWith('magi-')).toBe(true);
    }
  });

  it('シェル直下の縦間隔はトークン参照（値は据え置き 10px）', () => {
    const { container } = render(
      <MagiAppShell appName="x" facilityName="y">
        <p>本文</p>
      </MagiAppShell>,
    );
    const shell = container.querySelector('.magi-appshell') as Element;
    expect(getComputedStyle(shell).gap).toBe('var(--magi-panel-gap, 10px)');
    expect(token('magi-panel-gap')).toBe('10px');
  });
});

describe('(b) 作業面は横に押し広げられない', () => {
  it('.magi-appshell-main は min-width:0 と max-width:100%', () => {
    const { container } = render(
      <MagiAppShell appName="x" facilityName="y">
        <p>本文</p>
      </MagiAppShell>,
    );
    const main = container.querySelector('.magi-appshell-main') as Element;
    const style = getComputedStyle(main);
    expect(['0', '0px']).toContain(style.minWidth);
    expect(style.maxWidth).toBe('100%');
  });

  it('作業面の直下の子にも min-width:0 が効く（広い表が器を押し広げない）', () => {
    const { container } = render(
      <MagiAppShell appName="x" facilityName="y">
        <div data-testid="wide">とても広い表</div>
      </MagiAppShell>,
    );
    const child = container.querySelector('[data-testid="wide"]') as Element;
    const style = getComputedStyle(child);
    expect(['0', '0px']).toContain(style.minWidth);
    expect(style.maxWidth).toBe('100%');
  });

  it('規約が JSDoc/CSS に明記されている（横スクロールは内側に閉じ込める）', () => {
    expect(css).toContain('横スクロールは業務コンテンツの内側');
  });
});

describe('(c) MagiBusinessSummary の列数は部品が決める', () => {
  const makeItems = (n: number): MagiSummaryItem[] =>
    Array.from({ length: n }, (_, i) => ({ key: `k${i}`, label: `項目${i}`, value: `${i}` }));

  function columnsOf(container: HTMLElement): string | undefined {
    const chips = container.querySelector('.magi-business-summary-chips') as HTMLElement;
    return chips.style.getPropertyValue('--magi-summary-columns');
  }

  it('5項目なら5列（アプリの設定漏れで溢れない）', () => {
    const { container } = render(<MagiBusinessSummary items={makeItems(5)} />);
    expect(columnsOf(container)).toBe('5');
  });

  it('3項目なら3列', () => {
    const { container } = render(<MagiBusinessSummary items={makeItems(3)} />);
    expect(columnsOf(container)).toBe('3');
  });

  it('columns の明示指定が勝つ', () => {
    const { container } = render(<MagiBusinessSummary columns={2} items={makeItems(5)} />);
    expect(columnsOf(container)).toBe('2');
  });

  it('0項目でも 1列以上（0除算・0列を作らない）', () => {
    const { container } = render(<MagiBusinessSummary items={[]} />);
    expect(columnsOf(container)).toBe('1');
  });
});
