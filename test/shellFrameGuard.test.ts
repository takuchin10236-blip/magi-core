/**
 * (h) シェルの枠を壊す上書きの負例試験（v0.10.0）。
 *
 * 事故: 幅の広い業務コンテンツを収めようとシェルの枠を外す（max-width: none 等）と、
 *   ページ全体に横スクロールが出てパネル外の左右余白が食われる（2026-07-30 社長指摘）。
 *   「枠を壊す値」だけを失格にし、寸法の微調整は警告に留める設計を固定する。
 */
import { describe, it, expect } from 'vitest';
import { makeGuardFixture, runGuard } from './guardFixture';

const run = (css: string, deviations?: string) => runGuard(makeGuardFixture({ css, deviations }));

describe('(h) シェルの枠: 壊す上書きは失格', () => {
  it('.magi-appshell の max-width: none は落ちる', () => {
    const { code, out } = run('.work-view.magi-appshell { max-width: none; padding: 10px; }');
    expect(code).toBe(1);
    expect(out).toContain('(h) シェルの枠を外す上書き');
    expect(out).toContain('max-width: none');
  });

  it('.magi-appshell の padding: 0 は落ちる', () => {
    const { code, out } = run('.magi-appshell { padding: 0; }');
    expect(code).toBe(1);
    expect(out).toContain('(h) シェルの枠を外す上書き');
  });

  it('max-width: 100vw / unset も落ちる', () => {
    expect(run('.magi-appshell { max-width: 100vw; }').code).toBe(1);
    expect(run('.magi-appshell-main { max-width: unset; }').code).toBe(1);
  });
});

/*
 * v0.11.0 注記: (i)（コア管轄クラスの再定義そのものを止める検査）を新設したため、
 *   ここで扱う「シェルクラスへの寸法指定」は (i) 側では失格になる。この describe は
 *   (h) の二段構え（枠を壊す値＝失格 / 寸法の微調整＝警告）だけを見たいので、
 *   fixture の TYPE_DEVIATIONS.md に当該セレクタを記載して (i) を警告へ逃がし、
 *   exit code が (h) の判定だけで決まる状態にしている。(h) の仕様は不変。
 */
const SHELL_SELECTORS_LISTED = [
  '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
  '| --- | --- | --- | --- | --- | --- |',
  '| D-01 | `.magi-appshell` `.magi-appshell-header` `.magi-appshell-main` の寸法指定 | (h) の試験用 | 区分C | 2026-07-31 | 承認済 |',
].join('\n');

describe('(h) シェルの枠: 標準どおりの寸法指定は通す（基準実体の書き方）', () => {
  it('職員マスタと同じ書き方は通る（警告のみ）', () => {
    const { code, out } = run(
      [
        '.magi-appshell { max-width: var(--app-shell-max, 1480px); min-height: 100vh; margin: 0 auto; padding: 18px; }',
        '.magi-appshell-header { min-height: 88px; padding: 14px 18px; }',
        '@media (max-width: 820px) { .magi-appshell { padding: 10px; } }',
      ].join('\n'),
      SHELL_SELECTORS_LISTED,
    );
    expect(code).toBe(0);
    expect(out).toContain('(h) シェルの枠: 寸法の上書きが');
    expect(out).toContain('トークンへ寄せると');
  });

  it('トークンで書けば警告も出ない', () => {
    const { code, out } = run('.magi-appshell { padding: var(--magi-shell-padding); }', SHELL_SELECTORS_LISTED);
    expect(code).toBe(0);
    expect(out).not.toContain('(h) シェルの枠: 寸法の上書きが');
  });

  it('@media print は対象外（印刷は枠を外すのが正しい）', () => {
    const { code } = run('@media print {\n  .magi-appshell { max-width: none; padding: 0; }\n}');
    expect(code).toBe(0);
  });

  it('シェルの「中身」への指定は自由（主語がシェルでなければ対象外）', () => {
    const { code } = run('.magi-appshell-main .wide-table { max-width: none; padding: 0; }');
    expect(code).toBe(0);
  });

  it('.magi-appshell-main の padding: 0 は枠を壊さない（Coreは padding を持たない）', () => {
    const { code } = run('.work-view .magi-appshell-main { padding: 0; }', SHELL_SELECTORS_LISTED);
    expect(code).toBe(0);
  });
});

describe('(h) 例外は承認機構で', () => {
  it('TYPE_DEVIATIONS.md に UI-SHELL-FRAME の承認があれば警告で通す', () => {
    const deviations = [
      '| ID | 何を省いた | 理由 | 区分/根拠 | 社長承認日 | status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| UI-SHELL-FRAME | `.magi-appshell` の枠解除 | 全画面の帳票プレビュー | 区分C | 2026-07-30 | 承認済 |',
    ].join('\n');
    const { code, out } = run('.magi-appshell { max-width: none; }', deviations);
    expect(code).toBe(0);
    expect(out).toContain('UI-SHELL-FRAME');
  });
});
