# Changelog

## v0.14.0 (2026-08-08)

### 第3の色モード「残照」——White と Dark のあいだに夕焼けを足す（社長採用 2026-08-08）

仕様正本＝`開発/標準仕様/2026-08-08_候補_テーマ第3モード残照_仕様_v1.0.md`（社長裁定 15:26
「常に3案目が良い。これを採用。命名も添付ファイル案で。MAGIの型に追加して」）。
**追加だけ**の版＝陽光(white)/月光(dark) の値・既存 export・既存アプリの配線は1つも変えていない。

**入ったもの**
- `design-system.css` に `:root[data-color-mode="dusk"]` と **4プリセット分の bridge**（12テーマ化）。
  色は仕様§2 の確定値を逐語で。設計思想は「**舞台は夕焼け、道具は緑**」＝背景・ヘッダーが暮れても
  主操作ボタン・成功系・リンクボタン・カード左帯は湘南グリーン `#2f6f5f` のまま（01_UI標準 §3-1）。
- `ColorModeSwitch` が **陽光／残照／月光／自動** の4択に（アイコン＋漢字2字）。
  「自動」は `onThemeModeSetting` を渡したときだけ出す＝**2引数だけで使っている既存アプリは無改修**
  （ボタンが3つになるだけで型も配線も変わらない）。
- `useThemeState` に自動モード。端末時計で 陽光 6:00–16:00 → 残照 16:00–19:00 → 月光 19:00–6:00、
  **15分ごとに再評価**。**手動選択が常に優先**で、「自動」を選び直すと帯運転へ戻る。
  保存は旧キー（実モード）＋新キー（'auto' を含む選択値）の2本立て＝v0.13 以前の保存値もそのまま復元できる。
- 夕焼けロゴ `sg-logo-sunset.png`（480×240・SHA-256 一致を確認した Drive 正本の写し）を同梱範囲へ追加。
  `SgBrandLogo` は 陽光→day／残照→sunset／月光→night。@2x・master は従来どおり非同梱。
- 公開API追加: `THEME_MODES` / `ThemeModeSetting` / `AutoThemeSchedule` / `resolveAutoThemeMode` /
  `resolveThemeMode` / `normalizeThemeModeSetting` / `getThemeMode` / `DEFAULT_THEME_MODE_SETTING` /
  `DEFAULT_AUTO_THEME_SCHEDULE` / `AUTO_THEME_REEVALUATE_MS`。

**実測で1つ設計を変えた（帯の塗り方）**

仕様§2 の帯は高さ104pxの器を前提にした**比率**（0/55/88/100%）で書かれている。比率のまま
ヘッダー全面に敷くと、ヘッダーが伸びたときに明るい下端が文字の高さまで上がってくる。
Chrome 実測（`--text-on-header #fdf0e6`・字面の実ピクセル）:

| ヘッダーの形 | 高さ | アプリ名の字面 | 帯を全面に敷いた場合 |
|---|---|---|---|
| 絵ロゴ（SgBrandLogo） | 104px | 34.7–61.6% | 5.15:1 ○ |
| SVGロゴ | 88px | 42.2–74.0% | **4.15:1 ×** |
| ロゴ無し | 88px | 44.9–76.7% | **3.96:1 ×** |
| 狭幅390px（右クラスタが2段） | 320px | 55.6–94.8% | **2.21:1 ××** |

そこで**同じ4色のまま高さに依らない2層**で塗る: 空 `--bg-header-sky`（#8e3040 → #a53a32、以降は
#a53a32 のまま）＋ 滲み `--bg-header-glow`（**下端14px固定**＝ヘッダーの下 padding と同値なので
字面に触れない）。塗り直し後の実測は**全ての形・全ての幅で最悪 5.78:1**（＝#a53a32 の値が床）。
仕様§2 の帯そのものは `--bg-header-gradient` に逐語で残してある（固定高の帯を自前で描くアプリ用）。

**仕様の空白を埋めた点（すべて仕様§2 の「未確定の細部は系統から補完し、4.5:1 以上を機械検証」に従う）**
- `--text-muted` は仕様表の `#836a57` が `--bg-app` 上で **4.47:1** と基準を僅かに割るため、色相を保ったまま
  `#7f6754` へ（app 4.69 / surface 5.08 / surface-alt 4.74）。
- `--status-warn-ink: #ba3a12` を残照にも用意（`--warn #d84315` は暖クリーム地で 3.93:1＝陽光と同じ手当て）。
- 重要度背景・影・青/赤/灰バッジは暖クリーム地・暖黒文字の系統で補完。
- nova-carbon の無彩色ドクトリン・nova-ember の橙 primary は**残照では効かせない**（残照は「モードが色を
  決める」設計＝§2 の掟「道具は緑」が優先）。white/dark 側は不変。

**番人（新設 `test/duskThemeMode.test.tsx`・21本）**
時刻帯の境界／手動優先／15分の再評価／永続化と旧キー復元／4択UI（既存2引数でも壊れない）／
残照トークンの逐語一致／緑の据置／**全組み合わせのコントラスト機械検証**／帯の高さ非依存／
**陽光・月光が1文字も動いていないこと**。**変異試験9件すべてで赤を実測**（muted を仕様表の値へ戻す・
主色を橙へ・空を下端まで明るく・16:00 の境界をずらす・15分タイマーを外す・手動優先を壊す・
残照ロゴを昼版へ・「自動」を落とす・陽光の値を動かす）。

**既知の残り**
- `DisplaySwitch`（8テーマの開発者検証用UI）は White/Dark の2値のまま＝残照は `ColorModeSwitch` から選ぶ
  （01_UI標準 §3-1「8テーマUI は開発者検証画面専用」。`.theme-mode-tabs` が2列グリッド固定のため、
  ここを3値化するとアプリ側の写しマークアップの見た目を動かす）。
