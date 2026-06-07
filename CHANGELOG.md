# Changelog

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
