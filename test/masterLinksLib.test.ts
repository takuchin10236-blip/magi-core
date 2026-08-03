/**
 * マスタ紐づけ点検 純ロジックの試験（v0.13.3・2026-08-03 社長指示）。
 * 「必要な紐づけマスタがちゃんとつながるか」の静的層＝コードが要求する鍵の列挙と、
 * 本番設定の鍵名との突合が正しく落ちることを固定する。
 */
import { describe, expect, it } from 'vitest';
import {
  diffMasterKeys,
  extractRequiredSheetKeys,
  parseWranglerMasterVars,
} from '../ci/master-links-lib.mjs';

describe('extractRequiredSheetKeys: コードが参照する台帳キーの列挙', () => {
  it('env.XXX_SPREADSHEET_ID を重複なしで拾う', () => {
    const src = `
      const a = env.STAFF_MASTER_SPREADSHEET_ID;
      read(env.STAFF_MASTER_SPREADSHEET_ID);
      const b = env.RESIDENT_MASTER_SPREADSHEET_ID;
    `;
    expect(extractRequiredSheetKeys(src)).toEqual([
      'RESIDENT_MASTER_SPREADSHEET_ID',
      'STAFF_MASTER_SPREADSHEET_ID',
    ]);
  });
  it('定数経由（const KEY = \'..._SPREADSHEET_ID\'; env[KEY]）も拾う——利用者マスタの実形', () => {
    const src = "const STAFF_SPREADSHEET_ID_KEY = 'STAFF_MASTER_SPREADSHEET_ID';\nconst id = env[STAFF_SPREADSHEET_ID_KEY];";
    expect(extractRequiredSheetKeys(src)).toEqual(['STAFF_MASTER_SPREADSHEET_ID']);
  });
  it('SPREADSHEET_ID で終わらない env 参照や無関係の語は拾わない', () => {
    const src = 'env.APP_NAME; env.DEV_MODE; const SPREADSHEET_ID = "x"; env.AUDIT_SHEET_NAME;';
    expect(extractRequiredSheetKeys(src)).toEqual([]);
  });
});

describe('parseWranglerMasterVars', () => {
  it('name とタブ名キーを読む（コメント行は拾わない）', () => {
    const toml = `
name = "magi-sample-app"
[vars]
STAFF_MASTER_SHEET_NAME = "職員マスタ"
# AUDIT_SHEET_NAME = "ghost"
AUDIT_SHEET_NAME = "AuditLog"
`;
    const v = parseWranglerMasterVars(toml);
    expect(v.name).toBe('magi-sample-app');
    expect(v.sheetNames).toEqual({ STAFF_MASTER_SHEET_NAME: '職員マスタ', AUDIT_SHEET_NAME: 'AuditLog' });
  });
});

describe('diffMasterKeys: 要求と本番設定の突合', () => {
  it('本番に無い鍵を missing として挙げる（これが「つながらない」の検出）', () => {
    const d = diffMasterKeys(
      ['STAFF_MASTER_SPREADSHEET_ID', 'RESIDENT_MASTER_SPREADSHEET_ID'],
      ['STAFF_MASTER_SPREADSHEET_ID', 'GOOGLE_PRIVATE_KEY'],
    );
    expect(d.present).toEqual(['STAFF_MASTER_SPREADSHEET_ID']);
    expect(d.missing).toEqual(['RESIDENT_MASTER_SPREADSHEET_ID']);
  });
  it('全部あれば missing は空', () => {
    const d = diffMasterKeys(['A_SPREADSHEET_ID'], ['A_SPREADSHEET_ID']);
    expect(d.missing).toEqual([]);
  });
});