- 狭幅390pxでヘッダーが縦長になる（アプリ名が縦書き状に折れる）のは**残照以前からの挙動**で、
  陽光でも同じ。今回の版では触っていない。

## v0.13.7 (2026-08-05)

### 二系統レビュー（バトー×笑い男）の致命2件を反映——v0.13.6 の「根治」の射程を実際に埋める

**まず言葉の訂正**: v0.13.6 の「根治」は **Core の中に限れば真、MAGI 全体では偽**だった。
Core のモーダルは直ったが、アプリ側が自前で `body.style.overflow` を退避・復元していると
二重所有になり、**同じ膠着が「Core のカウントは0なのに hidden」という検知しにくい形で再発する**
（両レビューが独立に、複製リポでの実測で再現させた）。以下はその射程を埋めるための版。

**致命1: 錠を公開していなかった**（アプリは参加したくても参加できなかった）
- `lockBodyScroll` / `forceReleaseBodyScroll` / `getBodyScrollLockDepth` を `@magi/core/ui` から公開。
- 配布される検査 `ci/check-ui-guardrails.mjs` に「アプリ src で `body.style.overflow` を直接触っていないか」を追加（**警告から開始**・12_本番保全標準 §2 の段階導入。block 昇格は社長GO後）。
  **Core の `scripts/` は配布物に入らない**＝新しい番人を Core の中だけに置いても28本では一度も走らない、という指摘への手当て。

**致命2: 直した2箇所のうち ManualViewer に番人が無かった**
- `test/manualViewerScrollLock.test.tsx` を新設（単独開閉／確認モーダルとの入れ子同時閉じ）。
  jsdom に `IntersectionObserver` が無く描画できなかったのが「試験が無い」理由だったため、
  `test/setup.ts` にスタブを置いた（**「試験しにくい」を「試験が無い」の理由にしない**）。
- `verify:modal` を綴り依存の文字列一致から正規表現へ（`b.style.overflow =` の別名経由・
  `setProperty('overflow')` も拾う）。検査対象を「背景スクロールを止める部品すべて」の表に変更し、
  ManualViewer を含めた。錠の公開と非常口の存在も検査項目に追加。
- **変異試験で実証**: ManualViewer を修正前の形へ戻すと `verify:modal` が2項目FAIL、
  新試験が2本赤。v0.13.6 時点では **251試験・verify:modal・型検査のすべてが素通り**していた。

**その他（レビュー指摘の反映）**
- `npm run check` の連鎖に `npm test` を追加（試験がどの自動ゲートにも入っていなかった）。
  `verify:matrix` より前に置く——マトリクスの鮮度で試験が走らなくなるのを避けるため。
- **非常口 `forceReleaseBodyScroll()` を新設**。参照カウントは漏れると自力で戻れず、旧実装にあった
  偶発的な自己修復が消えている。介護現場の共用端末で固着した時にリロードを強いない逃げ道。
- 解放時に「現在値が 'hidden' でなければ書き戻さない」防御を追加（他者の書き込みを踏み潰さない）。
- `lockBodyScroll(doc)` の `doc` 引数を廃止（状態は body 1つに対して1組。複数 document を
  扱えるように見えて壊れる形を消した）。SSR では no-op を返す。
- `ManualViewer` の effect を暗黙 return から明示形へ（波括弧1組で後片付けが消える形を避ける）。

**未対応（次版・射程外として明記）**
- iOS/iPadOS Safari では `body{overflow:hidden}` は背景スクロールを止めない（WebKit既知挙動）。
  iPad を使う画面があるなら実機確認が要る。position:fixed 方式は次版で検討。
- スクロールバー幅の補正（Windows デスクトップでモーダル開閉のたびに横ずれ）。v0.13.6 以前からの積み残し。
- アプリ側の自前ロック撤去: `magi-resident-spine`（＋fcal-r05 の同一コピー）・`magi-floor-calendar-v2-r05`・
  `magi-renraku-note`（対症療法）。**版上げと同時に撤去しないと直らない**。

## v0.13.6 (2026-08-05)

### 入れ子モーダルを同時に閉じると画面が固まる事故の根治（社長指示「今のうちに直しておいてほしい」）

2026-08-05 夜、連絡ノートの実機で社長が再現。投稿フォーム（DraggableModal）の上に投稿前の
確認モーダル（ConfirmModal）が開き、投稿が成功して**両方が同じ更新で閉じる**と、
モーダルが1枚も無いのにページがスクロールできなくなった。

**真因**: 各モーダルが `document.body.style.overflow` を**自分で退避**して 'hidden' を掛け、
閉じる時に**自分が退避した値**へ戻していた。入れ子では後から開いた側の退避値が既に 'hidden'
のため、先に閉じた側が元へ戻した後、後の側が 'hidden' を書き戻す。閉じる順序に依存する競合で、
「たまに固まる」の形で現れるため原因が分かりにくい。

**対策**: `src/ui/scrollLock.ts` を新設し、参照カウントで管理する。最初の1枚だけが退避して止め、
最後の1枚が閉じた時だけ元の値へ戻す。解除関数は二度呼んでもカウントを壊さない（StrictMode の
効果二重実行に耐える）。`DraggableModal` と `ManualViewer`（同じ書き方をしていた第2の箇所）を移行。

**検査**: `test/modalScrollLock.test.tsx` 6本を新設（入れ子・同時閉じ・解除順の入れ替わり・
二重解除・元の値が hidden 以外の場合・片方だけ閉じた場合）。**修正前のコードに戻すと
`expected 'hidden' to be ''` で赤くなることを実測**（症状そのものを捕まえる試験であることを確認）。
`verify:modal` の「背景スクロール停止」は旧実装の literal を見ていたため意図を保って更新し、
「背景スクロールを自前で復元しない」を1行追加した（検査器も一緒に直さないと素通りする）。

**影響範囲**: DraggableModal を入れ子で使う全アプリ。2026-08-05 の実測で core 採用28本のうち
14本が入れ子を持つ（連絡ノート・クッション・フロアカレンダー・経過観察・オムツ在庫・
利用者背骨・職員マスタ ほか）。

