# Changelog

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
