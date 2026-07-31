/**
 * 選択状態の標準形＝ピル（v0.11.0・2026-07-31 社長裁定）の試験。
 *   絞り込み・切替のセグメントは .magi-segment / .magi-segment button /
 *   .magi-segment button.is-active の3クラスで固定する（下流アプリと条文が
 *   この名前を参照する契約）。形（999px）と、8テーマで破綻しない書き方
 *   （生色コードを使わない）を機械で固定する。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui', 'design-system.css');
const css = readFileSync(CSS_PATH, 'utf8');

/** セレクタ（完全一致）の宣言ブロック本文を取り出す。 */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matched = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  expect(matched, `${selector} が定義されていない`).toBeTruthy();
  return matched![1];
}

describe('セグメント標準部品（.magi-segment）', () => {
  it('契約の3クラスが揃っている', () => {
    expect(css).toMatch(/\n\.magi-segment\s*\{/);
    expect(css).toMatch(/\n\.magi-segment button\s*\{/);
    expect(css).toMatch(/\n\.magi-segment button\.is-active\s*\{/);
  });

  it('容器・項目とも角丸はピル（--magi-segment-radius 経由）', () => {
    expect(ruleBody('.magi-segment')).toMatch(/border-radius:\s*var\(--magi-segment-radius, 999px\)/);
    expect(ruleBody('.magi-segment button')).toMatch(/border-radius:\s*var\(--magi-segment-radius, 999px\)/);
  });

  it('--magi-segment-radius は 999px（12px から昇格）', () => {
    expect(css).toMatch(/--magi-segment-radius:\s*999px;/);
    expect(css).not.toMatch(/--magi-segment-radius:\s*12px;/);
  });

  it('余白・間隔はセグメントのトークンを使う', () => {
    const body = ruleBody('.magi-segment');
    expect(body).toMatch(/padding:\s*var\(--magi-segment-padding, 4px\)/);
    expect(body).toMatch(/gap:\s*var\(--magi-segment-gap, 4px\)/);
  });

  it('選択状態は地の面ごと反転（色だけに頼らない）', () => {
    const body = ruleBody('.magi-segment button.is-active');
    expect(body).toMatch(/background:\s*var\(--color-primary\)/);
    expect(body).toMatch(/color:\s*var\(--primary-button-text\)/);
    expect(body).toMatch(/border-color:\s*var\(--color-primary\)/);
  });

  it('非選択の文字は --text-secondary・項目の当たり判定は 36px 以上', () => {
    const body = ruleBody('.magi-segment button');
    expect(body).toMatch(/color:\s*var\(--text-secondary\)/);
    expect(body).toMatch(/min-height:\s*36px/);
  });

  it('8テーマで破綻しないよう生色コードを書かない', () => {
    const start = css.indexOf('\n.magi-segment {');
    const section = css.slice(start);
    for (const selector of ['.magi-segment', '.magi-segment button', '.magi-segment button.is-active']) {
      expect(ruleBody(selector)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
    expect(section.slice(0, section.indexOf('is-active'))).not.toMatch(/\brgba?\(/);
  });
});
