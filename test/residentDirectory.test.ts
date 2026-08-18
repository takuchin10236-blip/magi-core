/**
 * 2F名簿（利用者）の読み方の試験（v0.19.0・2026-08-18 社長裁定「型に昇格」）。
 * 実物の利用者背骨は23列。ヘッダ名と値域（入所中/転出・居室番号の枝番 `201-1` 等）は
 * CCがDrive経由で実測した値を写している（氏名は合成）。
 */
import { describe, expect, it } from 'vitest';
import { parseResidentDirectoryRows } from '../src/data/residentDirectory.js';

const HEADER = [
  '利用者ID', '氏名', 'フリガナ', '性別', '生年月日', '介護度', '入所日', '退所日',
  '居室番号', '担当職員', 'ステータス', '備考', 'バージョン', '更新者', '更新日時',
  'AI相談不可', 'episodeId', '削除日時', '削除者', '削除理由', '入所区分', '担当職員ID', 'フロア',
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
  row({ 利用者ID: '00003', 氏名: 'テスト利用者C', ステータス: '入所中', 居室番号: '213' }),
  row({ 利用者ID: '00001', 氏名: 'テスト利用者A', ステータス: '入所中', 居室番号: '204-1' }),
  row({ 利用者ID: '00002', 氏名: 'テスト利用者B', ステータス: '入所中', 居室番号: '204-2' }),
  row({ 利用者ID: '00007', 氏名: 'テスト利用者H', ステータス: '入所中', 居室番号: '204-10' }),
  row({ 利用者ID: '00004', 氏名: 'テスト利用者D', ステータス: '転出', 居室番号: '202' }),
  row({ 利用者ID: '00005', 氏名: 'テスト利用者E', ステータス: '入所中', 居室番号: '201-1' }),
  row({ 利用者ID: '00006', 氏名: 'テスト利用者F', ステータス: '入所中', 居室番号: '' }),
];

describe('parseResidentDirectoryRows: 2F名簿（利用者）の読み方', () => {
  it('居室番号の自然順で並ぶ——枝番が2桁になると文字列順は 204-10 を 204-2 より前へ置いて誤る', () => {
    const result = parseResidentDirectoryRows(ROWS);
    expect(result.map((entry) => entry.room)).toEqual(['201-1', '204-1', '204-2', '204-10', '213', '']);
  });

  it('入所中だけを返し、転出を除く', () => {
    const result = parseResidentDirectoryRows(ROWS);
    expect(result.map((entry) => entry.residentId)).not.toContain('00004');
    expect(result).toHaveLength(6);
  });

  it('居室番号が空の入所者を捨てず、末尾へ回す', () => {
    const result = parseResidentDirectoryRows(ROWS);
    expect(result[result.length - 1].residentId).toBe('00006');
  });

  it('転入も在籍として扱う（入所区分の違いで候補から消さない）', () => {
    const rows = [
      HEADER,
      row({ 利用者ID: '00010', 氏名: 'テスト利用者G', ステータス: '転入', 居室番号: '205-1' }),
    ];
    expect(parseResidentDirectoryRows(rows).map((entry) => entry.residentId)).toEqual(['00010']);
  });

  it('居室番号の列そのものが無いヘッダは 503 で止まる', () => {
    const brokenHeader = HEADER.filter((label) => label !== '居室番号');
    expect(() => parseResidentDirectoryRows([brokenHeader, []])).toThrowError(/利用者名簿の列/);
  });
});
