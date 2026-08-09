/**
 * 同時編集の保存時チェック（楽観ロック・段1）の試験。
 *
 * 完成基準（起案 §1 問7）:
 *   - 後保存の検出率 100%（N=20 の同時保存試験が全て 409）
 *   - 自分の連続保存での誤検出 0 件（N=20 が全て通る）
 *   - 比較は保存対象の範囲のみ（無関係な行・別シート・末尾追記では跳ねない）
 *
 * 偽シートは Sheets の癖を再現する:
 *   values API は**末尾の空セル・末尾の空行を落として返す**。これを再現しないと
 *   「同じ内容なのに読み方で長さが違う」ケースの誤検出を試験で捕まえられない。
 */
import { describe, it, expect } from 'vitest';
import {
  assertFreshSnapshot,
  snapshotHash,
  STALE_SNAPSHOT_MESSAGE,
  STALE_SNAPSHOT_STATUS,
} from '../src/data/concurrency';
import { ApiError } from '../src/data/http';
import type { LoadResult, SheetValues } from '../src/data/types';

// ---- 偽シート（行・列を持つ最小のグリッド） ------------------------------------------------

type Grid = string[][];

const RANGE_PATTERN = /^(?:'([^']+)'|([^!]+))!([A-Z])(\d+):([A-Z])(\d+)$/;

function parseRange(range: string) {
  const matched = RANGE_PATTERN.exec(range);
  if (!matched) throw new Error(`試験用の range 表記ではありません: ${range}`);
  return {
    sheet: matched[1] ?? matched[2]!,
    startRow: Number(matched[4]) - 1,
    endRow: Number(matched[6]), // 排他的
    startCol: matched[3]!.charCodeAt(0) - 65,
    endCol: matched[5]!.charCodeAt(0) - 65 + 1, // 排他的
  };
}

function createFakeSheets(initial: Record<string, Grid>) {
  const book = new Map<string, Grid>(
    Object.entries(initial).map(([name, rows]) => [name, rows.map((row) => [...row])]),
  );

  function grid(sheet: string): Grid {
    const found = book.get(sheet);
    if (!found) throw new Error(`未定義のシート: ${sheet}`);
    return found;
  }

  // Sheets 同様、末尾の空セル・末尾の空行を落とす。
  function trimLikeSheets(rows: string[][]): SheetValues {
    const trimmed = rows.map((row) => {
      let end = row.length;
      while (end > 0 && row[end - 1] === '') end -= 1;
      return row.slice(0, end);
    });
    let last = trimmed.length;
    while (last > 0 && trimmed[last - 1]!.length === 0) last -= 1;
    return trimmed.slice(0, last);
  }

  async function read(range: string): Promise<LoadResult<SheetValues>> {
    const { sheet, startRow, endRow, startCol, endCol } = parseRange(range);
    const rows = grid(sheet)
      .slice(startRow, endRow)
      .map((row) => {
        const cells: string[] = [];
        for (let col = startCol; col < endCol; col += 1) cells.push(row[col] ?? '');
        return cells;
      });
    return { values: trimLikeSheets(rows), storage: 'sheets', readAt: new Date().toISOString() };
  }

  /** 範囲PUT（後勝ち上書き）。「他の職員の保存」もこれで再現する。 */
  function update(range: string, values: SheetValues): void {
    const { sheet, startRow, endRow, startCol, endCol } = parseRange(range);
    const rows = grid(sheet);
    for (let row = startRow; row < endRow; row += 1) {
      while (rows.length <= row) rows.push([]);
      const target = rows[row]!;
      for (let col = startCol; col < endCol; col += 1) {
        const cell = values[row - startRow]?.[col - startCol];
        target[col] = cell === undefined || cell === null ? '' : String(cell);
      }
    }
  }

  /** 末尾への追記（append 相当・既存行は触らない）。 */
  function appendRow(sheet: string, cells: string[]): void {
    grid(sheet).push([...cells]);
  }

  return { read, update, appendRow, snapshot: () => book };
}

const MASTER_ROWS: Grid = [
  ['利用者ID', '氏名', '居室'],
  ['U001', 'テスト太郎', '101'],
  ['U002', 'テスト花子', '102'],
  ['U003', 'テスト次郎', '103'],
  ['U004', 'テスト三郎', '104'],
  ['U005', 'テスト四郎', '105'], // 範囲外（A1:C5 に入らない行）
  ['U006', 'テスト五郎', '106'], // 範囲外
];

const TARGET_RANGE = '利用者マスタ!A1:C5';

function freshBook() {
  return createFakeSheets({
    利用者マスタ: MASTER_ROWS,
    シフト: [
      ['日付', '早番', '遅番'],
      ['2026-08-09', '職員A', '職員B'],
    ],
  });
}

async function expectStale(promise: Promise<void>): Promise<ApiError> {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ApiError);
  return caught as ApiError;
}

