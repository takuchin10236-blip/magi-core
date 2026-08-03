#!/usr/bin/env node
/**
 * check-master-links.mjs — マスタ紐づけ点検 原本（v0.13.3・2026-08-03 社長指示）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 何を見るか:
 *   MAGIの各アプリは職員・利用者マスタ（スプレッドシート）を参照して動く。
 *   「つながって機能するか」を2層で点検する:
 *     [1] 静的: functions/ のコードが参照する台帳キー（env.XXX_SPREADSHEET_ID）を列挙
 *     [2] 実配線: その鍵が本番の Cloudflare Pages 設定（Secret/vars）に実在するか名前で突合
 *   鍵の**値**には一切触れない（名前だけ）。読取専用・設定は変更しない。
 *
 * 限界（正直に明記）:
 *   「鍵がある」までを保証する。「その鍵で今この瞬間シートが読めるか」（共有剥がれ・
 *   シート削除）は、Access の内側の /api/health を叩ける Service Token が要るため本版では
 *   対象外——アプリ画面の「状態の説明」がその生き死にを表示する（運用側の目視点）。
 *
 * 使い方: npm run check:masters（各アプリのシム経由）。検査対象 root は
 *   環境変数 MAGI_MASTER_CHECK_ROOT または cwd。
 * exit: 0=合格 / 1=不合格（鍵の欠け・プロジェクト不在） / 2=未確認（トークン無し等）
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  diffMasterKeys,
  extractRequiredSheetKeys,
  parseWranglerMasterVars,
} from './master-links-lib.mjs';

const APP_ROOT = process.env.MAGI_MASTER_CHECK_ROOT || process.cwd();

function collectSources(dir) {
  if (!existsSync(dir)) return '';
  let text = '';
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) text += collectSources(full);
    else if (/\.(ts|js|mjs)$/.test(entry)) text += readFileSync(full, 'utf8') + '\n';
  }
  return text;
}

function loadCredentials() {
  let token = process.env.CF_API_TOKEN || '';
  let accountId = process.env.CF_ACCOUNT_ID || '';
  const tokenPath = join(homedir(), '.config', 'cloudflare', 'api-token');
  if (!token && existsSync(tokenPath)) {
    const m = readFileSync(tokenPath, 'utf8').match(/CF_API_TOKEN\s*=\s*(\S+)/);
    if (m) token = m[1];
  }
  const envPath = join(homedir(), '.magi-secrets', 'cloudflare-access.env');
  if (!accountId && existsSync(envPath)) {
    const m = readFileSync(envPath, 'utf8').match(/CF_ACCOUNT_ID\s*=\s*(\S+)/);
    if (m) accountId = m[1];
  }
  return { token, accountId };
}

async function main() {
  console.log('== マスタ紐づけ点検（12_本番保全標準 §4-2 拡張・2026-08-03） ==');

  const wranglerPath = join(APP_ROOT, 'wrangler.toml');
  if (!existsSync(wranglerPath)) {
    console.error('wrangler.toml が見つかりません。判定: 未確認（合格ではありません）');
    process.exit(2);
  }
  const { name, sheetNames } = parseWranglerMasterVars(readFileSync(wranglerPath, 'utf8'));
  const sources = collectSources(join(APP_ROOT, 'functions'));
  const required = extractRequiredSheetKeys(sources);

  console.log(`アプリ: ${name ?? '(name不明)'}`);
  if (required.length === 0) {
    console.log('コードが直接参照する台帳キー（*_SPREADSHEET_ID）はありません。');
    console.log('（供給API経由・読取専用スナップショット型などのアプリ。この点検は対象外）');
    console.log('\n判定: 合格（直結なし）');
    process.exit(0);
  }
  console.log(`コードが要求する台帳の鍵: ${required.join(', ')}`);
  for (const [k, v] of Object.entries(sheetNames)) console.log(`  タブ名（wrangler宣言）: ${k} = ${v}`);

  const { token, accountId } = loadCredentials();
  if (!token || !accountId || !name) {
    console.log('\nSKIP: Cloudflare 読取トークンまたはプロジェクト名が無く、本番設定と突合できません。');
    console.log('判定: 未確認（合格ではありません）');
    process.exit(2);
  }

  let project;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${name}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) throw new Error(body?.errors?.map((e) => e.message).join(' / ') || `HTTP ${res.status}`);
    project = body.result;
  } catch (error) {
    console.log(`\nNG: Pages プロジェクト「${name}」を確認できませんでした（${error.message}）。`);
    console.log('判定: 不合格（プロジェクト名の食い違い、またはトークン権限を確認）');
    process.exit(1);
  }

  const prodKeys = Object.keys(project.deployment_configs?.production?.env_vars ?? {});
  const diff = diffMasterKeys(required, prodKeys);
  for (const k of diff.present) console.log(`  OK  ${k} … 本番設定に存在（値は見ていません）`);
  for (const k of diff.missing) console.log(`  NG  ${k} … 本番設定に無い＝このアプリは本番でマスタへつながりません`);

  console.log('');
  if (diff.missing.length > 0) {
    console.log(`判定: 不合格（鍵の欠け ${diff.missing.length}件）— 配備しても名簿が読めず「確認中」のまま止まります`);
    process.exit(1);
  }
  console.log('判定: 合格（コードが要求する鍵は本番にすべて存在。実際に読めるかは画面の「状態の説明」で確認）');
  process.exit(0);
}

main().catch((error) => {
  console.error('マスタ紐づけ点検が異常終了しました:', error.message);
  process.exit(1);
});
