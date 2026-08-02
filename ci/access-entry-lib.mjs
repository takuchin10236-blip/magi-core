/**
 * access-entry-lib.mjs — 入口チェックの純ロジック（v0.13.0）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 何のため（12_本番保全標準 §4-2・2026-08-02 社長指示）:
 *   コード側の検査（UIガード・境界ガード等）は repo の中しか見ない。入口そのもの——
 *   誰が入れるか・どれだけの頻度で認証が来るか——は Cloudflare Access 側にあり、
 *   ズレても検査が1つも鳴らない。フロアで業務が止まる入口事故は2つに集約される:
 *     (1) 入れるはずの人が弾かれる（許可リストの入れ忘れ・AUD のずれ）
 *     (2) 認証が何度も来る（session_duration が短い。Policy の値は Application を
 *         **上書きする**＝04 §4-1 の B-22 事例で「毎日認証」が実際に起きた）
 *
 * このファイルはネットワークに触れない純関数だけを持つ（試験可能性のため）。
 *   CLI 本体は check-access-entry.mjs。
 *
 * 由来: magi-staff-directory tools/check-access-entry.mjs（2026-08-02・基準実体）を
 *   コア原本へ昇格。負例5本（AUDずれ・弾かれる人・入口不在・頻度判定・鍵なし）で
 *   検出力を確認済み。
 */

/** 型の基準値（04 §4-1: 730h = 1か月・業務職員は月1回の認証で済む）。 */
export const STANDARD_SESSION_HOURS = 730;
/** これを下回ると業務に支障が出ると判断する下限（1週間に1回より頻繁な認証）。 */
export const MIN_ACCEPTABLE_HOURS = 168;
/** 全アプリ共通の固定値（正本＝04 §4-5-1 第5箇条）。 */
export const EXPECTED_TEAM_DOMAIN = 'magi10236.cloudflareaccess.com';

/** 個人が特定できる形で画面に出さない（禁則③ Option B）。 */
export function maskEmail(email) {
  return String(email).replace(/^(.{2}).*?(@.*)$/, '$1***$2');
}

/**
 * チームドメインの正規化（v0.13.2）。既存アプリの実測で `https://` 前置きの表記ゆれが
 * 5本見つかった。スキームの有無は入口事故ではない（アプリは動いている）ので、
 * 比較は正規化後に行い、表記ゆれは WARN に格下げする（偽NGは狼少年化＝本物のNGを霞ませる）。
 */
export function normalizeTeamDomain(value) {
  return String(value ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

/**
 * wrangler.toml のテキストから入口チェックに要る値を読む。
 * PRODUCTION_HOST が無い場合は `name = "..."` から `<name>.pages.dev` を推定する
 * （旧世代アプリへの配布時に、キー不足で検査自体が走らないことを防ぐ。
 *   推定を使ったことは hostInferred で返し、CLI が明示する）。
 */
export function parseWranglerEntryVars(text) {
  const pick = (key) => {
    const re = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, 'm');
    const m = text.match(re);
    return m ? m[1] : null;
  };
  const name = pick('name');
  const explicitHost = pick('PRODUCTION_HOST');
  const host = explicitHost ?? (name ? `${name}.pages.dev` : null);
  const allowlistRaw = pick('ACCESS_ALLOWLIST');
  return {
    name,
    host,
    hostInferred: explicitHost == null && host != null,
    aud: pick('CF_ACCESS_AUD'),
    teamDomain: pick('CF_ACCESS_TEAM_DOMAIN'),
    appName: pick('APP_NAME'),
    /** null＝キー自体が無い（意図未記載）。[]＝キーはあるが空。 */
    allowlist: allowlistRaw == null
      ? null
      : allowlistRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  };
}

/** "730h" / "24h" / "30m" / "0s" を時間へ。解釈できなければ null。 */
export function durationToHours(raw) {
  if (raw == null || raw === '') return null;
  const m = String(raw).trim().match(/^(\d+(?:\.\d+)?)\s*([smhd])$/i);
  if (!m) return null;
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 's') return value / 3600;
  if (unit === 'm') return value / 60;
  if (unit === 'h') return value;
  return value * 24;
}

export function humanHours(hours) {
  if (hours == null) return '解釈不能';
  if (hours === 0) return 'ブラウザを閉じるたび（毎回認証）';
  if (hours < 24) return `約${Math.round(hours)}時間ごと`;
  return `約${Math.round(hours / 24)}日ごと`;
}

/**
 * 認証頻度の判定。Application と identity 系 Policy の**短い側**が実効値
 * （Policy の session_duration は Application を上書きする＝04 §4-1 の罠）。
 * non_identity（Service Token＝機械間）は人の認証に無関係なので呼び出し側で除いて渡す。
 */
export function evaluateSessionHours(appDuration, policyDurations) {
  const appHours = durationToHours(appDuration);
  let worst = appHours;
  let unreadable = appHours == null;
  const details = [];
  for (const p of policyDurations) {
    if (p.duration == null || p.duration === '') {
      details.push(`Policy「${p.name}」: 未設定 → Application を継承`);
      continue;
    }
    const h = durationToHours(p.duration);
    details.push(`Policy「${p.name}」: ${p.duration}（${humanHours(h)}）← Application より優先されます`);
    if (h == null) unreadable = true;
    else if (worst == null || h < worst) worst = h;
  }
  return { worstHours: worst, unreadable, details };
}

/**
 * 許可メールの突合。
 *   blocked  = repo にあって Cloudflare に無い ＝ 入口で弾かれる（事故1）
 *   powerless = Cloudflare にあって repo に無い ＝ 入れるがアプリ内で名乗れない・操作できない
 */
export function diffAllowlist(repoEmails, cfEmails) {
  const repoSet = new Set(repoEmails.map((e) => e.toLowerCase()));
  const cfSet = new Set(cfEmails.map((e) => e.toLowerCase()));
  return {
    blocked: [...repoSet].filter((e) => !cfSet.has(e)),
    powerless: [...cfSet].filter((e) => !repoSet.has(e)),
  };
}
