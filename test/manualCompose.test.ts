/**
 * composeAppManual — アプリ内マニュアル標準様式の試験（v0.25.0）。
 *
 * 守っているのは「様式違反がビルド・試験で落ちること」:
 *   題名の丸数字（①②…）と、末尾共通節3本の並び（アカウント → 入口のカギ → ロゴ）。
 *   どちらも throw で止める＝画面を開いた人だけが気づく console.warn にしない。
 *
 * 共通節の**実体は @magi/manual-content**（非公開）が配る。core は id の並びだけを契約として持つので、
 *   この試験でも文面は持たず、id だけを合わせた最小の節で組む（公開リポジトリに施設の文面を置かない）。
 */
import { describe, expect, it } from 'vitest';

import { composeAppManual, MANUAL_COMMON_TAIL_IDS } from '../src/ui/manualCompose';
import type { ManualSection } from '../src/ui/manual-types';

const META = { appName: '試験アプリ', appVersion: 'v1.2.3', subtitle: '2F職員向けの詳しい使い方' };

/** 最小の節を作る（本文の中身は様式検査の対象外なので1段落だけ）。 */
function section(id: string, title: string, summary?: string): ManualSection {
  return { id, title, summary, blocks: [{ type: 'paragraph', text: '本文' }] };
}

/** 共通末尾3本の代役。id と並びだけが契約なので、それだけを本物に合わせる。 */
function tail(
  ids: readonly string[] = MANUAL_COMMON_TAIL_IDS,
): readonly [ManualSection, ManualSection, ManualSection] {
  return ids.map((id) => section(id, `共通節 ${id}`)) as unknown as readonly [
    ManualSection,
    ManualSection,
    ManualSection,
  ];
}

const APP_SECTIONS = [section('start', '出勤したら', '読むだけなら名前は要りません'), section('post-basic', '基本の投稿')];

describe('composeAppManual（マニュアル標準様式・2026-09-01 裁定）', () => {
  it('正例: アプリ固有節のあとに共通節3本が固定の順で並ぶ', () => {
    const manual = composeAppManual(META, APP_SECTIONS, tail());

    expect(manual.appName).toBe('試験アプリ');
    expect(manual.appVersion).toBe('v1.2.3');
    expect(manual.subtitle).toBe('2F職員向けの詳しい使い方');
    expect(manual.sections.map((s) => s.id)).toEqual([
      'start',
      'post-basic',
      'floor-account',
      'entry-key',
      'logo-column',
    ]);
    // 末尾3本は「アプリ固有の後ろ」に固定＝どのアプリでも最後の3項目が同じ並びになる。
    expect(manual.sections.slice(-3).map((s) => s.id)).toEqual([...MANUAL_COMMON_TAIL_IDS]);
    // 渡した節をそのまま並べる（器が中身を書き換えない）。
    expect(manual.sections[0]).toBe(APP_SECTIONS[0]);
  });

  it('負例1: 題名に丸数字が入っていたら throw（検出した文字と節idを言う）', () => {
    expect(() =>
      composeAppManual(META, [section('start', '① 出勤したら')], tail()),
    ).toThrowError(/節「start」の title に丸数字「①」/);
  });

  it('負例1b: 一言（summary）の丸数字も止める', () => {
    expect(() =>
      composeAppManual(META, [section('start', '出勤したら', '㉑ 番目の話')], tail()),
    ).toThrowError(/節「start」の summary に丸数字「㉑」/);
  });

  it('負例2: 共通節3本の並びが違えば throw（並べ替えを許さない）', () => {
    expect(() =>
      composeAppManual(META, APP_SECTIONS, tail(['entry-key', 'floor-account', 'logo-column'])),
    ).toThrowError(/末尾の共通節3本が規定と違います/);
  });

  it('負例3: 共通節が欠けていたら throw（ロゴ節を落とした形）', () => {
    const short = [section('floor-account', 'A'), section('entry-key', 'B')] as unknown as readonly [
      ManualSection,
      ManualSection,
      ManualSection,
    ];
    expect(() => composeAppManual(META, APP_SECTIONS, short)).toThrowError(/末尾の共通節3本が規定と違います/);
  });

  it('負例4: アプリ固有節に予約id（共通節の写し）が混ざっていたら throw', () => {
    expect(() =>
      composeAppManual(META, [section('start', '出勤したら'), section('logo-column', '自前のロゴ話')], tail()),
    ).toThrowError(/予約id \[logo-column\]/);
  });

  it('負例5: 節idが重複していたら throw（目次ジャンプの宛先が壊れる）', () => {
    expect(() =>
      composeAppManual(META, [section('start', '出勤したら'), section('start', 'もう1つの出勤')], tail()),
    ).toThrowError(/id が重複しています \[start\]/);
  });
});
