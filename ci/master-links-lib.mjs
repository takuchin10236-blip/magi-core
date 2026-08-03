/**
 * master-links-lib.mjs — マスタ紐づけ点検の純ロジック（v0.13.3）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 何のため（2026-08-03 社長指示）:
 *   「各アプリは職員・利用者マスタを参照することがほとんど。必要な紐づけマスタが
 *    ちゃんとつながって機能するか？の点検もできるように」。
 *   つながらない原因の大半は「コードが参照する台帳の鍵（*_SPREADSHEET_ID）が
 *   本番の Cloudflare 設定に入っていない」こと。ここを機械で突合する。
 *
 * このファイルはネットワークに触れない純関数だけ（試験可能性のため）。CLI は check-master-links.mjs。
 */

/**
 * functions/ 配下のソーステキストから、コードが実際に参照する台帳キーを列挙する。
 * 対象は `env.XXX_SPREADSHEET_ID` の形（MAGI 型のデータ直結はこの形に統一されている）。
 * 変数・ブラケット参照は対象外（現行の型に存在しないため。現れたら拡張する）。
 */
export function extractRequiredSheetKeys(sourceText) {
  const found = new Set();
  const text = String(sourceText);
  // 直接参照: env.XXX_SPREADSHEET_ID
  for (const m of text.matchAll(/\benv\.([A-Z][A-Z0-9_]*_SPREADSHEET_ID)\b/g)) {
    found.add(m[1]);
  }
  // 定数経由: const KEY = 'XXX_SPREADSHEET_ID'; env[KEY]（実例＝利用者マスタの職員名簿参照。
  // 2026-08-03 実測でこの形を見落とし「職員名簿の鍵は不要」と誤報した——文字列リテラルも拾う）
  for (const m of text.matchAll(/['"]([A-Z][A-Z0-9_]*_SPREADSHEET_ID)['"]/g)) {
    found.add(m[1]);
  }
  return [...found].sort();
}

/** wrangler.toml から name と、情報表示用のタブ名キー（*_SHEET_NAME）を読む。 */
export function parseWranglerMasterVars(text) {
  const name = (() => {
    const m = String(text).match(/^\s*name\s*=\s*"([^"]*)"/m);
    return m ? m[1] : null;
  })();
  const sheetNames = {};
  for (const m of String(text).matchAll(/^\s*([A-Z][A-Z0-9_]*_SHEET_NAME)\s*=\s*"([^"]*)"/gm)) {
    sheetNames[m[1]] = m[2];
  }
  return { name, sheetNames };
}

/**
 * 「コードが要求する鍵」と「本番に設定されている鍵の名前一覧」を突合する。
 * 値は一切扱わない（名前だけ）。
 */
export function diffMasterKeys(requiredKeys, productionKeyNames) {
  const have = new Set(productionKeyNames);
  return {
    present: requiredKeys.filter((k) => have.has(k)),
    missing: requiredKeys.filter((k) => !have.has(k)),
  };
}
