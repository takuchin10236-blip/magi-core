/**
 * ⑥アイコン — core が実際に import している lucide アイコンと、07 v2.3 §1-4 の規定。
 *
 * 一覧の出所は物理 grep（`grep -rn "lucide-react" src/`）で、core が import している名前そのもの。
 * 規定（サイズ2段・strokeWidth 上書き禁止・意味↔アイコン対応表）は 07 の文言を要約して注記する。
 */
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  Maximize2,
  Minimize2,
  Moon,
  Palette,
  Printer,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sun,
  Sunset,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@magi/core/ui';
import { Section } from '../lib/Section';

/** core が実際に使っているもの（src/ui/*.tsx の import 実測・11種）。 */
const IN_USE: Array<{ Icon: LucideIcon; name: string; where: string; size: number }> = [
  { Icon: ChevronDown, name: 'ChevronDown', where: 'MagiBusinessSummary / BusinessNav / MagiStatusSummary（展開）', size: 14 },
  { Icon: Settings2, name: 'Settings2', where: 'BusinessNav（設定）', size: 16 },
  { Icon: ShieldCheck, name: 'ShieldCheck', where: 'BusinessNav / MagiStatusSummary（保護）', size: 16 },
  { Icon: Sun, name: 'Sun', where: 'DisplaySwitch / ColorModeSwitch（陽光）', size: 15 },
  { Icon: Sunset, name: 'Sunset', where: 'ColorModeSwitch（残照・v0.14.0）', size: 15 },
  { Icon: Moon, name: 'Moon', where: 'DisplaySwitch / ColorModeSwitch（月光）', size: 15 },
  { Icon: Clock, name: 'Clock', where: 'ColorModeSwitch（自動＝時刻帯運転）', size: 15 },
  { Icon: Palette, name: 'Palette', where: 'DisplaySwitch（プリセット）', size: 15 },
  { Icon: Maximize2, name: 'Maximize2', where: 'FocusToggle（全画面へ）', size: 16 },
  { Icon: Minimize2, name: 'Minimize2', where: 'FocusToggle（元に戻す）', size: 16 },
  { Icon: UserRound, name: 'UserRound', where: 'Operator（操作者）', size: 16 },
];

/** 07 §1-4「同じ意味に同じアイコン」の対応表・初期行（core 未使用の行も規定として示す）。 */
const MEANING_MAP: Array<{ meaning: string; Icon: LucideIcon; name: string; inCore: boolean }> = [
  { meaning: '設定', Icon: Settings2, name: 'Settings2', inCore: true },
  { meaning: '保護', Icon: ShieldCheck, name: 'ShieldCheck', inCore: true },
  { meaning: '展開', Icon: ChevronDown, name: 'ChevronDown', inCore: true },
  { meaning: '保存', Icon: Save, name: 'Save', inCore: false },
  { meaning: '印刷', Icon: Printer, name: 'Printer', inCore: false },
  { meaning: '戻す', Icon: RotateCcw, name: 'RotateCcw', inCore: false },
  { meaning: 'ソート可能列', Icon: ArrowUpDown, name: 'ArrowUpDown', inCore: false },
];

export function IconsSection() {
  return (
    <Section
      id="icons"
      index="⑥"
      title={`アイコン（core 使用中 ${IN_USE.length}種）`}
      note={
        <>
          基盤デフォルトは <strong>lucide 単一流派</strong>（他のアイコンセットを1画面に混ぜない）。
          <code>@magi/core</code> は lucide-react を <strong>peer optional</strong> にしており、
          「lucide が無くても壊れない」ため core 内には例外の許可リスト（ManualEntry の本＝インラインSVG、
          DraggableModal の閉じる×、SgLumenLogo、ManualViewer のユニコード記号）がある。
          禁止規定の適用対象は<strong>アプリ側の新規実装</strong>。
        </>
      }
    >
      <h3 className="ds-subhead">使用中の実物（サイズは core の実装値）</h3>
      <div className="ds-grid">
        {IN_USE.map(({ Icon, name, where, size }) => (
          <div className="ds-icon-cell" key={name}>
            <Icon aria-hidden="true" size={size} />
            <span className="ds-icon-name">
              {name} / {size}px
            </span>
            <span className="ds-icon-name">{where}</span>
          </div>
        ))}
      </div>

      <h3 className="ds-subhead">サイズ2段の規定（07 v2.3 §1-4）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th>区分</th>
            <th>サイズ</th>
            <th>必須の作法</th>
            <th>見本</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>装飾アイコン（テキスト併記）</td>
            <td className="ds-mono">14〜16px の帯</td>
            <td>
              <code className="ds-mono">aria-hidden</code> 必須（読み上げは併記の文字が担う）
            </td>
            <td>
              <span className="ds-row">
                <Settings2 aria-hidden="true" size={14} />
                <Settings2 aria-hidden="true" size={15} />
                <Settings2 aria-hidden="true" size={16} />
                <span>設定</span>
              </span>
            </td>
          </tr>
          <tr>
            <td>単独で意味を運ぶ／アイコンのみボタン</td>
            <td className="ds-mono">20px 以上</td>
            <td>
              <code className="ds-mono">aria-label</code> 必須＋非テキストコントラスト 3:1（WCAG 2.2 SC 1.4.11）
            </td>
            <td>
              <Button aria-label="設定を開く" variant="ghost">
                <Settings2 aria-hidden="true" size={20} />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="ds-note">
        線幅: lucide に <code className="ds-mono">strokeWidth</code> を渡さない（既定 2 のまま使う＝grep 一発で機械検査できる禁止形）。
        版: アプリ側は lucide-react の版を lockfile で固定する（core の peer 指定 <code className="ds-mono">^1.16.0</code> は触らない）。
        ライセンス: lucide は <strong>ISC</strong>。出所とライセンスは各アプリの三者ライセンス告知に載せる。
        禁止: 絵文字を UI アイコンとして使う／色だけで意味を伝える。
      </p>

      <h3 className="ds-subhead">意味 ↔ アイコン対応表（初期行・還流で育てる）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th>意味</th>
            <th>アイコン</th>
            <th className="ds-mono">lucide 名</th>
            <th>core 内の使用</th>
          </tr>
        </thead>
        <tbody>
          {MEANING_MAP.map(({ meaning, Icon, name, inCore }) => (
            <tr key={name}>
              <td>{meaning}</td>
              <td>
                <Icon aria-hidden="true" size={16} />
              </td>
              <td className="ds-mono">{name}</td>
              <td>{inCore ? 'あり' : '（規定のみ・core 未使用）'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ds-note">
        状態系（Check・AlertTriangle・X・CircleAlert・ShieldCheck）は 07 §2-3 の状態色対応が正。
        <strong>状態の意味は 01・状態↔アイコンの対応は §2-3・色の実値は core の design-system.css</strong> の3点分業で、別表を新設しない。
      </p>
    </Section>
  );
}
