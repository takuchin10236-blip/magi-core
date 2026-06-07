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
export {};
//# sourceMappingURL=manual-types.js.map