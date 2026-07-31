/**
 * (i) コア管轄クラス（.magi-appshell*）のアプリ側再定義の負例試験（v0.11.0）。
 *
 * 事故: 型を採用しても、アプリ側 CSS に Core と同じ寸法を書き直した「写しの層」が
 *   残ると、Core を上げても見た目が動かない（2026-07-31 社長裁定に伴う是正）。
 *   寸法・文字系の再定義だけを失格にし、出し分け（display 等）は警告に留める設計を固定する。
 */
import { describe, it, expect } from 'vitest';
import { makeGuardFixture, runGuard } from './guardFixture';

const run = (css: string, deviations?: string) => runGuard(makeGuardFixture({ css, deviations }));

describe('(i) シェル再定義: 寸法・文字の再定義は失格', () => {
  it('.magi-appshell の padding: 0 は落ちる', () => {
    const { code, out } = run('.magi-appshell { padding: 0; }');
    expect(code).toBe(1);
    expect(out).toContain('(i) シェル再定義');
    expect(out).toContain('padding: 0');
  });

  it('ナビタブの寸法・文字の書き換えも落ちる', () => {
    const { code, out } = run('.magi-appshell-nav-tab { min-height: 44px; font-size: 13px; }');
    expect(code).toBe(1);
    expect(out).toContain('(i) シェル再定義');
    expect(out).toContain('min-height: 44px');
    expect(out).toContain('font-size: 13px');
  });

  it('トークンで書いても再定義は再定義（(h) と違い素通ししない）', () => {
    const { code, out } = run('.magi-appshell-header { padding: var(--magi-header-padding); }');
    expect(code).toBe(1);
    expect(out).toContain('(i) シェル再定義');
  });

  it('狭幅の @media 内でも落ちる', () => {
    const { code } = run('@media (max-width: 820px) {\n  .magi-appshell-nav-tab { gap: 2px; }\n}');
    expect(code).toBe(1);
  });
});

describe('(i) シェル再定義: 正当な領域は通す', () => {
  it('@media print の中は対象外（印刷の出し分けはアプリの領域）', () => {
    const { code, out } = run(
      [
        '@media print {',
        '  .magi-appshell-header { display: none !important; }',
        '  .magi-appshell { max-width: none; padding: 0; }',
        '}',
      ].join('\n'),
    );
    expect(code).toBe(0);
    expect(out).toContain('(i) シェル再定義: .magi-appshell* の寸法・文字をアプリ側で再定義していない');
  });

  it('寸法・文字以外（display の出し分け）は警告に留まる', () => {
    const { code, out } = run('.magi-appshell-nav { display: none; }');
    expect(code).toBe(0);
    expect(out).toContain('(i) シェル再定義: コア管轄クラスへの寸法・文字以外の指定');
  });

  it('シェルの「中身」への指定は自由（主語がコア管轄クラスでなければ対象外）', () => {
    const { code } = run('.magi-appshell-focus-mode .app-palette { padding: 0; font-size: 12px; }');
    expect(code).toBe(0);
  });

  it('CSS 変数の指定は Core のつまみを回す正規手段（対象外）', () => {
    const { code, out } = run('.magi-appshell { --app-shell-max: 1400px; }');
    expect(code).toBe(0);
    expect(out).not.toContain('(i) シェル再定義: コア管轄クラスへの寸法・文字以外の指定');
  });
});

describe('(i) 逃がし道', () => {
  it('TYPE_DEVIATIONS.md に当該セレクタの記載があれば警告で通す', () => {
    const deviations = [
      '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| D-12 | `.magi-appshell-nav-tab` の当たり判定を44pxへ | 現場の指摘 | 区分C | 2026-07-31 | 承認済 |',
    ].join('\n');
    const { code, out } = run('.magi-appshell-nav-tab { min-height: 44px; }', deviations);
    expect(code).toBe(0);
    expect(out).toContain('TYPE_DEVIATIONS.md に当該セレクタの記載あり');
  });

  it('ID=UI-SHELL-CLASS の承認があればまとめて通す', () => {
    const deviations = [
      '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| UI-SHELL-CLASS | シェルクラスの寸法上書き | 移行猶予 | 区分C | 2026-07-31 | 承認済 |',
    ].join('\n');
    const { code, out } = run('.magi-appshell-header { min-height: 70px; }', deviations);
    expect(code).toBe(0);
    expect(out).toContain('UI-SHELL-CLASS');
  });

  it('記載の無いクラスは失格のまま（前方一致で取り違えない）', () => {
    const deviations = [
      '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| D-12 | `.magi-appshell-nav-tab` の当たり判定 | 現場の指摘 | 区分C | 2026-07-31 | 承認済 |',
    ].join('\n');
    const { code } = run('.magi-appshell-nav-tabs { gap: 2px; }', deviations);
    expect(code).toBe(1);
  });
});
