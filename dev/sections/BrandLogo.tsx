/**
 * ⑦ブランドロゴ — SgBrandLogo（3モード連動）と SgLumenLogo（既定）の実物 ＋ 使用規定。
 *   v0.16.0 でアイコン型（正方形・favicon 用）の実物と useBrandFavicon の実演を足した。
 *
 * 規定値（最小幅104px・最大幅240px・クリアスペース12px/18px）は 07 v2.3 §1-4 の M2 新設節。
 * 実際に描かれた幅は getBoundingClientRect で計測して並べる（「規定」と「現物」を突き合わせる）。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  SG_BRAND_ICON_SOURCES,
  SG_BRAND_LOGO_SOURCES,
  SgBrandLogo,
  SgLumenLogo,
  useBrandFavicon,
  type ThemeMode,
} from '@magi/core/ui';
import { Section } from '../lib/Section';
import manifest from '../../src/ui/brand/logo-manifest.json';

interface Props {
  themeMode: ThemeMode;
  revision: number;
}

const VARIANTS: Array<{ variant: 'day' | 'sunset' | 'night'; mode: ThemeMode; label: string }> = [
  { variant: 'day', mode: 'white', label: '陽光（white）→ day' },
  { variant: 'sunset', mode: 'dusk', label: '残照（dusk）→ sunset' },
  { variant: 'night', mode: 'dark', label: '月光（dark）→ night' },
];

const RULES: Array<[string, string]> = [
  ['最小サイズ', '幅 104px 未満で使わない（実装済み --magi-brand-logo-width-sm の追認。幅80pxで装飾ストロークが潰れ始め、64pxで判読不能＝実測）'],
  ['幅104px 未満・正方形の器', '横長ロゴを縮めるのではなくアイコン型を使う（favicon・アプリアイコン・小さな丸枠）。favicon は useBrandFavicon() の1行、それ以外は SG_BRAND_ICON_SOURCES を読んで自前の <img>（v0.16.0・2026-08-09 社長採用）'],
  ['最大サイズ', '幅 240px を超えて使わない（同梱PNGは480×240のみ・DPR2で240×2=480＝原画の実解像度が上限）'],
  ['クリアスペース', '隣接要素と 12px 以上・パネル端と 18px 以上。計測起点は .magi-brand-logo の外形（trim適用後）で、原画に焼き込まれた白の外周余白は算入しない'],
  ['配色', '3モード連動は部品に任せる（アプリ側でモード別に画像を出し分けない）'],
  ['取得経路', 'PNG直コピーの散在は禁止（SHA-256 追跡を成立させるため）。SG_BRAND_LOGO_SOURCES の直利用は自前<img>が要る例外に限る'],
  ['禁止', '変形（縦横比変更）・色替え・影付け・回転・他要素との重ね'],
];

/** favicon 用途の実寸見本（16=タブ / 24=ブックマーク / 32=高DPIのタブ / 64=タスク切替）。 */
const ICON_PREVIEW_SIZES = [16, 24, 32, 64];

