/**
 * ⑧背骨4本 と CIガード9項目 — 「このデザインシステムを誰が支えているか」の地図。
 *
 * 背骨の説明文は package.json の description（＝配布物の自己申告）をそのまま画面に出す。
 * ここに要約を書き写すと、core が変わった時にこのページだけ古くなるため。
 */
import pkg from '../../package.json';
import { Section } from '../lib/Section';

/** CIガード原本の検査項目（ci/check-ui-guardrails.mjs 冒頭の (a)〜(i)）。 */
const GUARDS: Array<[string, string, string]> = [
  ['(a)', '標準値一致', 'standard-lumen の基準トークン（--primary:#6bbf95 等）がアプリの index.css にあるか'],
  ['(b)', '必須シェル構造', 'AppShell型（MagiAppShell/BusinessNav）が揃っているか。無ければ前標準・旧型を項目別に検査'],
  ['(c)', '禁止パターン', 'ネイティブ confirm/alert/prompt を src/ で呼んでいないか（＝ConfirmModal を使う）'],
  ['(d)', 'StatusBadge / 逸脱の承認', '状態バッジは core の StatusBadge を使い旧 tooltip/CSS の写しを残さない。欠けるなら TYPE_DEVIATIONS.md に承認済で記載'],
  ['(e)', '承認ゲート', '【派生のみ】TYPE_DEVIATIONS.md に status=要承認 の逸脱が残っていないか'],
  ['(f)', 'プレースホルダ', '【派生のみ】__SYSTEM_*__ の置換漏れが残っていないか'],
  ['(g)', '重なり順', 'アプリ側 CSS の z-index が上限 100（--magi-z-app-sticky-max）以下か'],
  ['(h)', 'シェルの枠', 'シェル（.magi-appshell 系）の枠を壊す上書きが無いか'],
  ['(i)', 'シェル再定義', 'アプリ側 CSS が .magi-appshell* の寸法・文字を再定義していないか'],
];

/** 背骨の4本（package.json の description が数え上げているもの）。実体はここに書いた「置き場」。 */
const SPINES: Array<{ title: string; entry: string; body: string }> = [
  {
    title: '① データ契約',
    entry: '@magi/core/data（src/data/）',
    body: 'Sheets 読み書きの契約・書込ゲート（valueInputOption は RAW 固定）・D4 署名検証版のアクセス制御。UI からは見えないが、業務データの安全はここが持つ。',
  },
  {
    title: '② CIガード原本',
    entry: '@magi/core/ci/*.mjs（ci/）',
    body: '型からの完コピが崩れていないかを機械で止める番人の原本1版。各アプリはこの原本を参照する（検査項目は下表の (a)〜(i)）。',
  },
  {
    title: '③ デザインシステム',
    entry: '@magi/core/ui/design-system.css（src/ui/）',
    body: '4プリセット × 陽光/残照/月光 ＝ 12テーマの確定トークンと、部品のCSS実体。①〜④の見た目はすべてこの1枚が決めている。',
  },
  {
    title: '④ 背骨UI部品と統一マニュアルビューア',
    entry: '@magi/core/ui（src/ui/*.tsx）',
    body: 'AppShell・ナビ・フォーム・モーダル・状態表示の実体と、器＝ManualViewer／中身＝各アプリの ManualContent という契約。',
  },
];

export function SpineSection() {
  const scripts = Object.entries(pkg.scripts);

  return (
    <Section
      id="spine"
      index="⑧"
      title="背骨4本と CIガード"
      note={
        <>
          パッケージの自己申告（<code className="ds-mono">package.json</code> の description の現物）:
          <br />
          <em>{pkg.description}</em>
          <br />
          版 <code className="ds-mono">{pkg.name}@{pkg.version}</code>／<code className="ds-mono">private: true</code>（publish しない物理ガード）。
        </>
      }
    >
      <div className="ds-grid-wide">
        {SPINES.map((s) => (
          <div className="ds-specimen" key={s.title}>
            <div className="ds-specimen-head">
              <span className="ds-specimen-name">{s.title}</span>
              <span className="ds-specimen-tag">{s.entry}</span>
            </div>
            <p className="ds-specimen-note">{s.body}</p>
          </div>
        ))}
      </div>

      <h3 className="ds-subhead">CIガード9項目（ci/check-ui-guardrails.mjs）</h3>
      <p className="ds-note">
        原本の置き場: <code className="ds-mono">@magi/core/ci/check-ui-guardrails.mjs</code>（repo 内 <code className="ds-mono">ci/check-ui-guardrails.mjs</code>）。
        アプリ側は <code className="ds-mono">node node_modules/@magi/core/ci/check-ui-guardrails.mjs</code> で回す
        （検査対象 root は <code className="ds-mono">MAGI_CORE_GUARD_ROOT</code> で差し替えられる）。
      </p>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">#</th>
            <th>項目</th>
            <th>何を止めるか</th>
          </tr>
        </thead>
        <tbody>
          {GUARDS.map(([id, name, body]) => (
            <tr key={id}>
              <td className="ds-mono">{id}</td>
              <td>{name}</td>
              <td>{body}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-subhead">core 自身の検査（package.json の scripts 現物）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-mono">script</th>
            <th className="ds-mono">中身</th>
          </tr>
        </thead>
        <tbody>
          {scripts.map(([name, cmd]) => (
            <tr key={name}>
              <td className="ds-mono">npm run {name}</td>
              <td className="ds-mono">{cmd}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ds-note">
        コントラスト検査（<code className="ds-mono">ci/check-contrast.mjs</code>）は URL を測る性質上 <code>npm run check</code> には入っていない。
        起動中の dev サーバへ当てて使う:{' '}
        <code className="ds-mono">node ci/check-contrast.mjs --url http://127.0.0.1:5273 --modes white,dusk,dark</code>
        （playwright-core が要る）。
      </p>
    </Section>
  );
}
