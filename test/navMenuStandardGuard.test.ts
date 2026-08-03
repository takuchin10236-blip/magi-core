/**
 * (j) ナビ・メニュー標準（01_UI標準 §3-3）の試験（v0.13.0）。
 *
 * 事故: §3-3 条文（メニュー標準4点＋ナビ直置き全画面）に機械検査が無く、
 *   2026-08-02 の職員マスタ型合わせで履歴・全画面が丸ごと抜けた。検査なき条文は守られない。
 * 段階: 警告のみ（在庫表「強制ガードは昇格後」）＝ exit 0 のまま WARN 文言を出す。
 */
import { describe, expect, it } from 'vitest';
import { makeGuardFixture, runGuard } from './guardFixture';

const FULL_APP = `import { MagiAppShell, BusinessNav, ManualEntry, ColorModeSwitch, VersionHistoryModal, FocusToggle, SgBrandLogo, MagiBusinessSummary } from '@magi/core/ui';
export const App = () => <MagiAppShell appName="x" facilityName="y" nav={<BusinessNav activeTab="a" onNavigate={() => {}} tabs={[]} />}>本文</MagiAppShell>;
`;

const NO_NAV_APP = `export const App = () => <div>ナビ無しの試作画面</div>;
`;

describe('(j) ナビ・メニュー標準', () => {
  it('標準装備が欠けたアプリは WARN が出る（既定 fixture は履歴・全画面等を持たない）', () => {
    const { code, out } = runGuard(makeGuardFixture());
    expect(code).toBe(0); // 警告段階＝落とさない
    expect(out).toContain('(j) ナビ・メニュー標準');
    expect(out).toContain('更新履歴');
    expect(out).toContain('全画面');
    expect(out).toContain('正式ロゴ');
    expect(out).toContain('サマリー帯');
  });

  it('6部品が揃っていれば合格表示（WARN なし）', () => {
    const { code, out } = runGuard(makeGuardFixture({ appTsx: FULL_APP }));
    expect(code).toBe(0);
    expect(out).toContain('(j) ナビ・メニュー標準: 標準装備');
    expect(out).not.toContain('標準装備の欠け');
  });

  it('BusinessNav を使わないアプリは (j) の対象外（他検査(b)シェル構造は別途落ちる）', () => {
    const { out } = runGuard(makeGuardFixture({ appTsx: NO_NAV_APP }));
    expect(out).toContain('BusinessNav 未使用（対象外）');
    expect(out).not.toContain('標準装備の欠け');
  });
});