export function BrandLogoSection({ themeMode, revision }: Props) {
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const [measured, setMeasured] = useState<string>('計測中…');

  // ここが「1行で favicon」の実演そのもの。このページのタブアイコンがモードに追従する。
  const faviconVariant = useBrandFavicon();
  const [faviconHref, setFaviconHref] = useState<string>('（未取得）');

  useLayoutEffect(() => {
    const el = liveRef.current?.querySelector('.magi-brand-logo');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMeasured(`${Math.round(rect.width)}×${Math.round(rect.height)}px`);
  }, [revision]);

  // 実物の <link rel="icon"> を DOM から読み直して出す（「フックが返した値」ではなく描画結果を見る）。
  useEffect(() => {
    const link = document.head.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    setFaviconHref(link?.getAttribute('href') ?? '（link が無い）');
    // eslint 相当の意図: faviconVariant が変わった後に読む＝追従の証拠になる。
  }, [faviconVariant, revision]);

  return (
    <Section
      id="brand"
      index="⑦"
      title="ブランドロゴ"
      note={
        <>
          正式ブランドロゴは <code>SgBrandLogo</code>（PNG・2:1・standard 480×240）。
          <strong>2026-08-09 社長裁定でロゴは1本に統一</strong>され、<code>MagiAppShell</code> の
          <strong>既定がこの <code>SgBrandLogo</code></strong> になった（アプリ側の opt-in は不要）。
          旧既定の <code>SgLumenLogo</code>（SVG）は<strong>廃止裁定済み</strong>——import しているアプリのために
          export だけ残してあり、新規には選ばない。
        </>
      }
    >
      <h3 className="ds-subhead">いまのモードに連動している実物（variant 自動解決）</h3>
      <div className="ds-row">
        <span className="ds-logo-frame" ref={liveRef}>
          <SgBrandLogo alt="" />
        </span>
        <div>
          <p className="ds-note">
            現在のモード <code className="ds-mono">{themeMode}</code> → variant{' '}
            <code className="ds-mono">{VARIANTS.find((v) => v.mode === themeMode)?.variant}</code>
            （部品が <code className="ds-mono">&lt;html data-color-mode&gt;</code> を購読して自動で切り替える）
          </p>
          <p className="ds-note">
            実測サイズ: <strong>{measured}</strong>（既定 <code className="ds-mono">--magi-brand-logo-width: 148px</code>・規定帯 104〜240px の内側）
          </p>
          <p className="ds-note">枠は「クリアスペースの目安（18px）」を示す破線。地はヘッダーの色（--bg-header）。</p>
        </div>
      </div>

      <h3 className="ds-subhead">3絵柄の並記（variant を明示指定）</h3>
      <div className="ds-grid">
        {VARIANTS.map(({ variant, label }) => (
          <div className="ds-specimen" key={variant}>
            <div className="ds-specimen-head">
              <span className="ds-specimen-name">variant=&quot;{variant}&quot;</span>
              <span className="ds-specimen-tag">{label}</span>
            </div>
            <SgBrandLogo alt="" variant={variant} />
            <p className="ds-specimen-note">
              夜版・夕日版だけ CSS で <code className="ds-mono">clip-path: inset(9% 5% round 6px)</code> を掛け、原画の白い外周を切り抜く
              （<code className="ds-mono">trim={'{false}'}</code> で解除できる）。
            </p>
          </div>
        ))}
      </div>

      <h3 className="ds-subhead">SgLumenLogo（旧既定・廃止裁定済み）との並記</h3>
      <div className="ds-row">
        <div className="ds-specimen">
          <div className="ds-specimen-head">
            <span className="ds-specimen-name">SgLumenLogo</span>
            <span className="ds-specimen-tag">旧既定・廃止裁定済み・SVG</span>
          </div>
          {/* 素の <svg> は寸法を持たない（器が決める）＝シェルの実クラス .magi-appshell-logo で実寸表示。 */}
          <SgLumenLogo className="magi-appshell-logo" />
        </div>
        <div className="ds-specimen">
          <div className="ds-specimen-head">
            <span className="ds-specimen-name">SgLumenLogo dark</span>
            <span className="ds-specimen-tag">dark 指定</span>
          </div>
          <span className="ds-logo-frame">
            <SgLumenLogo className="magi-appshell-logo" dark />
          </span>
          <p className="ds-specimen-note">
            枠の地はヘッダー色（<code className="ds-mono">--bg-header</code>）。<strong>残照ではヘッダーが茜色</strong>になるため、
            月光向けの dark 版をここに置くと文字部分のコントラストは落ちる（ロゴタイプは WCAG 2.2 SC 1.4.3 の対象外だが、
            機械検査は文字として測る＝⑨の「いま赤い機械検査」に出る）。
          </p>
        </div>
        <div className="ds-specimen">
          <div className="ds-specimen-head">
            <span className="ds-specimen-name">SgBrandLogo</span>
            <span className="ds-specimen-tag">現行の既定・PNG・絵画調</span>
          </div>
          <SgBrandLogo alt="" />
        </div>
      </div>

      <h3 className="ds-subhead">アイコン型（正方形・favicon／アプリアイコン用・v0.16.0）</h3>
      <p className="ds-note">
        <strong>幅104px を切る場面で横長ロゴを縮めない</strong>——タブのアイコン（16〜32px）・アプリアイコン・丸い枠のような
        小さな正方の器では、正方形で描き起こされた<strong>アイコン型</strong>を使う。同梱は
        <code className="ds-mono">512×512</code> の3枚（1024原本は Drive 正本に残置）。
        描く器は core に置いていない＝<code className="ds-mono">SG_BRAND_ICON_SOURCES</code> を読んで自前の
        <code className="ds-mono">&lt;img&gt;</code> を組む。favicon なら次の1行だけでよい。
      </p>
      <pre className="ds-code">{`import { useBrandFavicon } from '@magi/core/ui';

function App() {
  useBrandFavicon();   // 陽光→day / 残照→sunset / 月光→night に自動追従
  …
}`}</pre>
      <p className="ds-note">
        <strong>このページ自身がその1行を呼んでいる</strong>。いまのモード{' '}
        <code className="ds-mono">{themeMode}</code> → variant <code className="ds-mono">{faviconVariant}</code>、
        実際の <code className="ds-mono">&lt;link rel=&quot;icon&quot;&gt;</code> の href ＝{' '}
        <strong className="ds-mono">{faviconHref}</strong>
        （上の帯でモードを変えるとこの値とタブのアイコンが入れ替わる）。既に
        <code className="ds-mono">link[rel~=&quot;icon&quot;]</code> があるアプリではそれを借りるので link が2枚に増えることはない。
      </p>

      <div className="ds-grid">
        {VARIANTS.map(({ variant, label }) => (
          <div className="ds-specimen" key={`icon-${variant}`}>
            <div className="ds-specimen-head">
              <span className="ds-specimen-name">icon variant=&quot;{variant}&quot;</span>
              <span className="ds-specimen-tag">{label}</span>
            </div>
            <img alt="" height={128} src={SG_BRAND_ICON_SOURCES[variant].src} width={128} />
            <p className="ds-specimen-note">
              実寸での見え方（{ICON_PREVIEW_SIZES.join(' / ')}px）:
            </p>
            <div className="ds-row">
              {ICON_PREVIEW_SIZES.map((size) => (
                <img
                  alt=""
                  height={size}
                  key={size}
                  src={SG_BRAND_ICON_SOURCES[variant].src}
                  title={`${size}px`}
                  width={size}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h4 className="ds-subhead">アイコン型の出所追跡（logo-manifest.json の icons 節）</h4>
      <table className="ds-table">
        <thead>
          <tr>
            <th>variant</th>
            <th className="ds-mono">同梱 file</th>
            <th className="ds-mono">寸法</th>
            <th className="ds-mono">sha256（先頭12桁）</th>
            <th className="ds-mono">非同梱の原本（Drive 正本）</th>
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map(({ variant }) => {
            const icon = manifest.icons.variants[variant];
            return (
              <tr key={`icon-row-${variant}`}>
                <td>{variant}</td>
                <td className="ds-mono">{icon.standard.file}</td>
                <td className="ds-mono">
                  {icon.standard.width}×{icon.standard.height}
                </td>
                <td className="ds-mono">{icon.standard.sha256.slice(0, 12)}…</td>
                <td className="ds-mono">
                  {icon.master.file}（{icon.master.width}×{icon.master.height}）
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="ds-note">
        便＝<code className="ds-mono">{manifest.icons.delivery}</code>・採用{' '}
        <code className="ds-mono">{manifest.icons.adopted_at}</code>。原本の所在は{' '}
        <code className="ds-mono">{manifest.icons.master_location}</code>。
        512版は原本からの <code className="ds-mono">LANCZOS</code> 縮小（{manifest.icons.bundled.derivation}）。
      </p>

      <h3 className="ds-subhead">使用規定（07 v2.3 §1-4 M2新設節の要約）</h3>
      <table className="ds-table">
        <thead>
          <tr>
            <th>項目</th>
            <th>規定</th>
          </tr>
        </thead>
        <tbody>
          {RULES.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-subhead">出所追跡（logo-manifest.json の現物）</h3>
      <p className="ds-note">
        同梱は <code className="ds-mono">{manifest._magi_core_bundled.files.join(' / ')}</code> の3枚（standard 480×240 のみ）。
        <code>npm run verify:brand</code> が毎回の check で SHA-256 を突合する。ただしこの検査が保証するのは
        <strong>同梱物の自己整合とビルドの運び忘れ検出まで</strong>——Drive 正本との一致は、素材を取り込む人が取り込み時に突合する。
      </p>
      <table className="ds-table">
        <thead>
          <tr>
            <th>variant</th>
            <th className="ds-mono">file</th>
            <th className="ds-mono">寸法</th>
            <th className="ds-mono">sha256（先頭12桁）</th>
            <th className="ds-mono">実際に読んだURL</th>
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map(({ variant }) => {
            const std = manifest.variants[variant].standard;
            return (
              <tr key={variant}>
                <td>{variant}</td>
                <td className="ds-mono">{std.file}</td>
                <td className="ds-mono">
                  {std.width}×{std.height}
                </td>
                <td className="ds-mono">{std.sha256.slice(0, 12)}…</td>
                <td className="ds-mono">{SG_BRAND_LOGO_SOURCES[variant].src}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="ds-note">
        <strong>申し送り（未実装・2026-08-09 裁定）</strong>: 残照仕様書 §2「緑の固定4箇所」④＝ロゴの縁取り 2px
        <code className="ds-mono">#2f6f5f</code> は <strong>core 未実装</strong>（物理確認済み）。実装するかは残照の正本昇格とセットで裁定する。
      </p>
    </Section>
  );
}