// ---- ④ hash の安定性 ---------------------------------------------------------------------

describe('snapshotHash（安定ハッシュ）', () => {
  it('sha256: 接頭辞＋16進64桁を返す', async () => {
    const hash = await snapshotHash([['a', 'b']]);
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('同じ内容なら何度取っても同じ（別インスタンスでも同値）', async () => {
    const first = await snapshotHash([['a', 1], ['b', 2]]);
    const second = await snapshotHash([['a', 1], ['b', 2]]);
    expect(second).toBe(first);
  });

  it('末尾の空セル・末尾の空行の差は吸収する（読み方の違いで跳ねさせない）', async () => {
    const base = await snapshotHash([['a', 'b'], ['c', 'd']]);
    expect(await snapshotHash([['a', 'b', '', ''], ['c', 'd', '']])).toBe(base);
    expect(await snapshotHash([['a', 'b'], ['c', 'd'], [], ['', '']])).toBe(base);
    expect(await snapshotHash([['a', 'b'], ['c', 'd', null, undefined]])).toBe(base);
  });

  it('空セル（null / undefined / 空文字）は同値として扱う', async () => {
    const base = await snapshotHash([['a', '', 'c']]);
    expect(await snapshotHash([['a', null, 'c']])).toBe(base);
    expect(await snapshotHash([['a', undefined, 'c']])).toBe(base);
  });

  it('数値と数字文字列・真偽値と TRUE/FALSE は同値（RAW 書込の型の揺れは内容の変更ではない）', async () => {
    expect(await snapshotHash([[1, 2.5]])).toBe(await snapshotHash([['1', '2.5']]));
    expect(await snapshotHash([[true, false]])).toBe(await snapshotHash([['TRUE', 'FALSE']]));
  });

  it('セルにオブジェクトが入ってもキー順に依存しない', async () => {
    const ab = await snapshotHash([[{ a: 1, b: { x: 1, y: 2 } }]]);
    const ba = await snapshotHash([[{ b: { y: 2, x: 1 }, a: 1 }]]);
    expect(ba).toBe(ab);
  });

  it('本当に違う内容ならハッシュが変わる（正規化が差分を潰していないことの確認）', async () => {
    const base = await snapshotHash([['a', 'b'], ['c', 'd']]);
    const mutations: SheetValues[] = [
      [['a', 'b'], ['c', 'D']], // 1セル書換
      [['a', 'b'], ['c', '']], // セルを空に
      [['a', 'b'], ['c', 'd'], ['e']], // 行追加（範囲内）
      [['a'], ['c', 'd']], // 行の途中を欠落
      [['a', '', 'b'], ['c', 'd']], // 途中の空セル（末尾ではないので吸収しない）
      [['c', 'd'], ['a', 'b']], // 並び替え
    ];
    for (const mutated of mutations) {
      expect(await snapshotHash(mutated)).not.toBe(base);
    }
  });
});

// ---- ① 誤検出0 ----------------------------------------------------------------------------

describe('assertFreshSnapshot（誤検出0）', () => {
  it('同値再保存を20回繰り返しても1度も跳ねない', async () => {
    const sheets = freshBook();
    for (let round = 0; round < 20; round += 1) {
      const loaded = await sheets.read(TARGET_RANGE);
      const snap = await snapshotHash(loaded.values);
      await expect(assertFreshSnapshot(sheets, TARGET_RANGE, snap)).resolves.toBeUndefined();
      sheets.update(TARGET_RANGE, loaded.values); // 同じ値をそのまま保存
    }
  });

  it('自分だけが20回連続で編集・保存しても1度も跳ねない', async () => {
    const sheets = freshBook();
    for (let round = 0; round < 20; round += 1) {
      const loaded = await sheets.read(TARGET_RANGE);
      const snap = await snapshotHash(loaded.values);
      await expect(assertFreshSnapshot(sheets, TARGET_RANGE, snap)).resolves.toBeUndefined();
      const next = loaded.values.map((row) => [...row]);
      next[1]![1] = `テスト太郎_${round}`;
      sheets.update(TARGET_RANGE, next);
    }
  });

  it('保存対象の範囲外（同シートの別の行）が書き換わっても跳ねない', async () => {
    const sheets = freshBook();
    const snap = await snapshotHash((await sheets.read(TARGET_RANGE)).values);
    sheets.update('利用者マスタ!A6:C7', [['U005', '別の職員が編集', '999']]);
    await expect(assertFreshSnapshot(sheets, TARGET_RANGE, snap)).resolves.toBeUndefined();
  });

  it('別シートが丸ごと書き換わっても跳ねない（シート単位 rev カウンタ方式を採らない理由）', async () => {
    const sheets = freshBook();
    const snap = await snapshotHash((await sheets.read(TARGET_RANGE)).values);
    sheets.update('シフト!A2:C2', [['2026-08-09', '職員C', '職員D']]);
    await expect(assertFreshSnapshot(sheets, TARGET_RANGE, snap)).resolves.toBeUndefined();
  });
});

// ---- ② 検出100% ---------------------------------------------------------------------------

describe('assertFreshSnapshot（検出100%）', () => {
  it('他の職員が先に保存した20通りのケースを全て 409 で止める', async () => {
    const results: number[] = [];
    for (let round = 0; round < 20; round += 1) {
      const sheets = freshBook();
      const snap = await snapshotHash((await sheets.read(TARGET_RANGE)).values);

      // 他の職員の先行保存（毎回ちがう行・列・値を1セル書き換える）。
      const row = (round % 4) + 2; // 2〜5行目（見出し行を除く範囲内）
      const col = String.fromCharCode(65 + (round % 3)); // A〜C
      sheets.update(`利用者マスタ!${col}${row}:${col}${row}`, [[`先行保存${round}`]]);

      const error = await expectStale(assertFreshSnapshot(sheets, TARGET_RANGE, snap));
      results.push(error.status);
    }
    expect(results).toHaveLength(20);
    expect(results.every((status) => status === STALE_SNAPSHOT_STATUS)).toBe(true);
  });

  it('セルを空にする・範囲内に行が増える先行保存も止める', async () => {
    const clearing = freshBook();
    const clearingSnap = await snapshotHash((await clearing.read(TARGET_RANGE)).values);
    clearing.update('利用者マスタ!B3:B3', [['']]);
    expect((await expectStale(assertFreshSnapshot(clearing, TARGET_RANGE, clearingSnap))).status).toBe(
      STALE_SNAPSHOT_STATUS,
    );

    const growing = createFakeSheets({ 利用者マスタ: MASTER_ROWS.slice(0, 3) });
    const growingSnap = await snapshotHash((await growing.read(TARGET_RANGE)).values);
    growing.update('利用者マスタ!A4:C4', [['U010', '追加された利用者', '110']]);
    expect((await expectStale(assertFreshSnapshot(growing, TARGET_RANGE, growingSnap))).status).toBe(
      STALE_SNAPSHOT_STATUS,
    );
  });

  it('スナップショット欠落・形式不正も通さない（fail-closed）', async () => {
    const sheets = freshBook();
    for (const broken of ['', 'sha256:', 'undefined', 'sha256:zzzz']) {
      expect((await expectStale(assertFreshSnapshot(sheets, TARGET_RANGE, broken))).code).toBe(
        'STALE_SNAPSHOT',
      );
    }
  });
});

// ---- ③ 文言・理由コード -------------------------------------------------------------------

describe('競合時の理由コードと文言', () => {
  it('ApiError（code=STALE_SNAPSHOT / status=409 / 定型文言）を投げる', async () => {
    const sheets = freshBook();
    const snap = await snapshotHash((await sheets.read(TARGET_RANGE)).values);
    sheets.update('利用者マスタ!B2:B2', [['別の職員が編集']]);

    const error = await expectStale(assertFreshSnapshot(sheets, TARGET_RANGE, snap));
    expect(error.code).toBe('STALE_SNAPSHOT');
    expect(error.status).toBe(409);
    expect(error.message).toBe(STALE_SNAPSHOT_MESSAGE);
  });

  it('定型文言は起案 §2 の逐語（勝手に言い換えない）', () => {
    expect(STALE_SNAPSHOT_MESSAGE).toBe(
      '他の職員が先に保存しました。最新を読み込み直してから、もう一度編集してください。',
    );
    expect(STALE_SNAPSHOT_STATUS).toBe(409);
  });
});

// ---- ⑤ append は対象外 --------------------------------------------------------------------

describe('append は対象外（追記は上書きしない）', () => {
  it('他の職員が末尾に追記しても、保存対象範囲のスナップショットは変わらない', async () => {
    const sheets = createFakeSheets({ 利用者マスタ: MASTER_ROWS.slice(0, 5) });
    const before = await snapshotHash((await sheets.read(TARGET_RANGE)).values);

    sheets.appendRow('利用者マスタ', ['U099', '追記された利用者', '199']);

    const after = await snapshotHash((await sheets.read(TARGET_RANGE)).values);
    expect(after).toBe(before);
    await expect(assertFreshSnapshot(sheets, TARGET_RANGE, before)).resolves.toBeUndefined();
  });

  it('追記された行そのものを対象範囲に含めれば、当然その変化は見える（範囲限定の裏返し）', async () => {
    const sheets = createFakeSheets({ 利用者マスタ: MASTER_ROWS.slice(0, 5) });
    const wideRange = '利用者マスタ!A1:C6';
    const before = await snapshotHash((await sheets.read(wideRange)).values);

    sheets.appendRow('利用者マスタ', ['U099', '追記された利用者', '199']);

    expect((await expectStale(assertFreshSnapshot(sheets, wideRange, before))).code).toBe(
      'STALE_SNAPSHOT',
    );
  });
});