## v0.13.5 (2026-08-05)

### モーダルが背面に回る事故を構造で止める（社長指示「こういうことが起きないよう対策したい」）

2026-08-05、職員指導記録アプリの実機で、更新履歴パネルが上部の状態バーとヘッダのメニューの
**後ろ**に回った。社長の観測は「このへんの、メニューや状態説明などの表示の際、よく起こる。
**今までのアプリでも結構指摘している**」。

真因は2つ重なっていた。

1. **数字で負けていた**——`DraggableModal` の既定 z-index が生の `50`。ヘッダのメニューは
   `--magi-z-header-popover` = **500**。同じCSSに旧階段（40/50/60/75）と新階段（100〜1000）が
   同居しており、モーダルだけが旧階段のまま取り残されていた。
2. **土俵ごと負ける形だった**——portal を使っていないため、`backdrop-filter` や `transform` の
   付いた祖先が作るスタッキングコンテキストに閉じ込められる。この中では何を付けても勝てない。

**直し**: 既定を `var(--magi-z-modal, 800)` へ（生の数値の既定値を廃止）＋ `createPortal` で
body 直下へ出す（`ManualEntry` が既に採っていた作法へ揃えた）。`zIndex` prop は
`number | string` として維持——重ねモーダルはトークンを渡す。

**再発防止**: `verify:modal` に3点追加（body直下ポータル／既定はトークン経由／階段の定義存在）。
`test/modalStacking.test.tsx` は `backdrop-filter` を持つ祖先の内側で開く**事故と同じ形**の
負例試験。直しを外すと3件中2件が赤くなることを実測（変異試験）。

**影響**: `DraggableModal` を土台にする `ConfirmModal` / `VersionHistoryModal` /
`OperatorSelectModal` すべてに効く。採用アプリは core を上げるだけで直る。

## v0.13.4 (2026-08-03)

### マスタ紐づけ点検: 定数経由の鍵参照を拾う（v0.13.3 の見落とし修正）

利用者マスタ実測で、`const KEY = 'STAFF_MASTER_SPREADSHEET_ID'; env[KEY]` の形（定数経由）を
検出できず「職員名簿の鍵は不要」と誤報していた。文字列リテラルの `*_SPREADSHEET_ID` も
要求キーとして拾うよう拡張（過検出side＝安全側に倒す）。試験1本追加。

## v0.13.3 (2026-08-03)

### 型点検の拡張——ロゴ・サマリー帯・マスタ紐づけ（社長指示の物理化）

2026-08-03 社長指示「MBPで調整を依頼したらミュシャ風ロゴが反映されていなかった。各アプリで
こういうことが絶対起きないように」「各アプリは職員・利用者マスタを参照することがほとんど。
必要な紐づけマスタがちゃんとつながって機能するかの点検もできるように」。

**1. CIガード (j) に「正式ロゴ」「サマリー帯」を追加**

標準装備の検査対象を4→6部品へ（`SgBrandLogo`・`MagiBusinessSummary`）。BusinessNav を使う
アプリでロゴやサマリー帯が欠けていれば WARN が鳴る＝「ロゴ未反映のまま気づかない」を構造で止める。
意図的に持たないアプリは TYPE_DEVIATIONS へ記録（従来どおりの逃がし道）。

**2. `ci/check-master-links.mjs` を新設**（マスタ紐づけ点検・読取専用）

- [1] 静的: functions/ のコードが参照する台帳キー（`env.XXX_SPREADSHEET_ID`）を列挙
- [2] 実配線: その鍵が本番 Cloudflare Pages 設定に**名前として実在するか**を突合
  （値は一切見ない。欠け＝配備しても名簿が読めず「確認中」で止まる、を配備前に検出）
- 直結キーゼロのアプリ（供給API経由・スナップショット型）は「対象外」として合格
- 限界を明記: 「今この瞬間読めるか」（共有剥がれ）は Access 内の /api/health が要るため
  本版対象外——画面の「状態の説明」が担う。Service Token 経由の実読点検は将来拡張
- 純ロジックは `ci/master-links-lib.mjs` へ分離（試験6本）

## v0.13.2 (2026-08-02)

### 入口チェック: チームドメイン比較を正規化（偽NGの解消）

16アプリへの初回配布実測で、`CF_ACCESS_TEAM_DOMAIN` に `https://` を前置きした表記ゆれが
5本見つかり、一律 NG にしていた。スキームの有無は入口事故ではない（当該アプリは稼働中）ので、
`normalizeTeamDomain` で正規化して比較し、表記ゆれは WARN（次の改修時に揃える）へ格下げ。
本当に別ドメインなら従来どおり NG。**偽NGは本物のNG（AUDずれ・毎日認証・意図未記載）を
霞ませる**＝狼少年化の防止。試験2本追加。

## v0.13.1 (2026-08-02)

### 配布物一覧の修正（v0.13.0 の欠陥）

v0.13.0 で新設した `ci/check-access-entry.mjs` / `ci/access-entry-lib.mjs` を package.json の
`files`（npm 配布物一覧）へ足し忘れており、**exports に書いたのにインストールへ入らない**状態だった
（採用アプリでの実インストールで発見）。2ファイルを `files` へ追加した以外の変更なし。

## v0.13.0 (2026-08-02)

### 入口チェック原本の新設（12_本番保全標準 §4-2）＋ CIガード (j) ナビ・メニュー標準

2026-08-02 社長裁定「（入口の点検機能を）昇格させて」「配ってください」および
「現場運用化するにあたって必ず型のチェックをするので、その際に確認できるようにしてほしい」。

**1. `ci/check-access-entry.mjs` を新設**（原本・読取専用）

