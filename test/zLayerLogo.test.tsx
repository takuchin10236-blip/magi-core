/**
 * v0.9.2 の2点（社長の実機指摘）の試験。
 *   (a) ロゴ寸法・夜の切り抜き … 最新の職員マスタ（magi-staff-directory origin/main 267a671）の値
 *   (b) ポップアップの重なり順 … 全部がアプリの sticky 帯より上に出る梯子
 *
 * jsdom は var() を解決しない（computed に生の宣言が返る）。そこで
 *   - 「その要素にその宣言が効いているか」＝ computed 文字列で確認（規則が消えれば落ちる）
 *   - 「数値の順序が正しいか」＝ トークン定義を読み取って比較
 * の2本立てで見る。
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup } from '@testing-library/react';
import { SgBrandLogo } from '../src/ui/SgBrandLogo';

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

/** :root のトークン定義から数値を取る。 */
function zToken(name: string): number {
  const matched = css.match(new RegExp(`--magi-z-${name}:\\s*(\\d+)`));
  expect(matched, `--magi-z-${name} が定義されていない`).toBeTruthy();
  return Number(matched![1]);
}

describe('ロゴの寸法（基準実体＝最新の職員マスタ 267a671）', () => {
  it('既定幅は 148px（2:1 ＝ 148×74）', () => {
    const { container } = render(<SgBrandLogo />);
    const box = container.querySelector('.magi-brand-logo') as Element;
    const style = getComputedStyle(box);
    expect(style.width).toBe('var(--magi-brand-logo-width, 148px)');
    expect(style.aspectRatio).toBe('2 / 1');
  });

  it('画面幅に応じた既定値も職員マスタと同じ（≤820px:112 / ≤640px:104）', () => {
    expect(css).toContain('var(--magi-brand-logo-width-md, 112px)');
    expect(css).toContain('var(--magi-brand-logo-width-sm, 104px)');
    // それぞれ 820px / 640px のブレークポイントに置かれていること。
    const md = css.indexOf('var(--magi-brand-logo-width-md, 112px)');
    const sm = css.indexOf('var(--magi-brand-logo-width-sm, 104px)');
    expect(css.lastIndexOf('@media (max-width: 820px)', md)).toBeGreaterThan(-1);
    expect(css.lastIndexOf('@media (max-width: 640px)', sm)).toBeGreaterThan(-1);
  });

  it('夜版だけ白余白を切り抜く（clip-path: inset(9% 5% round 6px)）', () => {
    // 職員マスタと同じ値・同じ「夜だけ」の扱い。
    expect(css).toMatch(
      /\.magi-brand-logo\[data-trim='on'\]\[data-variant='night'\] \.magi-brand-logo-img \{\s*clip-path: inset\(9% 5% round 6px\);/,
    );
    // 昼版に切り抜きの指定が掛からないこと（セレクタが night 限定）。
    expect(css).not.toMatch(/\.magi-brand-logo\[data-trim='on'\] \.magi-brand-logo-img \{[^}]*clip-path/);
  });

  it('trim を切ると切り抜き対象から外れる（data-trim="off"）', () => {
    const { container } = render(<SgBrandLogo trim={false} variant="night" />);
    const box = container.querySelector('.magi-brand-logo') as Element;
    expect(box.getAttribute('data-trim')).toBe('off');
    expect(box.getAttribute('data-variant')).toBe('night');
  });
});

describe('重なり順トークン（ポップアップがアプリの sticky 帯より上）', () => {
  it('梯子の順序: アプリ上限 < 業務帯 < ナビ < ポップアップ < ヘッダー由来 < 浮遊 < モーダル', () => {
    const appMax = zToken('app-sticky-max');
    const band = zToken('business-band');
    const nav = zToken('nav');
    const popover = zToken('popover');
    const header = zToken('header-popover');
    const floating = zToken('floating');
    const modal = zToken('modal');

    expect(band).toBeGreaterThan(appMax);
    expect(nav).toBeGreaterThan(band);
    expect(popover).toBeGreaterThan(nav);
    expect(header).toBeGreaterThan(popover);
    expect(floating).toBeGreaterThan(header);
    expect(modal).toBeGreaterThan(floating);
    // 実機で見た アプリ側 sticky の最大値（shift-v4: 80）より上にあること。
    expect(appMax).toBeGreaterThanOrEqual(80);
  });

  it('各ポップアップの器にトークンが効いている', () => {
    const cases: Array<[string, string]> = [
      ['magi-business-summary', 'var(--magi-z-business-band, 200)'],
      ['magi-business-summary-panel', 'var(--magi-z-popover, 400)'],
      ['magi-appshell-nav', 'var(--magi-z-nav, 300)'],
      ['magi-appshell-menu-panel', 'var(--magi-z-popover, 400)'],
      ['magi-appshell-status-details', 'var(--magi-z-header-popover, 500)'],
      ['magi-appshell-status-detail-body', 'var(--magi-z-header-popover, 500)'],
      ['magi-appshell-version-panel', 'var(--magi-z-header-popover, 500)'],
      ['magi-modal-overlay', 'var(--magi-z-modal, 800)'],
    ];
    for (const [className, expected] of cases) {
      const el = document.createElement('div');
      el.className = className;
      document.body.appendChild(el);
      expect(getComputedStyle(el).zIndex, `${className} の重なり順`).toBe(expected);
      el.remove();
    }
  });

  it('モーダルはポップアップより上（従来 z:auto でポップアップに負けていた）', () => {
    expect(zToken('modal')).toBeGreaterThan(zToken('popover'));
    expect(zToken('modal')).toBeGreaterThan(zToken('header-popover'));
  });
});
