/**
 * 入口チェック純ロジックの試験（v0.13.0）。
 *
 * 事故の型: (1) 入れるはずの人が弾かれる (2) 認証が何度も来る（Policy が Application を
 *   上書き＝04 §4-1 B-22「毎日認証」）。この2つを判定する純関数が正しく落とすことを固定する。
 * 由来: magi-staff-directory の基準実体で負例5本（AUDずれ・弾かれる人・入口不在・
 *   頻度判定・鍵なし）を実機確認済み。ここではネットワーク非依存の部分を回帰保護する。
 */
import { describe, expect, it } from 'vitest';
import {
  diffAllowlist,
  normalizeTeamDomain,
  durationToHours,
  evaluateSessionHours,
  maskEmail,
  parseWranglerEntryVars,
} from '../ci/access-entry-lib.mjs';

describe('durationToHours: Cloudflare の期間表記の解釈', () => {
  it('730h → 730 / 24h → 24 / 30m → 0.5 / 2d → 48', () => {
    expect(durationToHours('730h')).toBe(730);
    expect(durationToHours('24h')).toBe(24);
    expect(durationToHours('30m')).toBe(0.5);
    expect(durationToHours('2d')).toBe(48);
  });
  it('解釈できない値・空は null（黙って 0 や NaN にしない）', () => {
    expect(durationToHours('abc')).toBeNull();
    expect(durationToHours('')).toBeNull();
    expect(durationToHours(null)).toBeNull();
  });
});

describe('evaluateSessionHours: Policy は Application を上書きする（B-22 の罠）', () => {
  it('Application 730h でも Policy 24h があれば実効は 24h（毎日認証を検出できる）', () => {
    const r = evaluateSessionHours('730h', [{ name: 'p', duration: '24h' }]);
    expect(r.worstHours).toBe(24);
    expect(r.unreadable).toBe(false);
  });
  it('Policy 未設定は Application を継承（730h のまま）', () => {
    const r = evaluateSessionHours('730h', [{ name: 'p', duration: null }]);
    expect(r.worstHours).toBe(730);
  });
  it('解釈不能な値が混ざったら unreadable（「合格」と偽らない）', () => {
    const r = evaluateSessionHours('730h', [{ name: 'p', duration: 'weird' }]);
    expect(r.unreadable).toBe(true);
  });
});

describe('diffAllowlist: 意図（repo）と実態（Cloudflare）の突合', () => {
  it('repo にあって CF に無い＝弾かれる／CF にあって repo に無い＝権限なし', () => {
    const r = diffAllowlist(['a@x.com', 'b@x.com'], ['B@X.com', 'c@x.com']);
    expect(r.blocked).toEqual(['a@x.com']);
    expect(r.powerless).toEqual(['c@x.com']);
  });
  it('大文字小文字は同一視する', () => {
    const r = diffAllowlist(['A@X.COM'], ['a@x.com']);
    expect(r.blocked).toEqual([]);
    expect(r.powerless).toEqual([]);
  });
});

describe('parseWranglerEntryVars: wrangler.toml の読み取り', () => {
  const base = `
name = "magi-sample-app"
[vars]
APP_NAME = "見本アプリ"
PRODUCTION_HOST = "magi-sample-app.pages.dev"
CF_ACCESS_TEAM_DOMAIN = "magi10236.cloudflareaccess.com"
CF_ACCESS_AUD = "abc123"
ACCESS_ALLOWLIST = "a@x.com, B@x.com"
`;
  it('明示キーをそのまま読む（allowlist は小文字化）', () => {
    const v = parseWranglerEntryVars(base);
    expect(v.host).toBe('magi-sample-app.pages.dev');
    expect(v.hostInferred).toBe(false);
    expect(v.aud).toBe('abc123');
    expect(v.allowlist).toEqual(['a@x.com', 'b@x.com']);
  });
  it('PRODUCTION_HOST が無ければ name から推定し、推定したことを申告する', () => {
    const v = parseWranglerEntryVars('name = "magi-old-app"\n');
    expect(v.host).toBe('magi-old-app.pages.dev');
    expect(v.hostInferred).toBe(true);
  });
  it('ACCESS_ALLOWLIST キー自体が無い＝null（意図未記載を空リストと区別する）', () => {
    const v = parseWranglerEntryVars('name = "x"\n');
    expect(v.allowlist).toBeNull();
  });
  it('コメント行のキーは拾わない', () => {
    const v = parseWranglerEntryVars('name = "x"\n# ACCESS_ALLOWLIST = "ghost@x.com"\n');
    expect(v.allowlist).toBeNull();
  });
});

describe('normalizeTeamDomain: 表記ゆれを事故と区別する（v0.13.2）', () => {
  it('https:// 前置きと末尾スラッシュを剥がして比較できる', () => {
    expect(normalizeTeamDomain('https://magi10236.cloudflareaccess.com/')).toBe('magi10236.cloudflareaccess.com');
    expect(normalizeTeamDomain('magi10236.cloudflareaccess.com')).toBe('magi10236.cloudflareaccess.com');
  });
  it('本当に違うドメインは正規化しても一致しない', () => {
    expect(normalizeTeamDomain('https://evil.cloudflareaccess.com')).not.toBe('magi10236.cloudflareaccess.com');
  });
});

describe('maskEmail: 個人特定を避ける表示（禁則③）', () => {
  it('先頭2文字とドメインだけ残す', () => {
    expect(maskEmail('takuchin@example.com')).toBe('ta***@example.com');
  });
});