コード側の検査は repo の中しか見ない。入口——**誰が入れるか・どれだけの頻度で認証が来るか**——は
Cloudflare Access 側にあり、ズレても検査が1つも鳴らなかった。フロアで業務が止まる入口事故は
2つに集約される: ①入れるはずの人が弾かれる（許可リスト・AUDのずれ）②認証が何度も来る
（`session_duration`。**Policy の値は Application を上書きする**＝04 §4-1 B-22「毎日認証」の実弾）。

- 検査5項目: Application の一意特定／AUD 一致／チームドメイン／認証の頻度
  （Application と全 identity Policy の**短い側**・168h未満=NG・730h未満=WARN）／
  許可メールの突合（repo `ACCESS_ALLOWLIST`＝意図 × Cloudflare＝実態）
- **`ACCESS_ALLOWLIST` キーが無いアプリは NG（意図未記載）**。「書かなかった時の既定」に
  頼らせない（12 §4-2 規律・2026-08-02 実測でアプリごとに 1名/2名/4名と割れていた）
- 旧世代アプリへの配布のため `PRODUCTION_HOST` 欠落時は `name` から `<name>.pages.dev` を
  推定し、推定したことを出力に明示する
- **「未確認」は「合格」ではない**: 鍵なし・通信不能・wrangler.toml 不在は exit 2（fail loud）
- 純ロジックは `ci/access-entry-lib.mjs` に分離（試験15本）。`npm run check` には入れない
  （ネットワーク依存のためオフラインで型検査を落とさない）。検査対象は
  環境変数 `MAGI_ACCESS_CHECK_ROOT` または cwd
- 基準実体: `magi-staff-directory`（2026-08-02・負例5本で検出力を実機確認済み）からの昇格

**2. CIガード (j) ナビ・メニュー標準を新設**（警告のみ＝warn運用）

事故（2026-08-02・職員マスタ）: `01_UI標準` §3-3「メニュー標準装備4点（今すぐ更新／
マニュアル／テーマ切替／更新履歴・最下部）＋ナビ直置き全画面」は条文化されたが機械検査が無く、
コア版同期だけを済ませた型合わせで**履歴と全画面が丸ごと抜けた**。検査なき条文は守られない。

- BusinessNav を使うアプリで `ManualEntry` / `ColorModeSwitch` / `VersionHistoryModal` /
  `FocusToggle` の参照を検査。欠けは WARN（07x 在庫表「強制ガードは昇格後」に整合。
  誤検知の観察後に失格へ昇格を裁定）。「今すぐ更新」は意味的で機械判定不能のため対象外
- 試験3本（欠け→WARN／4部品→合格／BusinessNav 未使用→対象外）

## v0.12.0 (2026-07-31)

### シェル実体の一斉棚卸し — ヘッダーのパネル化を Core が配る＋「語彙だけ定義」を機械で禁じる

2026-07-31 16:27 社長裁定「ヘッダーのパネル（枠）もシフト v4 と同じにして正とする」
「同構造の欠けを個別でなく一斉に塞ぐ」。

**事故（同型3例目）**: Core のシェル系は「トークン（語彙）だけ定義して、適用規則（実体）は
各アプリの写しが担う」構造だった。① 外周余白（v0.11.1 で修理済み）に続き、
② `.magi-appshell-header` の**パネル化**（`min-height` / `padding` / 枠線 / 角丸 / 面 / 影）も
Core 本体に無く、利用者マスタが (i) ガードに沿って写しを撤去した瞬間に、
**ヘッダーが素の背景へ直置き**になった（社長が実機で発見）。個別修理を繰り返さないため、
`.magi-appshell*` 系を3ソース（シフト v4 ＝見え方の正／職員マスタ／利用者マスタの掃除前実装）で
突合し、欠けている実体を今回で全部塞ぐ。

**1. 移植した実体**（`src/ui/design-system.css`）

- `.magi-appshell-header` をパネルにする:
  `min-height: var(--magi-header-min-height, 88px)` /
  `padding: var(--magi-header-padding, 14px 18px)` / `box-sizing: border-box` /
  `border: 1px solid var(--border-default)` / `border-radius: var(--card-radius, 14px)` /
  `background: var(--bg-surface)` / `box-shadow: var(--surface-shadow)`。
  値はシフト v4 の実装から写し、寸法は v0.10.0 で既に定義済みのトークンを消費させた
  （新しい寸法は発明していない）
- `.magi-appshell-nav` に `box-shadow: var(--surface-shadow)` を追加（帯だけ平らにならない）

**2. 移植しなかったもの（コア値が正・棚卸しの判断）**

- タップ標的の `min-height: 44px` 群（`.magi-appshell-nav-tab` / `-role-chip` / `-menu-item` /
  `-colormode button` / `-version-chip` / `-status-details > summary`）＝利用者マスタの掃除前
  実装だけが持っていた写し。Core は各要素に意図した値（34/34/38/32/36/36px）を持ち、
  見え方の正であるシフト v4 もこの 44px 群を持たない
- シフト v4 の狭幅（`@media (max-width: 560px)`）でのヘッダー圧縮・ナビ縦積み・タブ 48px、
  および `.v4-work-view` の作業面 `padding: 0` ＝勤務表の密度要求に紐づくアプリ固有の出し分け
- `--app-shell-max` の 1480px（利用者マスタの fallback）＝テーマ既定 1400px が正

**3. トークン消費者検査を新設**（`scripts/verify-token-consumers.mjs`・`npm run verify:tokens`）

同じ穴に3回落ちた原因＝「語彙を定義しただけで実体を配っていない」ことに気づけない構造。
design-system.css で定義される全 `--magi-*` トークン（30件）に、Core CSS 内の消費箇所
（`var(--…)`）が最低1つあることを機械で要求する。無いものは「意図的に語彙先行」の
例外リスト（`VOCABULARY_ONLY`・理由コメント必須）へ明記させ、例外の陳腐化
（消費され始めた／定義が消えた）も失格にする。`npm run check` に組み込み。

