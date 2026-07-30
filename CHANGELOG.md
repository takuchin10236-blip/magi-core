# Changelog

## v0.8.0 (2026-07-30)

### 正式ブランドロゴ（絵画調SG）の挿入口を新設した

これまでロゴは `SgLumenLogo`（SVG・窓と富士）1本だった。2026-07-30 に採用された
絵画調のSGロゴ（浮世絵×アール・ヌーヴォー・2:1の不透明PNG）を、**既存アプリの
見た目を変えないまま**差し込めるようにする。

- **`SgBrandLogo` を新設**: ライト→昼版・ダーク→夜版のテーマ連動
- **テーマ検知は core 既存の作法**（`useThemeState` が書く `data-color-mode` を購読）。
  `prefers-color-scheme` の独自検知はしない＝職員が `ColorModeSwitch` で選んだ結果と必ず一致する
- **同梱は昼・夜の標準版（480×240）2枚だけ = 約0.39MB**。@2x（各770KB）・夕日版・master は
  同梱せず Drive 正本（`施設運営/職員マスタアプリ/assets/brand-final-20260730`）に残置する。
  ヘッダーでの表示幅は約112pxで、480px の原画はそこに約4倍の密度で入る＝DPR2の端末でも
  約2倍の余裕がある。`srcSet` は使わず単一 `src`
- **夜版の白い外周が浮く問題**: 原画像は無改変のまま、CSS の表示範囲で余白だけ切り取る
  （実測: 480×240 の四辺20pxが余白／絵柄の実体は 440×200）。`trim={false}` で原画のまま出せる
- **`MagiAppShell` に `logo?: ReactNode` スロット**: 未指定なら従来どおり `SgLumenLogo`。
  施設名・アプリ名の配置・レスポンシブは不変（**非破壊**）。シェル内では `alt=""` 推奨
  （施設名は kicker が読み上げるため二重読み上げを避ける）
- **同梱物の出所を追跡**: `src/ui/brand/logo-manifest.json` の SHA-256 と `npm run verify:brand` が
  毎回突合する。これは「同梱物の自己整合と運び忘れの検出」であって Drive正本との一致証明ではない
  （Drive との突合は素材取り込み時に人が行う）。非同梱のはずの @2x・sunset・master が
  紛れ込んだら verify:brand が落ちる
- 画像は tsc の出力対象外なので、`build` で `dist/ui/brand` へ運ぶ（`copy-brand-assets.mjs`）。
  採用側は `@magi/core/ui` から使うほか、`@magi/core/ui/brand/*` で生画像も取れる
- `sideEffects: ["**/*.css"]` を宣言（CSS の import は残しつつ、未使用コード・画像の
  tree-shake を採用側バンドラに許す）

**次版の宿題**: PNG のままなので、WebP 化すれば同じ見た目で更に7〜8割減らせる。
絵柄を増やす（夕日版の演出投入など）ときは、この減量とセットで判断する。

## v0.7.4 (2026-07-29)

### 業務ナビに「タブの隣へ主操作を置く」受け口を足した（社長指摘）

利用者マスタ管理アプリで「追加」ボタンをタブの隣へ置きたい、という指摘が出た。
`navActions` は右端（メニュー・権限チップの並び）にしか置けず、**その画面の主操作を
そこへ置くと、視線がタブから画面の反対側へ飛ぶ**。主操作は見ている場所のすぐ横に
あるべきである。

- **`navLeadingActions` を新設**: 業務タブの直後（左寄せ側）へ描画する
- `.magi-appshell-nav-right` に `margin-left: auto` を追加。ナビ行の子が3つに
  なってもメニュー側は右端に留まる（`space-between` だけだと真ん中へ寄る）
- **省略時は何も描画しない**。既存アプリの見た目は変わらない（後方互換）

## v0.7.3 (2026-07-28)

### ブランド緑を「面の色」と「文字の色」に分けた（社長裁定）

