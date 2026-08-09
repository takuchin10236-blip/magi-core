/**
 * ⑨監査リスト — 「このページが証明すること」と「証明しないこと」。
 *
 * Eclipse v1.0 ショーケースの監査リスト文化を踏襲する。ただし**言い切りの範囲を狭く保つ**——
 * 出せない証明を出したことにしない（未達・限界を並べる欄を必ず持つ）。
 */
import { Section } from '../lib/Section';

const PROVEN: Array<{ what: string; how: string }> = [
  {
    what: '12テーマ（4プリセット × 陽光/残照/月光）が1枚の CSS で切り替わる',
    how: '上の帯の ColorModeSwitch / DisplaySwitch は core の実物。切り替えると①〜⑦の見本が同時に追従する（3モードのスクショで固定）',
  },
  {
    what: '色トークンの一覧が「手書きの写し」でない',
    how: 'CSSOM 走査でトークン名を収集し、getComputedStyle(:root) で解決値を読む。core 側で増減すれば表も自動で増減する',
  },
  { what: 'タイポ階層が実装どおりに描かれている', how: 'core の実クラスで描画した要素を getComputedStyle で実測して並べている（CSS の記述ではなく描画結果）' },
  { what: '--magi-* の寸法体系が実在し、Core 内に消費者がいる', how: 'この節の一覧は CSSOM 由来。消費者ゼロのトークンは npm run verify:tokens が機械で落とす' },
  { what: 'モーションが実在の @keyframes と duration トークンで動く', how: 'keyframes 名は CSSOM から収集。再生ボタンはトークンの実値をそのまま transition/animation に渡している' },
  { what: '公開部品が実レンダリングできる（import して壊れない）', how: 'このページ自体が @magi/core/ui から import して描画している。描けていないなら core の不具合' },
  { what: 'アイコンが lucide 単一流派・サイズ2段の規定に沿う', how: '一覧は src/ui/*.tsx の import 実測。規定は 07 v2.3 §1-4' },
  { what: 'ブランドロゴが3モードに自動連動し、出所が追跡されている', how: '部品が data-color-mode を購読して variant を解決。SHA-256 は logo-manifest.json の現物を表示し、npm run verify:brand が突合' },
  { what: '既存の検査を1本も壊していない', how: 'npm run check（build / verify:brand / modal / shell / tokens / types / test / matrix）が緑のまま' },
];

const NOT_PROVEN: Array<{ what: string; why: string }> = [
  {
    what: '書体（フォント）の実体',
    why: 'core は @font-face を同梱しない（design-system.css 内 0件）。実際にどの書体で描かれるかは端末と採用アプリの読込に依存する',
  },
  {
    what: '画面全体のコントラスト適合',
    why: 'ci/check-contrast.mjs は背景色（backgroundColor）しか読まない＝背景画像（残照のグラデーション）は地として計算されない。測っているのは「帯の主色の上での読みやすさ」',
  },
  { what: 'Drive 正本とロゴ画像の一致', why: 'verify:brand が保証するのは同梱物の自己整合とビルドの運び忘れ検出まで。正本との一致は取り込む人が SHA-256 で突合する人手の1手' },
  { what: '残照のロゴ縁取り（2px #2f6f5f）', why: '残照仕様書 §2 の④は core 未実装。実装可否は残照の正本昇格とセットの裁定待ち' },
  { what: '本番アプリでの見た目', why: 'ここは core 単体の検証面。採用アプリは自分の CSS を重ねるため、本番の姿は各アプリで見る（12番＝本番保全標準の別工程）' },
];

/**
 * このページを機械検査に掛けて実際に出た赤（2026-08-09・M1実装時）。
 * 直すのは別便（本便は「塗り替え禁止・既存コード不変更」の発注）。消さずに載せておく。
 */
const KNOWN_RED: Array<{ what: string; detail: string }> = [
  {
    what: 'ghost ボタンの文字が白地で 2.21:1（基準 4.5:1）',
    detail:
      'themed-btn-ghost の文字色は --primary(#6bbf95)。core は 2026-07-28 に「白地の文字用」として --brand-ink(#1b7447) を作ったが、ghost はそこへ載せ替えられていない（同じ穴の残り）。core 側の別起案。',
  },
  {
    what: 'danger ボタンの文字が月光で 2.77:1（基準 4.5:1）',
    detail:
      '月光の --danger(#f87171) は面の色として明るく、その上の白文字が 2.77:1 になる（陽光の #c62828 では足りている）。状態色は世界共通解の枠なので、直すなら「面と文字の組」を core で裁定する。',
  },
  {
    what: 'ロゴ文字（SG / SHONAN GREEN）が残照の枠内で 2.31:1',
    detail:
      'WCAG 2.2 SC 1.4.3 は「ロゴ・ブランド名の文字」を対象外にしているが、check-contrast は文字要素として測るため赤が出る。加えてこの枠はヘッダー色（--bg-header）で、残照ではヘッダーが茜色になる＝月光向けの dark 版ロゴを置けば当然落ちる（見本の置き方の問題）。',
  },
];

export function AuditListSection() {
  return (
    <Section
      id="audit"
      index="⑨"
      title="監査リスト（このページが証明すること）"
      note="このページは開発者検証用であって、配布物・業務画面ではない。証明できることと、できないことを並べて置く。"
    >
      <h3 className="ds-subhead">証明すること</h3>
      <ul className="ds-audit">
        {PROVEN.map((p) => (
          <li key={p.what}>
            <span aria-hidden="true" className="ds-audit-mark">
              ✔
            </span>
            <span>
              <strong>{p.what}</strong>
              <br />
              <span className="ds-specimen-note">{p.how}</span>
            </span>
          </li>
        ))}
      </ul>

      <h3 className="ds-subhead">いま赤い機械検査（2026-08-09 実測・直すのは別便）</h3>
      <p className="ds-note">
        <code className="ds-mono">node ci/check-contrast.mjs --url http://127.0.0.1:5273 --modes white,dusk,dark</code> の実行結果
        （走査 6,984 要素・NG 5件＝下の3種）。<strong>このページを作った時に見つかった core 側の事実</strong>で、
        本便は「塗り替え禁止・既存コード不変更」の発注のため直していない。隠さずここに置く。
      </p>
      <ul className="ds-audit">
        {KNOWN_RED.map((p) => (
          <li key={p.what}>
            <span aria-hidden="true" className="ds-audit-mark" data-kind="manual">
              ✗
            </span>
            <span>
              <strong>{p.what}</strong>
              <br />
              <span className="ds-specimen-note">{p.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <h3 className="ds-subhead">証明しないこと（限界の明示）</h3>
      <ul className="ds-audit">
        {NOT_PROVEN.map((p) => (
          <li key={p.what}>
            <span aria-hidden="true" className="ds-audit-mark" data-kind="manual">
              △
            </span>
            <span>
              <strong>{p.what}</strong>
              <br />
              <span className="ds-specimen-note">{p.why}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