- 検査前の消費者ゼロ: 18件 → 今回の移植で `--magi-header-min-height` /
  `--magi-header-padding` が解消、残り16件は例外リストへ理由付きで登録
  （アプリが自分の器を書くための物差し ＝ panel/card/button/field/empty/list-item 系14件、
  `--magi-z-app-sticky-max`＝アプリ側の上限の約束、`--magi-z-fullscreen`＝既存名の別名）

**4. 版マトリクスの先行不良を解消**

`docs/verified-combos/` の `verified` が0件のまま `test/verifyMatrix.test.ts` の7本が
落ち続けていた（先頭エントリを改竄する負例が対象不在で TypeError）。実在する検証済み
組合せ（`magi-resident-master` × `v0.12.0`）を `--verified-entry` で登録し、7本を緑に戻した。

**副作用の検算（採用アプリの見た目は動かない）**

- 写しを残しているアプリは詳細度で勝つ: シフト v4 の `.v2-app-shell .magi-appshell-header`
  ＝ (0,2,0) ／ Core の `.magi-appshell-header` ＝ (0,1,0)。同名プロパティはアプリ側の値が
  そのまま適用され、見え方は不変（写しを消したときだけ Core の実体が現れる）
- 職員マスタはトップメニュー型（`.magi-appshell*` を使っていない）ため対象外
- アプリは Core を**タグ参照**で固定しているため、稼働中アプリへの即時影響も無い

**試験**: `test/layoutTokens.test.tsx` に (a3) 8本を追加（`min-height`・`padding`・枠線・
角丸・面・影のトークン参照／ナビの影／描画後の実体）。

## v0.11.1 (2026-07-31)

### シェルの外周配置を Core が「実体として」配る（欠陥修理・社長裁定）

2026-07-31 社長裁定「シフト作成アプリ（`magi-shift-v4`）の全体配置を正とする・正式採用」。

**事故**: v0.10.0 で `--magi-shell-padding: 18px` / `--magi-shell-padding-sm: 10px` と
各テーマの `--app-shell-max` を**定義しただけ**で、シェル本体 `.magi-appshell` は
それを**消費していなかった**（`display: flex` / `flex-direction: column` / `gap` のみ）。
外周余白の実体は各アプリの写し
（`.v2-app-shell.magi-appshell { max-width: var(--app-shell-max, 1400px); margin: 0 auto; padding: 18px; }`）
が担っていた。v0.11.0 の (i) ガードに沿って利用者マスタがこの写しを撤去したところ、
**外周余白 0px・最大幅なし・左上貼り付き**になった（社長が実機で発見）。
「コアにあるものはアプリから消す」を成立させるには、Core が実体を配る必要がある。

**修理**（`src/ui/design-system.css`）

- `.magi-appshell` に外周配置を追加:
  `width: 100%` / `max-width: var(--app-shell-max, 1400px)` / `min-height: 100vh` /
  `box-sizing: border-box` / `margin: 0 auto` / `padding: var(--magi-shell-padding, 18px)`。
  値はすべてシフト v4 の実装から写した（新しい寸法は発明していない）
- 狭幅は既にシェル系が使っている `@media (max-width: 640px)` に相乗りし、
  `padding: var(--magi-shell-padding-sm, 10px)` へ落とす

**副作用の検算（見た目は動かない）**

- 写しを残しているアプリ（シフト v4 等）は `.v2-app-shell.magi-appshell`＝詳細度 (0,2,0) で、
  Core の `.magi-appshell`＝(0,1,0) に**カスケードで勝つ**。同名プロパティはアプリ側の値が
  そのまま採用されるため見た目は不変。狭幅の上書きも同じ理由で勝つ
- アプリは Core を**タグ参照**で固定しているため、稼働中アプリへの即時影響も無い
- トークンの値・他の部品の寸法は変更していない（v0.10.0 の寸法体系は据え置き）

**試験**: `test/layoutTokens.test.tsx` に (a2) 6本を追加（最大幅・中央寄せ・
`padding` のトークン参照・`box-sizing`・狭幅の -sm・描画後の実体）。
反証確認: `.magi-appshell` から `padding` 宣言を外すと当該試験が落ちる（実測）。

## v0.11.0 (2026-07-31)

### 選択状態の標準形＝ピル（社長裁定）＋ シェル再定義を止める CIガード (i)

2026-07-31 社長裁定（承認記録 USER-20260731-02）「（選択パネルの形は）添付4の形よりも
添付3の形に統一する方向でお願いしたい。これも、正式採用したい」。絞り込み・切替の
セグメントを Core の標準部品に昇格させ、同時に「アプリ側に Core の写しが残る」構図を
機械で止める。

**1. セグメント標準部品 `.magi-segment` を新設**（`design-system.css`）

契約は3クラス固定 — 容器 `.magi-segment` ／ 項目 `.magi-segment button` ／
選択中 `.magi-segment button.is-active`（下流アプリと条文がこの名前を参照する）。

- **形はピル**: 容器・項目とも `border-radius: var(--magi-segment-radius, 999px)`。
  角丸12pxだとカードや入力欄と見分けがつかず「どれが選択中か」を毎回読み直すことになる
- **`--magi-segment-radius` を 12px → 999px へ変更**（v0.10.0 で写した値を裁定で更新）。
  `--magi-segment-padding` / `--magi-segment-gap`（各 4px）は据え置き
- 配色は 8テーマ共通の CSS 変数のみ（生色コードなし）:
  容器＝`--bg-surface-alt` + `--border-default`、選択＝`--color-primary` の地に
  `--primary-button-text` の文字、非選択の文字＝`--text-secondary`。
  項目の当たり判定 `min-height: 36px`・`font-weight: 750`
- **文字サイズは指定しない**（器から継承）。手本の `.scope-tabs` も未指定で、
  置かれた場所の文字と揃うのが正しい振る舞いだから
