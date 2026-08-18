/**
 * 2F名簿（職員）の読み方の試験（v0.19.0・2026-08-18 社長裁定「型に昇格」）。
 * 実物の職員マスタは26列。ヘッダ名と値域（在籍/退職・2階/3階/4階/空・並び順1〜13）は
 * CCがDrive経由で実測した値を写している（氏名は合成）。
 */
import { describe, expect, it } from 'vitest';
import { parseStaffDirectoryRows } from '../src/data/staffDirectory.js';

const HEADER = [
  '内部ID', '社員番号', '氏名', 'フリガナ', '生年月日', '職種', '勤務形態', '役職', '入社日',
  '保有資格', '電話番号', 'メールアドレス', '緊急連絡先', '備考', 'ステータス', 'フロア',
  '並び順', '退職日', '夜勤可', '固定パターン', '出勤上限', '手動固定', '繰越区分',
  '版番号', '更新者', '更新時刻',
];

function row(overrides: Record<string, string>): string[] {
  const values = new Array(HEADER.length).fill('');
  for (const [key, value] of Object.entries(overrides)) {
    values[HEADER.indexOf(key)] = value;
  }
  return values;
}

const ROWS = [
  HEADER,
  row({ 内部ID: 'stf_a', 氏名: 'テスト職員A', ステータス: '在籍', フロア: '2階', 並び順: '3' }),
  row({ 内部ID: 'stf_b', 氏名: 'テスト職員B', ステータス: '在籍', フロア: '2階', 並び順: '1' }),
  row({ 内部ID: 'stf_c', 氏名: 'テスト職員C', ステータス: '退職', フロア: '2階', 並び順: '2' }),
  row({ 内部ID: 'stf_d', 氏名: 'テスト職員D', ステータス: '在籍', フロア: '3階', 並び順: '1' }),
  row({ 内部ID: 'stf_e', 氏名: 'テスト職員E', ステータス: '在籍', フロア: '4階' }),
  row({ 内部ID: 'stf_f', 氏名: 'テスト職員F', ステータス: '在籍', フロア: '' }),
  row({ 内部ID: 'stf_g', 氏名: 'テスト職員G', ステータス: '在籍', フロア: '2階' }),
];

describe('parseStaffDirectoryRows: 2F名簿（職員）の読み方', () => {
  it('既定では2階の在籍者だけを返す（3階・4階・退職・フロア空欄を除く）', () => {
    const result = parseStaffDirectoryRows(ROWS);
    expect(result.map((entry) => entry.staffId)).toEqual(['stf_b', 'stf_a', 'stf_g']);
  });

  it('名簿の並び順（数値）の昇順で並ぶ——氏名の五十音順ではない', () => {
    const result = parseStaffDirectoryRows(ROWS);
    expect(result.map((entry) => entry.sortOrder)).toEqual([1, 3, null]);
  });

  it('並び順が空の在籍職員を捨てず、末尾へ回す（新人の候補が消えない）', () => {
    const result = parseStaffDirectoryRows(ROWS);
    const last = result[result.length - 1];
    expect(last.staffId).toBe('stf_g');
    expect(last.sortOrder).toBeNull();
  });

  it('floor を渡すとそのフロアの在籍者を返す（3階・4階のアプリでも使える）', () => {
    const result = parseStaffDirectoryRows(ROWS, { floor: '3階' });
    expect(result.map((entry) => entry.staffId)).toEqual(['stf_d']);
  });

  it('列そのものが無いヘッダは 503 で止まる（値の空欄とは別に扱う）', () => {
    const brokenHeader = HEADER.filter((label) => label !== 'フロア');
    expect(() => parseStaffDirectoryRows([brokenHeader, []])).toThrowError(/職員名簿の列/);
  });

  it('IDが重複していたら契約違反として止まる', () => {
    const dup = [
      HEADER,
      row({ 内部ID: 'stf_a', 氏名: 'テスト職員A', ステータス: '在籍', フロア: '2階', 並び順: '1' }),
      row({ 内部ID: 'stf_a', 氏名: 'テスト職員A2', ステータス: '在籍', フロア: '2階', 並び順: '2' }),
    ];
    expect(() => parseStaffDirectoryRows(dup)).toThrowError(/職員名簿のID/);
  });
});
