import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useState } from 'react';
import { DraggableModal } from './DraggableModal';
export function ConfirmModal({ title, subtitle, message, tone = 'info', cancelText = 'キャンセル', confirmText = 'OK', cancelTitle, confirmTitle, maxWidth = 'md', onConfirm, onClose, }) {
    const [submitting, setSubmitting] = useState(false);
    const submit = async () => {
        setSubmitting(true);
        try {
            await onConfirm();
        }
        finally {
            setSubmitting(false);
        }
    };
    // トーン別カラー（CSS 変数経由でダーク両対応）
    const tones = {
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
    return (_jsxs(DraggableModal, { onClose: submitting ? () => undefined : onClose, title: title, subtitle: subtitle, maxWidth: maxWidth, titleColorClass: t.titleClass, children: [_jsx("div", { className: "rounded p-3 text-sm mb-3", style: {
                    background: `light-dark(${t.bg}, ${t.bgDark})`,
                    borderLeft: `4px solid ${t.color}`,
                    color: 'var(--text-primary)',
                }, children: typeof message === 'string' ? (_jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: message })) : (message) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "themed-btn-secondary px-4 py-2 rounded text-sm", disabled: submitting, title: cancelTitle || cancelText, children: cancelText }), _jsx("button", { type: "button", onClick: submit, disabled: submitting, className: "px-4 py-2 rounded font-bold text-sm text-[var(--primary-button-text)] disabled:opacity-50", style: { background: t.color }, title: confirmTitle || confirmText, children: submitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "btn-spinner", "aria-hidden": true }), "\u51E6\u7406\u4E2D..."] })) : (confirmText) })] })] }));
}
//# sourceMappingURL=ConfirmModal.js.map