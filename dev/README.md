# dev/ — デザインシステム ショーケース（開発者検証用）

`@magi/core` の見た目・部品・動きを **1枚で点検する**ための検証ページ。業務画面でも配布物でもない。

- **配らない**: `src/` の外に置いてあるので `npm run build`（tsc・include: `src`）は拾わない＝ `dist/` に出ない。
- **既存コードを変えない**: このページは core を読むだけ。`package.json` にも script を足していない（理由は下記）。
- **新しいデザインを作らない**: 色・寸法・動き・部品はすべて core の実装から読む／import する。
  トークン一覧は手書きの表ではなく、読み込んだ CSS の CSSOM を走査して `getComputedStyle(:root)` で解決値を読む。
  core 側でトークンが増減すれば、このページの表も自動で増減する。

## 起動

```bash
npx vite --config dev/vite.config.ts
```

→ http://127.0.0.1:5273/

初期テーマは URL で固定できる（スクショ・検査の再現性のため）。

```
http://127.0.0.1:5273/?mode=dusk&preset=standard-lumen
```

- `mode` … `white`（陽光）/ `dusk`（残照）/ `dark`（月光）/ `auto`（時刻帯）
- `preset` … `standard-lumen` / `standard-aura` / `nova-carbon` / `nova-ember`

保存値は `magi-core-showcase.*` の鍵に入る（採用アプリの `magi.*` を汚さない）。

## 3モード撮影＋コンソール監視

```bash
node dev/screenshot.mjs --url http://127.0.0.1:5273 --out /tmp/shots
```

- 3モードぶん「初画面」と「全体」を撮る。
- `console.error` / `console.warning` / ページ例外 / リクエスト失敗が1件でもあれば **exit 1**。
- `data-color-mode` が指定モードと違えば落とす（撮り違いの防止）。

`playwright-core` は core の依存に**入れていない**（`package.json` を動かすと後述の理由で CI が赤くなる）。
採用アプリ側の `node_modules` を借りる:

```bash
ln -s ~/Documents/magi-staff-directory/node_modules/playwright-core ~/Documents/magi-core/node_modules/playwright-core
```

（`node_modules/` は git 管理外。`npm ci` すると消えるので、必要な時に張り直す。）

## コントラスト検査

`ci/check-contrast.mjs` は URL を測る性質上 `npm run check` に入っていない。起動中の dev サーバへ当てる:

```bash
node ci/check-contrast.mjs --url http://127.0.0.1:5273 --modes white,dusk,dark
```

この検査が読むのは**背景色（backgroundColor）だけ**で、背景画像（残照のグラデーション）は地として計算されない。

## 型検査

`npm run verify:types`（`tsconfig.typecheck.json`）は `src` と型拒否テストだけを見る＝ここは対象外。
このフォルダは専用の設定で見る:

```bash
npx tsc -p dev/tsconfig.json
```

## `package.json` を触らない理由

`verify:matrix` が **core の `package.json` の内容そのものの SHA-256** を版SoTとして固定している。
`"dev": "vite ..."` を1行足すだけで `npm run check` が赤くなり、版マトリクスの再生成（＝別工程）が必要になる。
検証ページの利便のために版SoTを動かさない。だから起動は上の `npx vite --config ...` の1行で行う。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` / `main.tsx` | 入口。CSS は採用アプリと同じ `@magi/core/ui/design-system.css` の1行で読む |
| `vite.config.ts` | root=`dev/`・`@magi/core/ui` を repo の `src/` へ向ける alias・127.0.0.1:5273 |
| `Showcase.tsx` | 上帯（モード切替＝core の実物）・目次・9つの節 |
| `showcase.css` | 並べるための器だけ。色・影・角丸・書体は core のトークン `var(--…)` を参照する |
| `lib/tokens.ts` | CSSOM からトークン名・keyframes 名を集め、実値を計測する道具 |
| `lib/Section.tsx` | 節・見本枠の版面部品 |
| `sections/*.tsx` | ①色 ②タイポ ③スペーシング ④モーション ⑤部品 ⑥アイコン ⑦ロゴ ⑧背骨とCIガード ⑨監査リスト |
| `screenshot.mjs` | 3モード撮影＋コンソール監視（検収の道具） |

## 出所

- 発注: `個人/2026-08-08_Eclipse_デザインシステム/2026-08-09_発注_M1ショーケース実装便_v0.1.md`
- 規定の正本: `開発/標準仕様/07_Standard_Nova_UI金型.md` v2.3 §1-4（アイコン・ブランドロゴ）／`01_UI標準`
- 構成の手本: Eclipse v1.0 ショーケース（22節構成・監査リスト文化）。**値・色・部品は1つも持ち込んでいない**。
