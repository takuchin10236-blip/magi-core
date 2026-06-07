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
/** マニュアル本文を構成する最小ブロック（段落・手順・注意枠・比喩枠の4種） */
export type ManualBlock = {
    type: 'paragraph';
    text: string;
} | {
    type: 'steps';
    items: string[];
} | {
    type: 'note';
    tone: 'info' | 'tip' | 'warning';
    text: string;
} | {
    type: 'analogy';
    text: string;
};
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
//# sourceMappingURL=manual-types.d.ts.map