- 実測の出所: 利用者マスタ（`magi-resident-master`）の `.scope-tabs` 一式と、
  Core 既存の `.magi-appshell-nav-tab` / `.magi-appshell-colormode` の作法

**2. CIガード原本に (i) シェル再定義の検査**（`ci/check-ui-guardrails.mjs`）

事故の形: 型を採用したのに、アプリ側 CSS に **Core と同じ寸法を書き直した「写しの層」**が
残る。すると Core を上げても見た目が動かず、直したはずの不揃いが現場に出ない
（利用者マスタで実際に起きて撤去した）。

- **アプリ側 CSS が `.magi-appshell*` を主語に寸法・文字系
  （`max-width` / `width` / `padding` / `margin` / `min-height` / `height` /
  `font-size` / `border-radius` / `gap`）を再定義していたら exit 1**
- (h) との違い: (h) はシェル3クラスの「枠を壊す**値**」を見る。(i) は
  `.magi-appshell*` 全クラスの「**再定義そのもの**」を見る（値が Core と同じでも写しは写し）。
  そのため (h) が素通しする `var(--magi-*)` 記法も (i) では対象
- 対象外: `@media print` の中（印刷の出し分けはアプリの領域）／CSS変数の指定
  （`--app-shell-max` 等＝Core が用意したつまみを回す正規の手段）／
  主語がアプリ自身の要素（`.magi-appshell-focus-mode .app-palette` 等）
- 寸法・文字**以外**（`display: none` 等の出し分け）は WARN に留める
- 逃がし道: `TYPE_DEVIATIONS.md` に**当該セレクタ（クラス名）を書けば** WARN へ落ちる。
  ID=`UI-SHELL-CLASS` を `status=承認済` で載せれば全件まとめて逃がせる（(g)(h) と同じ作法）
- 負例試験11本（寸法・文字の再定義／print 除外／display は WARN／CSS変数は対象外／
  セレクタ記載での逃がし／前方一致の取り違え防止）

**採用アプリへの影響（実測）**: 利用者マスタ（再定義撤去済み）は **(i) 失格 0**。
一方 **職員マスタ 16件・勤務表 14件**が新たに (i) の失格に当たる（`.magi-appshell` の
`padding: 18px`、`.magi-appshell-nav-tab` の `min-height: 44px` 等の写し）。
この2本を v0.11.0 へ上げるときは **CSS 規則ごと削って Core の既定に任せる**か、
`TYPE_DEVIATIONS.md` に当該セレクタを記載すること。v0.10.0 の (h) は同じ記述を
WARN で通していたため、**(i) は方針の引き締め**にあたる。

## v0.10.0 (2026-07-30)

### フロントページ5層標準の寸法体系を「型」に昇格（基準実体＝職員マスタ）

社長裁定「余白・パネル配置を MAGI の型に昇格させろ」。実測の出所は
`magi-staff-directory` origin/main **267a671**（基準実体）と、本日それに寄せた
`magi-shift-v4` main **7164f79**。

> **採用アプリが v0.10.0 へ上げても見た目は変わらない。** 追加したのは「寸法の共通語彙」
> （トークン定義）であって、Core 部品の現行値は一切動かしていない。Core の規則のうち
> **既にトークンと同じ値だったもの**（`.magi-appshell` の `gap: 10px`）だけをトークン参照へ
> 置き換えた。ボタン・入力欄などは現行値がトークンと異なるため**あえて置換していない**
> （置換すると見た目が動くため。寄せるかは別途の裁定事項）。

**1. レイアウトトークンを `:root` に新設**（8テーマ共通・色ではなく寸法なのでテーマ別に分けない）

シェル `--magi-shell-padding: 18px` / `--magi-shell-padding-sm: 10px` / `--magi-panel-gap: 10px`、
ヘッダー `--magi-header-min-height: 88px` / `--magi-header-padding: 14px 18px`、
パネル `--magi-panel-padding: 18px 20px`、カード `--magi-card-padding: 15px` / `--magi-card-gap: 12px`、
ボタン `--magi-button-min-height: 44px` / `--magi-button-padding: 8px 14px` / `--magi-button-radius: 9px` /
`--magi-action-gap: 8px` / `--magi-button-icon-gap: 8px`、
入力欄 `--magi-field-min-height: 44px` / `--magi-field-padding: 9px 11px` / `--magi-field-radius: 9px` /
`--magi-field-label-gap: 7px`、セグメント `--magi-segment-padding|gap: 4px` / `--magi-segment-radius: 12px`、
`--magi-empty-padding: 42px 20px` / `--magi-list-item-padding: 12px`。
既存の `--app-shell-max` / `--card-radius` とは名前が衝突しない（すべて `--magi-` 接頭辞）。

**2. 横あふれ防止を `.magi-appshell-main` に標準装備（本日の指摘の根治）**

真因は「幅の広い業務コンテンツ（勤務表等）が親を押し広げ、ページ全体に横スクロールが出て
**パネル外の左右余白が食われる**」こと。`min-width: 0` に加えて `max-width: 100%` を持たせ、
さらに**直下の子にも `min-width: 0; max-width: 100%`** を効かせた（grid/flex の子は既定の
最小幅が中身の幅＝ここを 0 にしないと `overflow-x: auto` を付けても器が伸びる）。

> **規約: 横スクロールは業務コンテンツの内側（`overflow-x: auto` の器）に閉じ込める。
> シェルを押し広げない。**

**3. `MagiBusinessSummary` が列数を自分で決める**

`--magi-summary-columns` の設定漏れで5個目が溢れる事故（本日の実害）を構造的に潰した。
既定は**項目数から自動**、`columns` プロパティを明示した時だけそちらを優先（0項目でも1列以上）。

**4. CIガード原本に (h) シェルの枠検査を追加**

`.magi-appshell` / `-header` / `-main` を主語にした `padding` / `max-width` / `min-height` の
上書きを検出する。二段構え:

