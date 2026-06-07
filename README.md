# @magi/core

MAGI 2階老健システム群の共有コア。3アプリ（omutsu-inventory / resident-spine / staff-master）に
散らばっていた「データ契約・CIガード・背骨UI」の原本を1箇所に集約する。

- 最終更新: 2026-06-07
- バージョン: v0.2.0
- 担当: 開発部（実装=タチコマ / レビュー=バトー）

---

## v0.1 に入るもの（この3点だけ）

### (a) データ契約 `@magi/core/data`
原本 = omutsu-inventory（TS・操作網羅・7コード reason）。

- `MagiDataSource` インターフェース ＋ `createSheetsSource(cfg)`
  Sheets 読書き ＋ サービスアカウント JWT 自己署名（WebCrypto RS256）＋ token メモリキャッシュ。
- `LoadResult<T> = { values, storage: 'sheets'|'mock', readAt }`（v0.1で新規に導入した薄いラッパー）。
- `WriteResult` ＋ `WriteReason`（omutsu の7コードを正典化）。
- `assertWriteAllowed(env, user, requireAdmin?)`（多重 fail-closed の書込ゲート）。
- アクセス制御 `resolveVerifiedAccessContext` / `requireAllowed` / `requireAdmin`（**D4修正・署名検証版**）。
- `withRetry`（429/5xx のみ最大2回・指数バックオフ。**append は冪等でないので対象外**）。

### (b) CIガード原本1版 `@magi/core/ci/check-ui-guardrails.mjs`
原本 = resident/staff（388行・md5一致）。omutsu の102行旧版は不採用。
各アプリがこの原本を参照する想定。検査対象 repo は環境変数 `MAGI_CORE_GUARD_ROOT` で差し替え可能：

```
MAGI_CORE_GUARD_ROOT=/path/to/app node node_modules/@magi/core/ci/check-ui-guardrails.mjs
```

### (c) 背骨UI最小 `@magi/core/ui`
原本 = resident/staff（部品 byte 一致）。

- `ConfirmModal` / `DraggableModal` / `Toast`（`ToastProvider` / `useToast`）。
- 状態色トークン（`--primary:#6bbf95` 等）＋背骨シェル最小CSS（topbar / app-body-grid /
  app-side-panel / side-peek-toggle の核）を `src/ui/core.css` に切り出し。
- 使い方：

```ts
import { ConfirmModal, ToastProvider, useToast } from '@magi/core/ui';
import '@magi/core/ui/core.css';
```

`react` / `react-dom` / `lucide-react` / `react-draggable` は **peerDependencies**
（採用側アプリのものを使う。@magi/core はこれらを bundle しない）。

---

## v0.2 で追加：完全なデザインシステム（8テーマ＋テーマ切替UI）

原本 = resident-spine（利用者マスタ）。v0.1 の `core.css` は standard-lumen 1テーマの
最小核しか持たなかった。v0.2 は **4プリセット × White/Dark = 8テーマ** と切替UIをコアに集約する。

| プリセット | mode | 由来 |
|---|---|---|
| `standard-lumen` (Lumen) | Standard | Google Material 3系 |
| `standard-aura` (Aura) | Standard | Apple HIG系 |
| `nova-carbon` (Carbon) | Nova | Cursor系（黒/白/灰/銀） |
| `nova-ember` (Ember) | Nova | Anthropic系（暖色クラフト） |

### 追加物
- **`@magi/core/ui/design-system.css`**: 8テーマ全プリセット＋背骨シェル＋状態色＋
  サイドパネル展開挙動＋共通コンポーネント tokens。`core.css` の核を包含するので、
  新規アプリは design-system.css **1本**で良い（core.css は後方互換のため残置）。
  利用者マスタ固有の業務スタイル（一覧テーブル等）は持ち込んでいない。
- **`DisplaySwitch`**: Standard/Nova → Lumen/Aura・Carbon/Ember → White/Dark の3段タブUI。
- **`useThemeState`**: `uiPreset` / `themeMode` の状態・localStorage 永続化・
  `document.documentElement` への `data-ui-preset` / `data-color-mode` 付与を集約するフック。
- `uiPresets` の型・定義（`UiMode` / `ThemeMode` / `UiPreset`・`UI_MODES` / `UI_PRESETS` 等）。

### 採用（おむつ在庫など消費アプリでの配線）

```tsx
// 1) CSS を 8テーマ版に差し替える（core.css → design-system.css）
import '@magi/core/ui/design-system.css';

// 2) フックで状態を持ち、DisplaySwitch にそのまま渡す
import { DisplaySwitch, useThemeState } from '@magi/core/ui';

function App() {
  const theme = useThemeState();           // { uiPreset, themeMode, uiMode, onUiPreset, onThemeMode }
  // theme.uiPreset / theme.themeMode の変化で <html> に data-ui-preset / data-color-mode が付き、
  // design-system.css の :root[data-ui-preset][data-color-mode] が 8テーマを切り替える。
  return (
    <div className="app-shell">
      {/* サイドパネル等の背骨に <DisplaySwitch {...theme} /> を1つ置く */}
      <DisplaySwitch {...theme} />
    </div>
  );
}
```

- `useThemeState({ storagePrefix: 'magi-omutsu' })` で localStorage キーをアプリごとに分離できる。
- `lucide-react` は DisplaySwitch が使う（peer。採用側アプリが導入する）。

---

## D1修正・D4修正（v0.1 で必ず効かせた2点）

### D1修正: 書込 valueInputOption を `RAW` 固定
omutsu 原本は `USER_ENTERED` だったが、`RAW` に統一した（`src/data/sheets.ts` の update / append /
batchUpdate）。`USER_ENTERED` は Sheets 側の型推論で **先頭ゼロ落ち（"007"→7）・日付シリアル化**
を招く。resident/staff の RAW 運用に合わせ、2026-06-05 resident 事故を横展開で根絶する。

### D4修正: アクセス制御は署名検証版を採用
omutsu の18行ヘッダ無検証版ではなく、resident `access.js` の **RS256 署名検証版**
（aud/iss/exp/nbf 検証・JWKS 30分キャッシュ）を `src/data/access.ts` に TS 化して移植した。
ヘッダ無検証版は偽装ヘッダでなりすませるため不採用。

---

## v0.3 送り（v0.1 には入れない）

zod / 楽観ロック / 監査ログ / Durable Object。これらは v0.1 のスコープ外。

---

## 公開（publish）について

> **GitHub Packages はスコープ＝owner 必須**のため、公開名（`@<owner>/core` 等）は採用時に確定する。
> **v0.1 はビルド緑までがゴールで publish しない**（`package.json` の `"private": true` が物理ガード）。
> 公開と各アプリ採用は、後の社長ゲートで判断する。

---

## ビルド

```
npm install     # devDeps（peer の react 等も含む）を入れる
npm run build   # tsc で dist/ を生成（型エラーゼロが緑の条件）
```
