/**
 * 汎用確認モーダル (Step 16 / 2026-05-04 タチコマ)
 *
 * 設計意図:
 *   行動原則昇格候補「ブラウザネイティブダイアログ（window.confirm/prompt/alert）禁止」
 *   への対応。Webアプリ内の確認ダイアログは全て専用モーダルに統一。
 *
 *   - window.confirm() を撲滅するための汎用版
 *   - DraggableModal をベースにテーマ対応・ドラッグ可能
 *   - 用途: アンドゥ確認・下書き削除確認・編集ログ確認済みマーク 等
 *
 * 用途別の専用モーダル（情報量が多い／装飾が必要）:
 *   - BulkReadConfirmModal: 一括既読（重要度内訳・緊急含有警告）
 *   - DeleteModal: 物理削除（DELETE 入力 + 削除理由）
 *   - CancelModal: 取消（取消理由必須）
 *
 *   それ以外の単純な「Yes/No」確認は本コンポーネントで充足する。
 *
 * UI:
 *   - tone='warning'（警告系・橙）/ 'danger'（破壊系・赤）/ 'info'（情報系・青）
 *   - cancelText/confirmText を変えられる
 *   - submitting 中はスピナー表示・ボタン非活性
 */
import { type ReactNode } from 'react';
export type ConfirmTone = 'info' | 'warning' | 'danger';
type Props = {
    /** モーダルの見出し（左上） */
    title: string;
    /** 副題（任意、見出し下） */
    subtitle?: string;
    /** 本文（自由レイアウト可、文字列でも JSX でも可） */
    message: ReactNode;
    /** トーン（背景色とアクセント色を切替） */
    tone?: ConfirmTone;
    /** キャンセルボタンの文言（デフォルト「キャンセル」） */
    cancelText?: string;
    /** 確定ボタンの文言（デフォルト「OK」） */
    confirmText?: string;
    /** ホバー説明（キャンセルボタン） */
    cancelTitle?: string;
    /** ホバー説明（確定ボタン） */
    confirmTitle?: string;
    /** モーダル幅（DraggableModal の maxWidth に渡す） */
    maxWidth?: 'sm' | 'md' | 'lg';
    /** 確認後のアクション（async 可。完了するまで submitting=true） */
    onConfirm: () => void | Promise<void>;
    /** モーダルを閉じる（キャンセル含む） */
    onClose: () => void;
};
export declare function ConfirmModal({ title, subtitle, message, tone, cancelText, confirmText, cancelTitle, confirmTitle, maxWidth, onConfirm, onClose, }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=ConfirmModal.d.ts.map