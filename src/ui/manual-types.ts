/**
 * @magi/core/ui — 統一マニュアルビューアの型（器と中身の契約）
 *
 * 設計意図（2026-06-07 設計1枚）:
 *   各アプリでバラバラだったマニュアルUIを共通コアの正式機能として統一する。
 *   「器」＝共通コア（ManualViewer / ManualEntry）、「中身」＝各アプリが ManualContent を差し込む。
 *
 *   - 検索対象 ＝ 全 block の text/items ＋ section.title ＋ keywords
 *   - ハイライト ＝ ヒット語を <mark className="search-hit"> で包む（既存資産）
 *   - 既存 HelpModal の body:string[] は blocks:[{type:'paragraph'}] へ機械変換可（移行コスト小）
 *
 * 文体方針（中身を書く側へ）:
 *   中学生でもわかる水準・専門語には比喩(analogy)/注釈・ステップバイステップ(steps)。
 *   呼称は役職表記（「主任」「責任者」）を使う。実名・実ID・実メール・実scriptId は書かない
 *   （このリポジトリは PUBLIC のため）。
 */

/** マニュアル本文を構成する最小ブロック（段落・手順・注意枠・比喩枠・図の5種） */
export type ManualBlock =
  // 通常段落
  | { type: 'paragraph'; text: string }
  // 手順（1, 2, 3… の番号付きリスト）
  | { type: 'steps'; items: string[] }
  // コールアウト枠（info=情報／tip=ヒント／warning=注意）
  | { type: 'note'; tone: 'info' | 'tip' | 'warning'; text: string }
  // 比喩（「たとえば…」枠）
  | { type: 'analogy'; text: string }
  /**
   * 図（画面の写真・図解）。v0.21.0 で追加。
   *
   * 由来: 連絡ノート v0.10.0 で先に実装し、実地で形を確かめてから型へ昇格した
   *   （2026-08-20 社長指示「まず連絡ノートで作って、型への昇格を検討する」→ 2026-08-21 昇格）。
   *
   * 線引き:
   *   - `src` は**バンドラが解決したURL**を渡す（`import shot from './x.png'` の値、
   *     または `new URL('./x.png', import.meta.url).href`）。文字列のパス直書きはしない
   *     ＝画像を消した時にビルドで気づけるようにするため。
   *   - `alt` は必須。読み上げと、画像が出ない時の代わりの言葉になる。
   *   - `caption` も必須。図は本文から離れて読まれるので、図だけで意味が通る一言を書く。
   *   - 検索は `alt` と `caption` を見る（画像の中の文字は機械が読めない）。
   */
  | { type: 'image'; src: string; alt: string; caption: string };

/** マニュアルの 1 節（目次タブ1個ぶん） */
export type ManualSection = {
  /** アンカー & 目次ジャンプのキー（例 'what-is-this'） */
  id: string;
  /** 見出し & 目次ラベル（例 '① このアプリは何か'） */
  title: string;
  /** 目次ホバー用の一言（任意） */
  summary?: string;
  /** 本文（段落／手順／注意／比喩の組み合わせ） */
  blocks: ManualBlock[];
  /** 検索ヒット率を上げる別名（例 ['おむつ','パッド']）（任意） */
  keywords?: string[];
  /**
   * 既定で閉じておく節（任意・v0.20.0）。true にすると本文が折りたたまれ、
   * 見出しを押した時だけ開く（`<details>` で描く）。
   *
   * 用途: 業務に必須ではない読み物（コラム・由来話）をマニュアルの最後へ置き、
   *   読みたい人だけが開けるようにする。**業務手順の節には使わない**
   *   （手順を隠すと、読まれない手順ができる）。
   *
   * 検索したときは、その節が検索語を含む場合だけ自動で開く（ヒットが隠れないため）。
   * 目次から飛んだ時も自動で開く。
   */
  collapsed?: boolean;
};

/** 1アプリぶんのマニュアル全体（各アプリがこれを器に差し込む） */
export type ManualContent = {
  /** アプリ名（例 'おむつ在庫発注'） */
  appName: string;
  /** 版番号（任意・画面右上の版番号と一致させる） */
  appVersion?: string;
  /** サブ説明（任意） */
  subtitle?: string;
  /** 節の並び（この順で本文・目次に出る） */
  sections: ManualSection[];
};
