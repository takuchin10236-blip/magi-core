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
import { useState, type ReactNode } from 'react';
import { DraggableModal } from './DraggableModal';

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

export function ConfirmModal({
  title,
  subtitle,
  message,
  tone = 'info',
  cancelText = 'キャンセル',
  confirmText = 'OK',
  cancelTitle,
  confirmTitle,
  maxWidth = 'md',
  onConfirm,
  onClose,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  // トーン別カラー（CSS 変数経由でダーク両対応）
  const tones: Record<ConfirmTone, { color: string; bg: string; bgDark: string; titleClass: string }> = {
    info: {
      color: 'var(--color-info)',
      bg: '#eff6ff',
      bgDark: '#1e293b',
      titleClass: 'text-[var(--color-info)]',
    },
    warning: {
      color: 'var(--color-warning)',
      bg: '#fff7ed',
      bgDark: '#3f2a0c',
      titleClass: 'text-[var(--color-warning)]',
    },
    danger: {
      color: 'var(--color-danger)',
      bg: '#fef2f2',
      bgDark: '#3f1d1d',
      titleClass: 'text-[var(--color-danger)]',
    },
  };
  const t = tones[tone];

  return (
    <DraggableModal
      onClose={submitting ? () => undefined : onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      titleColorClass={t.titleClass}
    >
      <div
        className="rounded p-3 text-sm mb-3"
        style={{
          background: `light-dark(${t.bg}, ${t.bgDark})`,
          borderLeft: `4px solid ${t.color}`,
          color: 'var(--text-primary)',
        }}
      >
        {typeof message === 'string' ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
        ) : (
          message
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="themed-btn-secondary px-4 py-2 rounded text-sm"
          disabled={submitting}
          title={cancelTitle || cancelText}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 rounded font-bold text-sm text-[var(--primary-button-text)] disabled:opacity-50"
          style={{ background: t.color }}
          title={confirmTitle || confirmText}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" aria-hidden />
              処理中...
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </DraggableModal>
  );
}
