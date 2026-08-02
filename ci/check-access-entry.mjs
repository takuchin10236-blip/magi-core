#!/usr/bin/env node
/**
 * check-access-entry.mjs — 入口チェック原本（Cloudflare Access の実設定と repo の突合）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 型上の位置づけ（12_本番保全標準 §4-2・2026-08-02 社長指示で新設）:
 *   「現場運用化（業務本番化）の前に必ず1回、および型の定期確認のたびに実行する」
 *   チェック項目。ゲートC（型適用DoD）の1行。
 *
 * 立ち位置:
 *   - **読取専用**。Access の設定を1バイトも変更しない（04 §4-5-1「読める者と
 *     変えられる者を分ける」）。使うトークンは Access: Apps and Policies **Read**。
 *   - `npm run check` には入れない。ネットワークとトークンに依存するため、
 *     オフラインで通常の検査が落ちる害の方が大きい。入口を変えた後・定期確認で人が走らせる。
 *   - 「未確認」は「合格」ではない。鍵が無い・通信できない時は exit 2 で明示する（fail loud）。
 *
 * 検査対象 root:
 *   環境変数 MAGI_ACCESS_CHECK_ROOT があればそこ、無ければカレントディレクトリの
 *   wrangler.toml を読む（各アプリのシムは自 repo root を渡すだけ）。
 *
 * 入口の許可リストは「明示」が規律（12 §4-2・2026-08-02 社長裁定）:
 *   wrangler.toml の ACCESS_ALLOWLIST ＝そのアプリに誰が入るかの**意図の正本**。
 *   キー自体が無いアプリは「意図未記載」として不合格にする（既定に頼らない）。
 *
 * 鍵: 環境変数 CF_API_TOKEN / CF_ACCOUNT_ID を優先。無ければ
 *   ~/.magi-secrets/cloudflare-access.env。値は画面にもログにも出さない。
 *
 * exit code: 0=合格 / 1=不合格 / 2=未確認（鍵なし・通信不能）
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  EXPECTED_TEAM_DOMAIN,
  MIN_ACCEPTABLE_HOURS,
  STANDARD_SESSION_HOURS,
  diffAllowlist,
  durationToHours,
  evaluateSessionHours,
  humanHours,
  maskEmail,
  parseWranglerEntryVars,
} from './access-entry-lib.mjs';

const APP_ROOT = process.env.MAGI_ACCESS_CHECK_ROOT || process.cwd();

const results = [];
let hasFail = false;

function record(step, level, headline, details = []) {
  results.push({ step, level, headline, details });
  if (level === 'FAIL') hasFail = true;
}

function loadCredentials() {
  let token = process.env.CF_API_TOKEN || '';
  let accountId = process.env.CF_ACCOUNT_ID || '';
  const envPath = join(homedir(), '.magi-secrets', 'cloudflare-access.env');
  if ((!token || !accountId) && existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (m[1] === 'CF_API_TOKEN' && !token) token = value;
      if (m[1] === 'CF_ACCOUNT_ID' && !accountId) accountId = value;
    }
  }
  return { token, accountId, envPath };
}

async function cfGet(path, { token, accountId }) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const reason = body?.errors?.map((e) => e.message).join(' / ') || `HTTP ${res.status}`;
    throw new Error(reason);
  }
  return body.result;
}

async function main() {
  const wranglerPath = join(APP_ROOT, 'wrangler.toml');
  if (!existsSync(wranglerPath)) {
    console.error(`wrangler.toml が見つかりません: ${wranglerPath}`);
    console.error('（Cloudflare Pages 型のアプリではないか、検査対象 root の指定誤り）');
    process.exit(2);
  }
  const expected = parseWranglerEntryVars(readFileSync(wranglerPath, 'utf8'));

  console.log('== 入口チェック（Cloudflare Access）＝ 12_本番保全標準 §4-2 ==');
  console.log(`アプリ : ${expected.appName ?? expected.name ?? '(名称不明)'}`);
  console.log(`対象URL: ${expected.host ?? '(特定不能)'}${expected.hostInferred ? '（wrangler.toml の name から推定）' : ''}`);
  console.log('');

  if (!expected.host) {
    console.error('PRODUCTION_HOST も name も読めず、対象を特定できないため停止します。');
    process.exit(2);
  }

  const creds = loadCredentials();
  if (!creds.token || !creds.accountId) {
    console.log('SKIP: 読取トークンが見つからないため、入口の実設定を確認できませんでした。');
    console.log(`      環境変数 CF_API_TOKEN / CF_ACCOUNT_ID か ${creds.envPath} を用意してください。`);
    console.log('\n判定: 未確認（合格ではありません）');
    process.exit(2);
  }

  let apps;
  try {
    apps = await cfGet('/access/apps', creds);
  } catch (error) {
    console.log(`SKIP: Cloudflare へ問い合わせできませんでした（${error.message}）。`);
    console.log('\n判定: 未確認（合格ではありません）');
    process.exit(2);
  }

  // [1] Application の一意特定（04 §4-5-1「ゼロ件・複数件ヒット時は停止」）
  const matched = (apps || []).filter((a) => {
    const domains = [a.domain, ...(a.self_hosted_domains || [])].filter(Boolean);
    return domains.some((d) => String(d).replace(/\/$/, '') === expected.host);
  });

  if (matched.length === 0) {
    record(1, 'FAIL', `入口そのものが見つかりません（${expected.host} の Application が0件）`, [
      'この状態では誰も入れないか、逆に誰でも入れます。Access の Application を作ってください。',
    ]);
    return report();
  }
  if (matched.length > 1) {
    record(1, 'FAIL', `同じURLの Application が ${matched.length} 件あり、どれが効くか特定できません`, [
      ...matched.map((a) => `候補: 「${a.name}」 id=${a.id}`),
      '重複を解消してから再実行してください（誤った側を見て「合格」と誤判定するため停止します）。',
    ]);
    return report();
  }
  const app = matched[0];
  record(1, 'OK', `Application を一意特定しました（「${app.name}」）`);

  // [2] AUD の一致（ずれると全員が弾かれる・最も痛い事故）
  if (!expected.aud) {
    record(2, 'FAIL', 'wrangler.toml に CF_ACCESS_AUD がありません', [
      `Cloudflare 側の AUD: ${String(app.aud).slice(0, 12)}… を wrangler.toml へ記載してください。`,
    ]);
  } else if (expected.aud !== app.aud) {
    record(2, 'FAIL', 'AUD が食い違っています（この状態だと全員が弾かれます）', [
      `wrangler.toml : ${expected.aud.slice(0, 12)}…`,
      `Cloudflare側  : ${String(app.aud).slice(0, 12)}…`,
      'AUD はアプリを作り直すと変わります。Cloudflare 側の値を wrangler.toml へ反映してください。',
    ]);
  } else {
    record(2, 'OK', 'AUD が一致しています（repo と Cloudflare が同じ入口を指している）');
  }

  // [3] チームドメイン
  if (expected.teamDomain !== EXPECTED_TEAM_DOMAIN) {
    record(3, expected.teamDomain == null ? 'WARN' : 'FAIL',
      `チームドメインが型の正本と${expected.teamDomain == null ? '未記載' : '不一致'}（${expected.teamDomain ?? 'キーなし'}）`,
      [`正本は ${EXPECTED_TEAM_DOMAIN}（04 §4-5-1 第5箇条）。`]);
  } else {
    record(3, 'OK', `チームドメインが型の正本と一致（${EXPECTED_TEAM_DOMAIN}）`);
  }

  let policies;
  try {
    policies = await cfGet(`/access/apps/${app.id}/policies`, creds);
  } catch (error) {
    record(4, 'FAIL', `Policy を読めませんでした（${error.message}）`, [
      'トークンの権限が Apps Read だけの可能性があります。Apps and Policies Read が要ります。',
    ]);
    return report();
  }
  const identityPolicies = (policies || []).filter((p) => p.decision !== 'non_identity');
  const machinePolicies = (policies || []).filter((p) => p.decision === 'non_identity');

  // [4] 認証の頻度（毎日認証を止める・B-22 事例）
  const session = evaluateSessionHours(
    app.session_duration,
    identityPolicies.map((p) => ({ name: p.name, duration: p.session_duration })),
  );
  const sessionDetails = [
    `Application: ${app.session_duration}（${humanHours(durationToHours(app.session_duration))}）`,
    ...session.details,
  ];
  if (session.unreadable) {
    record(4, 'WARN', '認証の間隔を解釈できない値が混ざっています（目視で確認してください）', sessionDetails);
  } else if (session.worstHours < MIN_ACCEPTABLE_HOURS) {
    record(4, 'FAIL', `認証が ${humanHours(session.worstHours)} 来ます。業務に支障が出ます`, [
      ...sessionDetails,
      `型の基準は ${STANDARD_SESSION_HOURS}h（約1か月に1回）です。短い側の値を直してください。`,
    ]);
  } else if (session.worstHours < STANDARD_SESSION_HOURS) {
    record(4, 'WARN', `認証の間隔が型の基準より短めです（${humanHours(session.worstHours)}）`, sessionDetails);
  } else {
    record(4, 'OK', `認証は ${humanHours(session.worstHours)}で済みます（型の基準どおり）`, sessionDetails);
  }

  // [5] 入れる人と、アプリ内の権限の突合
  const cfEmails = new Set();
  const unreadableRules = [];
  for (const p of identityPolicies) {
    if (p.decision !== 'allow') continue;
    for (const rule of p.include || []) {
      if (rule.email?.email) cfEmails.add(String(rule.email.email).toLowerCase());
      else unreadableRules.push(`${p.name}: ${Object.keys(rule)[0]}`);
    }
  }
  const listDetails = [
    `入口（Cloudflare）で許可: ${cfEmails.size}名 — ${[...cfEmails].map(maskEmail).join(', ') || 'なし'}`,
  ];
  if (unreadableRules.length) listDetails.push(`メール以外の許可ルール ${unreadableRules.length} 件（目視確認）: ${unreadableRules.join(', ')}`);
  if (machinePolicies.length) listDetails.push(`（参考）機械用の許可（Service Token）が ${machinePolicies.length} 件。人の認証には影響しません`);

  if (expected.allowlist == null) {
    // 意図の正本が書かれていない。「書かなかった時の既定」に頼らせない（12 §4-2 規律）。
    record(5, 'FAIL', 'wrangler.toml に ACCESS_ALLOWLIST がありません（このアプリに誰が入るかの意図が未記載）', [
      '入口の許可は意図を書いた上で突合します。誰を入れるかを決めて ACCESS_ALLOWLIST を記載してください。',
      ...listDetails,
    ]);
  } else {
    listDetails.splice(1, 0, `アプリ内 ACCESS_ALLOWLIST: ${expected.allowlist.length}名 — ${expected.allowlist.map(maskEmail).join(', ') || 'なし'}`);
    const diff = diffAllowlist(expected.allowlist, [...cfEmails]);
    if (diff.blocked.length) {
      record(5, 'FAIL', `入口で弾かれる人が ${diff.blocked.length} 名います`, [
        ...diff.blocked.map((e) => `弾かれる: ${maskEmail(e)}（アプリは許可しているが Access が許可していない）`),
        ...listDetails,
      ]);
    } else if (diff.powerless.length) {
      record(5, 'WARN', `入れるがアプリ内の権限が無い人が ${diff.powerless.length} 名います`, [
        ...diff.powerless.map((e) => `権限なし: ${maskEmail(e)}（画面は開くが、名乗れず操作できない可能性）`),
        ...listDetails,
      ]);
    } else if (unreadableRules.length) {
      record(5, 'WARN', 'メール以外の許可ルールがあるため、突合を機械で完了できません', listDetails);
    } else {
      record(5, 'OK', `入れる人とアプリ内の権限が一致しています（${cfEmails.size}名）`, listDetails);
    }
  }

  report();
}

function report() {
  const mark = { OK: 'OK  ', WARN: 'WARN', FAIL: 'NG  ' };
  const label = {
    1: 'Application の特定',
    2: 'AUD の一致      ',
    3: 'チームドメイン  ',
    4: '認証の頻度      ',
    5: '入れる人と権限  ',
  };
  for (const r of results) {
    console.log(`[${r.step}] ${label[r.step]} ${mark[r.level]} ${r.headline}`);
    for (const d of r.details) console.log(`      - ${d}`);
  }
  console.log('');
  const fails = results.filter((r) => r.level === 'FAIL').length;
  const warns = results.filter((r) => r.level === 'WARN').length;
  if (hasFail) {
    console.log(`判定: 不合格（NG ${fails}件・警告 ${warns}件）— この状態でフロアに配ると業務が止まります`);
    process.exit(1);
  }
  console.log(`判定: 合格（NG 0件・警告 ${warns}件）`);
  process.exit(0);
}

main().catch((error) => {
  console.error('入口チェックが異常終了しました:', error.message);
  process.exit(1);
});