- **失格（exit 1）**: 枠を**壊す**値 — `max-width: none | 100vw | unset | initial`、
  シェル本体の `padding: 0`。`.v4-work-view { max-width: none; padding: 10px }` の再発を止める
- **警告**: それ以外の寸法上書き（トークンへ寄せる導線）。`var(--magi-*)` で書けば無警告
- `@media print` は対象外（印刷は枠を外すのが正しい）。シェルの「中身」への指定は自由
- 例外は既存の承認機構（`TYPE_DEVIATIONS.md` に ID=`UI-SHELL-FRAME` を `status=承認済`）
- **なぜ二段構えか**: 「上書きは一律失格」にすると、Core がシェルの枠（余白・最大幅）を
  自分では持たない現状では、**基準実体である職員マスタ自身が落ちる**（実測: 職員マスタ6件・
  勤務表8件が該当）。枠を壊す形だけを止め、寸法の指定は警告に留めた

**実測（4アプリ）**: 職員マスタ・勤務表・利用者マスタ・webapp-template とも (h) 失格 0。
職員マスタ6件・勤務表8件は「トークンへ寄せると揃う」警告として出る
（両repoは読むだけで変更していない）。

## v0.9.4 (2026-07-30)

### 書込検出が回り続ける事故を、参照の同一性で止める（社長承認）

`writeDetector={createHealthWriteDetector()}` と JSX の中で書くと、**毎レンダー別の関数**に
なる。`MagiStatusSummary` の検出 effect は `[writeDetector]` に依存しているため、
親が再レンダーするたびに検出が走り直し、`/api/health` を叩き続けていた。

- **`createHealthWriteDetector()` をモジュール内シングルトン化**。引数なし・観測先固定・
  インスタンス固有の状態ゼロなので、同じオブジェクトを返しても**意味論は変わらない**
  （信頼済み判定＝WeakSet メンバーシップも従来どおり）。
  `createEndpointWriteDetector`（@deprecated 別名）は委譲なので自動的に追従する
- **CIガード原本に禁止パターンを1行追加**: `writeDetector={create…WriteDetector(` の
  JSX 内生成を検出して exit 1（既存の文字列・コメント除去機構の上で行単位検出）。
  Core 側のシングルトン化で health 系は無害になったが、`createEnvWriteDetector` のように
  **呼ぶたび新しい関数を返す**ものは依然この形が事故になるため、作法として止める
- **開発時だけの助言**: 同一マウントで検出 effect が短時間に5回を超えて再実行されたら
  `console.warn` を1回だけ出す（「参照が毎レンダー変わっています。module 定数や useMemo へ」）。
  本番ビルドでは鳴らない（`process.env.NODE_ENV` で判定し、判定不能な環境では黙る）
- 試験11本: 「親を10回再レンダー → `/api/health` の fetch は1回」／シングルトン同一参照／
  禁止パターンの負例。**シングルトンを外すと当該4本が落ちる**ことを反証確認済み
- 実測: shift-v4・職員マスタ・利用者マスタ・webapp-template の4本とも新ルールで違反0
  （shift-v4 は退避済みの書き方だったため素通り）

## v0.9.3 (2026-07-30)

### 潜り込み表示を「型」で止める — CIガードに重なり順検査 (g) を新設（社長裁定）

v0.9.2 で Core 側の重なり順は揃えたが、**アプリが大きな z-index を書けばまた潜る**。
規約を文章で書くだけでは守られないので、CIガード原本（`ci/check-ui-guardrails.mjs`）で
機械的に止める。

- **アプリ側 CSS（`src` 配下の `.css` 全体）の `z-index` が 100
  （`--magi-z-app-sticky-max`）を超えたら exit 1**。違反箇所をファイル:行で示す
- 対象外: `@media print` の中／負値・`auto` 等のキーワード／CSSコメント内の記述
- **`var(--magi-z-*)` の参照は合法**（序列は Core が保証する）。
  独自変数は fallback の数値で判定し、判定できないものは WARN（目視確認を促す）
- 例外は既存の承認機構を使う: `TYPE_DEVIATIONS.md` に **ID=`UI-ZINDEX`** を
  `status=承認済` で記載すれば、失格ではなく WARN で通る
- 負例試験9本（101で落ちる／55・100は通る／print除外／トークン参照／承認で通る 等）

**実アプリでの実測（このガードで全て通ることを確認）**: shift-v4・職員マスタ・
利用者マスタ・webapp-template の4本すべて (g) OK。
ただし shift-v4 の `.v2-modal-overlay` は **z-index: 100 と上限ちょうど**で、
Core のポップアップ（200以上）はその上に出る＝アプリ自前のモーダルより Core の
メニューが前に来る。実害が出たらそのモーダルを Core の `DraggableModal`
（`--magi-z-modal`＝800）へ寄せるのが筋。

## v0.9.2 (2026-07-30)

### 社長の実機指摘2点（ロゴの大きさ／ポップアップの見切れ）

**1. ロゴの寸法と夜の白枠を「最新の職員マスタ」に統一**

社長指示「大きさがアプリによってバラバラ→最新版の職員マスタを採用」「夜は白い枠が目立つ」。
基準実体は `magi-staff-directory` origin/main **267a671**（2026-07-30 本番反映）。
あちらは Core のロゴ枠へ背景画像を重ねる実装でクラス名は違うため、**値を写した**。

| 項目 | 職員マスタの値 | Core v0.9.2 |
|---|---|---|
| 基準寸法 | `width: 148px; height: 74px` | `--magi-brand-logo-width: 148px`（`aspect-ratio: 2/1`） |
| ≤820px | `112px × 56px` | `--magi-brand-logo-width-md: 112px` |
| ≤640px | `104px × 52px` | `--magi-brand-logo-width-sm: 104px` |
| 夜の白枠 | `clip-path: inset(9% 5% round 6px)` | 同値（`[data-variant='night']` 限定） |