Standard Lumen の `--primary` / `--brand` (#6bbf95) は面・枠・ロゴのための色で、
**白地に文字として置くと 2.21:1** しか出ない（`ci/check-contrast.mjs` の実測）。
クッション管理では番号札（C-001 等）と施設名がこの色で、番号札は個体の主識別子のため
読み違えが物の取り違えに直結する。

- **`--brand-ink` を新設**: White `#1b7447`（色相150°は元の緑と同じまま暗く・白地 5.78:1）／
  Dark は `--primary` のまま（暗い面の上なので 7.5:1 以上出る）
- **ロゴ・面・枠の `--primary` は変えない**。変えたのは「文字に使うときの色」だけ
- `--status-warn-ink` を新設: `#d84315` は薄黄地で 4.19:1 と僅かに足りないため `#ba3a12` へ
- 適用先: `.magi-appshell-kicker`（施設名＋フロア）／`.magi-status-badge.status-info` の文字／
  `.magi-status-badge.status-warn` の文字
- 他プリセットには bridge ブロックで前景色を混ぜる自動導出版を置いた（White で暗く・Dark で明るく寄る）

### 検査機の誤検出を潰した——測る道具の2度目の欠陥

`.operator-chip` が Dark で「背景が白のまま 2.15:1」と報告され続け、CSS を追っても
背景を設定する他のルールが無い、という状態が1日残っていた。

真因は**測る側**だった。`auditInPage` は `data-color-mode` を差し替えた直後に
同じ同期処理の中で `getComputedStyle` を読む。`transition: background` を持つ要素は
このとき**切替前の色**を返す。チップは数少ない `transition` 付き要素だった。

- 計測中だけ `transition` / `animation` を止めるスタイルを注入し、強制リフロー後に読む
- v0.7.2 の「半透明の重ね合わせ」に続き、**測る道具の欠陥はこれで2件目**

## v0.7.0 (2026-07-28)

### 操作者（型v1.6）を core 化 — 8アプリの手写しを1か所へ

2026-07-28 実測: 同じ `OperatorSelectModal.tsx` が **8アプリ**（adl / seat-chart /
staff-master / floor-calendar / staff-tasks / survey / 2f-inventory / cushion）に
手写しで存在した。`01_UI標準` の型v1.6では既に「必須型」と決まっているのに core 実装が
無く、文言と見た目が枝分かれし始めていた。

- `OperatorChip`: ヘッダーの常設チップ。未選択は色だけでなく「未選択」の文字でも示す
- `OperatorSelectModal`: 一覧から押して選ぶ（select要素は型違反）
- **本人認証ではない旨を必ず画面に出す**——共通ログイン＋自己申告の限界を隠さない
- 未選択でも閲覧・印刷は可。止めるのは保存・取消だけ

試験6件を追加（限界表示・select不使用・選択の返り値・空名簿）。全89件green。
移行: 各アプリは自前の `OperatorSelectModal.tsx` と operator系CSS を削除し、
`@magi/core/ui` から import へ差し替える。次に触るときで良い（一斉置換はしない）。

## v0.6.0 (2026-07-28)

### デジタル庁DS整合レイヤ — 型を「文章」から「動くコード」へ

2026-07-28 社長裁定「**デジタル庁のデザインシステムに合わせて、今あるMAGIのUIの各パーツを入れ込む。
足りない部分はMAGIのデザインを踏襲しながら新たに作る。コード化して他のMAGIにも流用する**」。

**採ったもの / 採らなかったもの**（デジタル庁DS v2.16.0）:
- 採る = 作法。文字4.5:1 / UI・focus 3:1 / 色だけで伝えない / ラベル必須 /
  エラーは文字と role で伝える / 当たり判定44px / フォームの aria 配線。
- 採らない = 色値・ロゴ・ブランド。Standard Lumen をそのまま維持する（写さない）。

**追加した部品**（DADS 44部品との突合で、業務アプリの土台として欠けていた層）:

| 部品 | 対応するDADS | 何を物理的に保証するか |
|---|---|---|
| `FormField` / `RequirementBadge` | Label / RequirementBadge / SupportText / ErrorText | id と aria-describedby / aria-invalid を自動配線。手配線の付け忘れが起きない |
| `TextField` / `TextArea` / `SelectField` | Input / Textarea / Select | ラベル必須。16px（iOS自動ズーム回避）・44px |
| `CheckboxField` / `RadioGroup` | Checkbox / Radio / Legend | fieldset+legend で束ね、エラーは group に1回 |
| `Button` | Button | `busy` で自動 disabled ＝連打の物理防止。busy中も文言を出す |
| `LoadingState` | ProgressIndicator | **`label` を必須 prop にした**＝無言のスピナーを型で書けなくする |
| `useBusyGuard` | （作法） | await 中の多重送信を ref で殺す。例外時も必ず戻す |
| `NotificationBanner` | NotificationBanner | 種別を色でなく文字で示す。error/warning は role=alert |

**モーション基盤**（業務5段・2026-07-28裁定）:
`--duration-0/1/2/3/4` = 0/100/150/250/400ms、easing 3種、semantic alias（`--motion-*`）。
`prefers-reduced-motion` で 1ms へ落とす（0でなく1ms＝transitionend を壊さない）。
待ちスピナーは回転を止めても点滅で「待っている」ことを伝え続ける（情報を消さない）。

**非破壊**: 既存3段（200/300/500ms）は互換 alias として残置。既存部品・既存CSSクラスの
見た目は1pxも変えていない。旧版へは v0.5.5 以前のタグでいつでも戻せる。

**試験**: 新レイヤ17件を追加（配線・読み上げ・連打・失敗時の復帰）。全79件green。

## v0.5.5 (2026-07-26)

### AppShell を基準実体（利用者マスタ）へ揃え、業務状況パネルを Core 化

2026-07-26 社長裁定「**利用者マスタ（magi-resident-spine）の形を正とし、Core を直す**」。
職員マスタが v0.5 の AppShell を実採用した際、基準実体と見た目が食い違うことが判明したため、
各アプリでの上書き（drift）を作らせないよう Core 側を基準実体へ合わせた。

- **AppShellヘッダーの基準合わせ**（`design-system.css` / `MagiAppShell.tsx`）
  - `.magi-appshell-logo`: `width` 88px → **112px**（基準実体 `.sg-header-logo` と同値）
  - `.magi-appshell-kicker`: `color` を `--text-muted` → **`--color-primary`**、`font-size` 12px → **0.82rem**、`font-weight` 800 → **850**、`margin-bottom` 4px → 1px（基準実体 `.facility-name` と同値）。従来はグレーで基準より沈んで見えていた
  - `.magi-appshell-floor`: 独自の `color` 指定を廃止し施設名と同色に（基準実体は施設名とフロアを1文字列で名乗り、色を分けていない）
  - 施設名とフロア名の区切りを**中黒（・）から半角スペース**へ（基準実体は「第二湘南グリーン 2F」と表記）
- **`MagiBusinessSummary` 新設**（「現在の状況」＋開閉式ダッシュボード）
  - 原本＝利用者マスタの `.business-summary`（自前実装）を一般化。社長裁定「枠（パネルの形）は揃え、ダッシュボードの内容と各項目はアプリごとに変更してよい」に対応
  - Core が持つのは**器**（ラベル＋チップ列＋開閉式ダッシュボード／寸法・配色・余白・挙動）、アプリが決めるのは**中身**（項目数・ラベル・値・押した時の動き・説明文）
  - `onSelect` のある項目は button、無い項目は静的表示。`description` を持つ項目だけがダッシュボードに並び、0件ならダッシュボード自体を出さない
  - 外側クリック・Escape でも閉じる（`MagiStatusSummary` と同じ流儀）。`storageKey` を渡すと開閉状態を localStorage に記憶
  - 列数は原本の4項目固定をやめ、`--magi-summary-columns` で項目数に追随。狭幅（720px以下）は折返し
  - クラス名は `.magi-business-summary-*` 系へ改名し既存定義との衝突を避ける（AppShell 部品と同じ方針）。原本側の定義は変更しない

**採用第1号**: 職員マスタ `magi-staff-master`（AppShell実採用・本パネル採用）。

## v0.5.4 (2026-07-24)

### Sol 延長run round2 最終精密修正
- **R1-C1-VERSION-SOT（verified束縛の機械化）**: `--verified-entry` の申告を機械束縛へ。(a)`core_tag` は収集済みタグ一覧に実在＋deref先が `version_tag_commit` と一致（版タグ未作成の当該版は pending として許容）。(b)`app_commit` は core行=タグderef先（pendingは core origin/main HEAD）・採用repo行=記録済み origin/main HEAD と一致。(c)evidence ログに**機械可読の成功マーカー**（`exit 0`/`CHECK_EXIT=0`/`0 fail` 等）と**当該 core_tag 文字列**を含むことを検証。(d)collect時に `evidence_sha256` を各entryへ記録し、verify時に再計算突合（事後改変検出）。束縛検証を共有 `version-matrix-sources.mjs#validateVerifiedEntry` に集約し collect/verify で同一。`freshness_targets` に `core:origin-main-head` を追加。負例テスト（偽commit・偽タグ・失敗ログ・無関係ログ・evidence事後改変→exit 1）。
- **R2-C2-STALE-DETECTOR-GUIDANCE（最後の1箇所）**: `MagiStatusSummary` 無検証書込バッジの detail 文言を「信頼済みは `createHealthWriteDetector()` のみ（createEndpointWriteDetector はその固定パス別名・非推奨）」へ修正。
- **verify:matrix 自己失効の収束**: matrix を commit すると core の main-line HEAD が前進して `freshness_targets.core:origin-main-head` が不一致になり永遠に再生成が要る循環を修正。前進 commit 群が `docs/verified-combos/` 配下のみなら例外合格（`git merge-base --is-ancestor` で厳密祖先性を確認＋`git log stored..now --name-only` で判定・それ以外や非祖先は従来どおり exit 1）。`core:origin-main-head` はローカル HEAD（push後に origin/main になる commit）を記録。負例テスト（matrix-only前進→OK／scripts含む→NG／非祖先→NG）を追加。

## v0.5.3 (2026-07-24)

### Sol 残差レビュー 最終硬化
- **R1-C2-DETECTOR-SELFDECLARATION（最終）**: 信頼済み書込検出器を最終硬化。(a)**固定パス化**＝`createHealthWriteDetector()`（引数なし・`HEALTH_PATH='/api/health'` 固定）を新設。別エンドポイントを指す手段を公開 API から排除。(b)**GET 固定**（RequestInit 引数撤去）。(c)**redirect 拒否**（`redirect:'error'` ＋最終 `response.url` の origin 検証）。(d)信頼判定を**module-private WeakSet** へ（発見可能な Symbol プロパティを廃止＝ブランド複製・Proxy・Symbol 付与で偽装不能）。`createEndpointWriteDetector` は `@deprecated` 別名＝引数は無視され常に `/api/health` を観測。負例テスト追加（別URLでも /api/health を GET・クロスオリジンリダイレクト→failed・プロパティ/Symbol 複製・Proxy でも untrusted）。
- **R1-C1-VERSION-SOT（最終）**: `verify:matrix` の鮮度対象に **各採用repoの origin/main HEAD** と **Coreタグの deref 先 commit** を追加（`freshness_targets`・記録値と現在値を突合）。`--verified-entry` は**全フィールド非null必須**＋**evidence ログの実在検証**（`~/Documents/` / `~/Documents/magi-goal-work/` 起点）。負例テスト（HEAD前進・タグ移動・null field・不在evidence→exit 1）。
- **R2-C2-STALE-DETECTOR-GUIDANCE**: `createEnvWriteDetector` を trusted と説明していた古い doc コメント（statusDetection.ts ヘッダ・MagiStatusSummary props・README）を「無検証（集約されない）＝信頼済みは createHealthWriteDetector のみ」へ更新。

## v0.5.2 (2026-07-24)

### Sol R2 修正（persistent 3件の恒久対処）
- **R1-C2-DETECTOR-SELFDECLARATION**: 任意コールバックを無条件で trusted 化する抜け道を塞いだ。信頼済み経路は `createEndpointWriteDetector(path)` のみ——**同一オリジン強制**＋レスポンス固定フィールド `storage.writable` が boolean の時だけ採用（カスタム extract 廃止）。`createEnvWriteDetector` は **無検証へ降格**（ブランドを付けない＝生関数と同じ「無検証」表示・集約除外。名前は後方互換で残す）。定数 false の生関数・env 経由が集約されず、trusted endpoint だけが集約に入る負例試験を追加。
- **R1-C2-INVALID-KIND-THROW**: `validateDeclaredState` 全体を例外境界で囲み、`kind`/`value`/`basis` のプロパティアクセスで throw する getter・Proxy でも throw せず `ok:false` を返す。throwing getter・Proxy の回帰試験を追加。
- **R1-C1-VERSION-SOT**: `collect-version-matrix` を 11 §0.5 スキーマへ。各採用repoの固定タグ・版を **`git show origin/main:package.json`（確定commit）** から収集し、`app_commit`（origin/main HEAD）・`template_commit` を記録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...[,verified_by=...]` で検証記録を `verified` 配列へ格納。`source_hashes`（版pin実体の SHA-256）を出力し、**`npm run verify:matrix`（不一致で exit 1）を新設して `check` に組込み**。共有ソース定義 `scripts/version-matrix-sources.mjs` を新設し collect/verify のハッシュ計算を一致させた。

## v0.5.1 (2026-07-24)

### Sol R1 レビュー修正（AppShell 状態表示の堅牢化）
- **R1-C2-PROP-TYPE-BYPASS**: `MagiStatusSummary` の公開 `declaredStates` を許可リスト型 `readonly DeclarableState[]` に変更（型で businessLive のみに縛る）。JS/外部境界用に `unsafeDeclaredStates?: unknown[]`（実行時検証してから合流）を新設。Props 型経路の `@ts-expect-error` 試験を追加。
- **R1-C2-DETECTOR-SELFDECLARATION**: 任意 `classify` を `RuntimeDetectorConfig` から撤去（hostname リストのみ＝Core所有）。書込検出は Core提供ファクトリ `createEnvWriteDetector` / `createEndpointWriteDetector`（`TrustedWriteDetector` を返す）を正とし、生関数の結果は書込バッジに「無検証」を併記して安全側集約から除外する。
- **R1-C2-FAILCLOSED-EDGE**: `DEFAULT_LOCAL_HOSTS` から空文字を除外、hostname 取得不能は `unknown`、書込結果は `typeof value === 'boolean'` のみ受理（`Boolean()` 丸めを廃止）、検出器の例外・reject は failed へ。各回帰試験を追加。
- **R1-C2-INVALID-KIND-THROW**: 拒否理由生成の `JSON.stringify` を例外安全な記述関数へ置換。validator は BigInt・循環参照・Symbol でも throw せず `ok:false` を返す。
- **R1-C4-GUARDRAIL-FALLBACK**: `ci/check-ui-guardrails.mjs` に **SHELL-APPSHELL** 検査を追加。`MagiAppShell` / `BusinessNav`（コンポーネント使用 or `magi-appshell-*` クラス）を第3の合格シェル型として認識する（既存2型の判定は不変）。採用アプリは退役 LegacyShell の fallback に頼らず live の AppShell を直接検査できる。
- **R1-C1-VERSION-SOT**: `docs/verified-combos/` を .gitignore から外し版SoTとして追跡対象に。`collect-version-matrix.mts` の出力に `generated_at`（`--now` で外部注入可）と `source_hashes`（読取元 package.json・`git tag` 出力の SHA-256）を追加。

## v0.5.0 (2026-07-24)

### AppShell 部品群を追加（利用者マスタ実証の外枠を共通化）
- `SgLumenLogo` / `MagiAppShell` / `MagiStatusSummary` / `MagiVersionChip` / `BusinessNav` / `ColorModeSwitch` を新設し `@magi/core/ui` から export。
- 状態表示は自己申告にしない設計（2026-07-24裁定）: 本番URL・書込ON/OFF は機械検出、宣言できるのは許可リスト型 `DeclarableState`（業務本番化のみ）＝必ず「無検証」バッジ併記、fail-closed 集約。
- `statusDetection.ts`（純ロジック）・`versionFormat.ts`・`design-system.css` の AppShell セクション・`verify:shell` / `verify:types` / vitest 試験・`collect-version-matrix.mts` を追加。

## v0.4.4 (2026-07-21)

### U8モーダルの閉じる印を光学中央へ修正
- 閉じる印をフォントの `×` から24px固定のSVGへ変更し、OS・フォントごとの上下ずれをなくした。
- 44pxの押せる範囲、キーボード操作、ドラッグ、固定フッタなどv0.4.3の契約は維持する。
- 静的検査へ「SVGを使う」「24px寸法を両CSS入口で持つ」を追加した。

## v0.4.3 (2026-07-21)

### U8モーダル標準を正式採用
- 利用者マスタで実地検証したモーダル改善を `DraggableModal` / `ConfirmModal` に還元。
- 閉じるボタンを44pxに拡大し、背景・枠線・focus表示を付けて操作対象を明確化。
- ヘッダ・枠内スクロール本文・固定フッタの3層構造へ統一。外枠からスクロールバーが飛び出さない。
- 初期中央表示、親枠内ドラッグ制限、Escapeキー、背景スクロール停止、フォーカス復帰を標準化。
- `DraggableModal` に後方互換の任意 `footer` prop を追加。既存の `children` 利用は変更不要。
- `ConfirmModal` の操作ボタンを固定フッタへ移動。
- 静的なU8契約検査 `npm run verify:modal` / `npm run check` を追加。

### 移行
- 採用アプリは参照を `@magi/core#v0.4.3` へ更新し、アプリ側の重複モーダルCSSを削除する。
- 既存アプリは参照タグを更新するまで変化しない。

## v0.4.1 (2026-06-19)

### Fixed
- `src/data/*.ts` の拡張子省略 import を `.js` 付きに修正。Node ESM strict 解決で `@magi/core/data` 公開入口が落ちる問題を解消（resident-spine Step 2 で発見）。

## v0.4.0 (2026-06-19)

状態バッジを `@magi/core/ui` の実体部品として追加し、旧リッチtooltip方式を型として廃止した。

### BREAKING: リッチtooltip(::after)廃止
- `.magi-status-badge::after { content: attr(data-tooltip) }` によるリッチtooltipは廃止。
- 状態バッジの補助説明は `StatusBadge` の `tooltip` prop から OS標準 `title` 属性へ渡す。
- `data-tooltip` 属性は出力しない。必須情報はバッジ文字列・表・「状態の説明」本文に表示する。

### `@magi/core/ui`
- `StatusBadge` を追加。
- 型 `StatusTone = 'ok' | 'neutral' | 'warn' | 'danger' | 'info'` と `StatusBadgeProps` を export。
- `src/ui/index.ts` から `StatusBadge` と型を再export。

### `@magi/core/ui/design-system.css`
- 旧 `data-tooltip + ::after` の表示を無効化。
- `.magi-status-badge` 本体、tone色、dark上書きは引き続きコアの単一正本として維持。

### `@magi/core/ci`
- StatusBadgeコア化ガード SB-1〜4 を追加。
  - SB-1: `.magi-status-badge::after` のリッチtooltip残存を検出。
  - SB-2: アプリ側 `.magi-status-badge` / tone CSS 再定義を検出。
  - SB-3: `data-tooltip` 属性残存を検出。
  - SB-4: `StatusBadge` importなしの手実装を警告。

### 移行手順
1. 採用アプリの `@magi/core` 参照タグを `#v0.4.0` へ上げる。
2. `import { StatusBadge } from '@magi/core/ui'` へ置換する。
3. アプリ側の `.magi-status-badge` 本体/tone色/`::after` 重複CSSを削除する。
4. `data-tooltip` を削除し、説明は `tooltip` prop / `title` 属性へ移す。
5. `grep -rn '\.magi-status-badge::after' src/` と `grep -rn 'data-tooltip' src/` が0件であることを確認する。
6. `npm run check` を通す。

## v0.3.3 (2026-06-11)

`createSheetsSource` に **`batchRead(ranges)`** を追加。複数 range を Sheets `values:batchGet`
（GETのみ・**書込ゼロ**）で **1リクエスト**にまとめ読みする。戻りは引数 `ranges` と同じ順序・
同じ長さの `SheetValues[]`（該当 range が空なら `[]`）。

### 目的
- 読取APIのリクエスト数を削減し、サービスアカウント単位の読取クォータ（60読取/分など）を節約する。
- 各種表（座席表）の live 読取が 9リクエスト/更新 → 3リクエスト/更新（新DB1＋利用者マスタ1＋食事一覧1）になる。

### `@magi/core/data`（types.ts / sheets.ts。index は不変）
- `MagiDataSource` に **optional メソッド** `batchRead?(ranges: string[]): Promise<SheetValues[]>` を追加。
  **optional ＝ 既存実装（read/update/append/batchUpdate/clear/ensureSheet）と既存の型・呼び出しは一切不変**
  （**後方互換維持**＝オムツ在庫・他消費アプリに影響なし）。
- `createSheetsSource` の戻りオブジェクトに `batchRead` を追加。token 取得・withRetry・エラー処理は
  既存 `read` と同じ `googleJson` 経路を共有（署名ロジックの重複ゼロ）。書込系トークン（PUT/append/batchUpdate/clear）は不使用。

## v0.3.2 (2026-06-09)

`ManualEntry` の既定トリガー（renderTrigger 未指定時）を**アイコン型の小ボタンへ**変更し、
narrowサイドバー（80px rail）対応・型統一とした。

### `@magi/core/ui/ManualEntry.tsx`
- 既定トリガーの class を `manual-entry-btn`（全幅 text ボタン）→ `magi-manual-entry`
  （アイコン型の小ボタン）へ変更。アイコンはユニコード📖をやめ、**インラインSVGの本アイコン**に
  （@magi/core は lucide 非依存方針＝自前 SVG で描画）。
- 背景: 旧既定の全幅 text ボタンは、細いサイドパネル(rest=80px rail)で「マニュアル」が
  縦積みの大箱に化けて崩れた。オムツ在庫の `.nav-item` と同じ思想で既定を解消した。
- `renderTrigger` を渡した場合は従来どおり差し替え可（**後方互換維持**＝オムツ在庫に影響なし）。

### `@magi/core/ui/design-system.css`
- 旧 `.manual-entry-btn` 系スタイルを撤去し、既定トリガー `.magi-manual-entry` の共通スタイルを追加。
  rest=アイコン上＋小ラベル下の 64px タイル／hover・focus 展開時=横並び＋ラベル（pill）。
  `.app-side-panel` の rail 連動（`.side-nav button` / `.nav-item` と同じ rest/expand コントラクト）。
- 8テーマ＋White/Dark 追従は `--color-*` / `--bg-*` / `--border-default` / `--text-primary`
  （全テーマで定義済みの族）経由。各アプリが固有CSSを持たなくても綺麗に出るのが肝。

### dist
- dist を再ビルドして同梱（git依存配布のため）。

## v0.2.0 (2026-06-07)

完全なデザインシステム（8テーマ＋テーマ切替UI）を集約した。原本=resident-spine（利用者マスタ）。
v0.1 の `core.css` は standard-lumen 1テーマの最小核しか持たず、消費アプリ（おむつ在庫）に
「4プリセット×White/Dark の8テーマ」と「テーマ切替スイッチ」が無かった。これをコアへ集約する。

### (1) `@magi/core/ui/design-system.css`（新規・約2477行）
- 利用者マスタ `src/styles/index.css`（約3235行）の **デザインシステム部分** を移植。
  CSS変数・セレクタ・値は原本から1文字も変えていない（完コピの土台維持）。
- **8テーマ全プリセット**: 旧token（連絡ノート由来 white/dark）＋
  `standard-lumen` / `standard-aura` / `nova-carbon` / `nova-ember` の各
  `:root[data-ui-preset][data-color-mode]`（white/dark）＋ 共通 bridge。
- 背骨シェル（app-shell / side-peek-toggle / app-body-grid / app-side-panel /
  side-brand・nav・kpi / topbar）・状態色UI（magi-status-badge / state-* / app-alert）・
  サイドパネル展開挙動（閉80pxレール→hover/focusで282px展開）・
  共通コンポーネント（notice-card / toast / badge / btn-spinner / draggable-modal /
  link-btn / help-icon / search-hit）・preset別質感上書き（nova/aura/carbon/ember）・
  themed-* ユーティリティ・レスポンシブ（900px / print）を含む。
- **除外**: 利用者マスタ固有の業務スタイル（resident-tabs / data-table / wareki-* /
  resident-form-* / audience-picker / manual ドロワー / preview-diff 等）は持ち込まない。
- フォント @import・tailwind 本体は持ち込まない（採用側ビルドに委ねる）。
- CIガード (a) が探す standard-lumen white の基準トークンを含むので、採用側は
  これを import するだけで (a) を満たせる。
- v0.1 `core.css` は後方互換のため残置（design-system.css が核を包含するので新規は1本で良い）。

### (2) `@magi/core/ui/DisplaySwitch.tsx`（新規）
- 利用者マスタの DisplaySwitch を移植。Standard/Nova（mode）→ Lumen/Aura・Carbon/Ember（preset）→
  White/Dark の3段タブ。props は `{ uiPreset, uiMode, themeMode, onUiPreset, onThemeMode }`
  （useThemeState の返り値をスプレッドで渡せる形）。
- アイコンはアプリ固有の Material Symbols 演出を持ち込まず lucide-react（Palette/Sun/Moon）のみ。

### (3) `@magi/core/ui/useThemeState.ts`（新規・フック）
- `uiPreset` / `themeMode` の状態・localStorage 永続化・`document.documentElement` への
  `data-ui-preset` / `data-color-mode` / `data-ui-mode` 付与＋`dark` class＋`colorScheme` を集約。
  挙動は利用者マスタ App.tsx を踏襲。`storagePrefix` でアプリごとにキーを分離可能。
- 付随: `uiPresets.ts`（UiMode/ThemeMode/UiPreset の型・UI_MODES/UI_PRESETS・正規化関数）を
  コア化（DisplaySwitch / useThemeState が自己完結）。

### パッケージ
- version `0.1.0` → `0.2.0`。
- exports に `./ui/design-system.css` を追加（既存 `./data` `./ui` `./ui/core.css` `./ci` は維持）。
  `./ui` index から DisplaySwitch / useThemeState / uiPresets 型を再エクスポート。
- devDependencies に `lucide-react ^1.16.0` を追加（DisplaySwitch のビルド・型解決用。
  peerDependencies の指定は v0.1 のまま不変）。
- `npm run build`（tsc）緑。dist に DisplaySwitch / useThemeState / uiPresets の .js/.d.ts を生成。
- `private: true` は維持（publish しない物理ガード）。

## v0.1.0 (2026-06-07)

初版。3アプリ（omutsu-inventory / resident-spine / staff-master）の実物コードから
「データ契約・CIガード原本・背骨UI最小」を移植・統合した。

### (a) データ契約 `@magi/core/data`（原本=omutsu）
- `MagiDataSource` interface ＋ `createSheetsSource(cfg)`（Sheets 読書き＋SA JWT 自己署名 RS256＋token キャッシュ）。
- `LoadResult<T>`（storage/readAt 付きの薄いラッパー・v0.1新規）。
- `WriteResult` / `WriteReason`（omutsu の7コードを正典化）。
- `assertWriteAllowed`（多重 fail-closed）。
- `withRetry`（429/5xx のみ最大2回・指数バックオフ。append は対象外）。
- **D1修正**: 書込 valueInputOption を `USER_ENTERED` → `RAW` 固定（先頭ゼロ落ち/日付シリアル化の根絶）。
- **D4修正**: アクセス制御を resident `access.js` の RS256 署名検証版に統一（aud/iss/exp/nbf・JWKS 30分キャッシュ）。

### (b) CIガード原本1版 `@magi/core/ci/check-ui-guardrails.mjs`（原本=resident/staff・388行 md5一致）
- resident 版をそのまま原本化（omutsu 102行旧版は不採用）。
- `MAGI_CORE_GUARD_ROOT` 環境変数で検査対象 repo を差し替え可能（パス可搬の最小調整のみ・本体ロジック不変）。

### (c) 背骨UI最小 `@magi/core/ui`（原本=resident/staff・部品 byte 一致）
- `ConfirmModal` / `DraggableModal` / `Toast`（ToastProvider/useToast）を byte 一致で移植。
- 状態色トークン＋背骨シェル最小CSS を `src/ui/core.css` に切り出し。
- react / react-dom / lucide-react / react-draggable は peerDependencies。

### パッケージ
- name `@magi/core` / version `0.1.0` / type module。
- exports: `./data` `./ui` `./ui/core.css` `./ci/check-ui-guardrails.mjs`。
- peerDependencies をStep1実測値でピン留め（react ^19.2.5 / react-dom ^19.2.5 / lucide-react ^1.16.0 / react-draggable ^4.5.0）。
- `private: true`（v0.1 は publish しない物理ガード）。