- **切り抜きは夜版だけ**にした（職員マスタと同じ扱い。昼版は白地に馴染むので原画のまま）。
  v0.8 の「常に切り抜く（440×200へ拡大）」方式は、職員マスタの見え方と揃わないため置換
- 既定幅が 112px → **148px** に変わる＝ロゴが大きくなる（全アプリ統一のための意図的変更）
- 職員マスタ側の夜の手当ては `clip-path`（角丸6px込み）**のみ**で、枠線・背景色の追加は無い。
  そのため Core でも border/background は足していない
- `npm run verify:brand` が寸法・切り抜き値の消失を検出する

**2. ポップアップの重なり順を標準化した**

社長指摘「メニュー、ダッシュボードが見切れてる」。原因は**帯の z-index**だった。
Core のナビ帯（35）・業務ダッシュボード帯（24）が、アプリの sticky なツールバー
（実測: shift-v4 は **60 / 64 / 80**）より下にあり、帯は z-index を持つと
**積み重ねの文脈**を作るため、その中で開くパネルがどれだけ大きな z を持っても
帯ごと下に潜る＝中身が分断されて見えていた。

- `design-system.css` に重なり順トークンを新設（`--magi-z-*`）:
  アプリ上限 100 < 業務帯 200 < ナビ 300 < ポップアップ 400 < ヘッダー由来 500 <
  浮遊 700 < モーダル 800 < 全画面 1000
- ナビ帯・業務帯・メニューパネル・ダッシュボード・状態の説明・版の詳細に適用
- **`.magi-modal-overlay` に `--magi-z-modal`（800）を明示**。従来 `z-index: auto` で、
  正の z を持つポップアップより下に描かれ得た（モーダルがメニューに隠れる潜在不具合）
- **規約: アプリの sticky 帯・独自ポップアップは `--magi-z-app-sticky-max`（100）未満にする。**
  JSDoc（BusinessNav / MagiBusinessSummary）にも明記した

## v0.9.1 (2026-07-30)

### 【致命】メニューから開いたモーダルを触るとメニューごと消える不具合を直した

`BusinessNav` の「外側を押したら閉じる」判定が、**portal で body 直下へ出るモーダルを
「外側」と誤認**していた。`menuChildren` に `ManualEntry` を置く標準構成では、
マニュアル本文をクリックした瞬間にメニューが閉じ、`ManualEntry` ごと unmount されて
**開いていたマニュアルが消える**（2026-07-30 shift-v4 実機で再現。職員マスタも同構成）。

- 判定を `src/ui/modalGuards.ts` に集約し、**開いているモーダル（`[role="dialog"][aria-modal="true"]`
  または `<dialog open>`）の内側で起きた操作は「外側」と見なさない**ようにした。
  `event.target` からの `closest` なので portal 先でも祖先を辿って拾える
- 同じ理由で **Esc も横取りしない**（モーダルが開いている間の Esc はモーダルを閉じる操作。
  奪うとメニューごと畳まれ、中の部品が消える）
- `DraggableModal` 系（`ConfirmModal` / `VersionHistoryModal`）・`ManualViewer` が全て救われる
- `aria-modal` を持たない popover（版チップのパネル等）は**従来どおり外側扱い**＝挙動不変
- `MagiAppShell` の focus 用 Esc 判定も同じ `modalGuards` へ寄せた（選択子の二重管理をやめる）

## v0.9.0 (2026-07-30)

### フロントページ5層標準のうち、Core側に無かった2点を入れた（社長裁定・基準実体＝職員マスタ）

**1. ヘッダーのバッジ行に規則を入れた**

右端寄せ・**原則1列（nowrap）**・大きさ統一。視覚順序は**右端から ①状態の説明 ②版
③その他バッジ**で、全体**3〜4個以内**（個数はアプリ側の約束）。

- 並び替えは **CSS の `order`** で行い、**DOM順も各部品のAPIも変えていない**。
  `MagiStatusSummary` は「バッジ群＋状態の説明」を1部品で持つため、そのままでは間に
  版チップを挟めない。クラスタを `display: contents` で親フレックスへ溶かし込み、
  badges=1 / 版=2 / 状態の説明=3 の順を与えた（order 未指定のその他バッジは 0＝最も左）
- ポップアップの位置基準は元々 `.magi-appshell-header-right`（クラスタは `position: static`）
  なので、`display: contents` にしても開き位置は変わらない
- 高さ・padding を 36px / 6px 10px に統一。**ヘッダー内に限定**した指定で、一覧や表で使う
  `StatusBadge` 本体の寸法は変えない
- 狭い画面（≤640px）ではバッジ群だけ折り返しを許す（横スクロールを作らないため）
- **既存アプリで見た目が変わるのは次の3点**＝標準としての意図的な変更:
  ①バッジの視覚順序 ②高さ・paddingの統一 ③**641px以上でバッジ群の折り返しが無くなる**
  （従来 `.magi-appshell-status-badges` は `flex-wrap: wrap` で2段に落ちていた。
  バッジが多いアプリでは1行に伸びるので、3〜4個以内の約束を守ること）

**2. 作業面の全画面表示（focusMode）**

- `MagiAppShell` に `focusMode?: boolean` / `onFocusModeChange?` を新設。true でヘッダー・
  ナビ、およびアプリが `.magi-appshell-focus-hidden` を付けた帯が隠れ、本文が全高になる
- **`FocusToggle` を新設**（「全画面」⇄「戻る」）。focus 中は `MagiAppShell` が画面右上に
  この戻り口を**必ず**出す＝アプリの配置に関係なく戻れる
- **Esc で必ず戻れる**。onFocusModeChange を実装していないアプリでも内部状態で戻る
  （介護現場で「戻れない画面」を作らないため）。ただし**モーダルが開いている間は
  Esc を横取りしない**（`[role="dialog"][aria-modal="true"]` があれば無視）
- **印刷は従来どおり**。focus の CSS は `@media screen` に閉じてあり、print CSS を邪魔しない

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
