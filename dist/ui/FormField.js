import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FormField — ラベル・必須・補足・エラーを1つの器にまとめる原子部品（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * なぜ器を作るか:
 *   デジタル庁DS のフォーム作法（Label / RequirementBadge / SupportText / ErrorText）は
 *   「見た目」ではなく **id と aria の配線** に本体がある。各アプリが手で書くと必ず
 *   aria-describedby の付け忘れ・エラーの読み上げ漏れが起きる。器で機械的に配線する。
 *
 * 自動でやること（アプリが書き忘れられない）:
 *   - label と入力欄を htmlFor / id で結ぶ
 *   - 補足文とエラー文を aria-describedby へ自動連結
 *   - エラー時に aria-invalid を立て、エラー文を role="alert" で読み上げさせる
 *   - 必須を「※」等の記号でなく RequirementBadge の文字で示す（色・記号だけで伝えない）
 */
import { useId } from 'react';
export function RequirementBadge({ required }) {
    return (_jsx("span", { className: `magi-requirement-badge ${required ? 'is-required' : 'is-optional'}`, children: required ? '必須' : '任意' }));
}
export function FormField({ label, required = false, supportText, errorText, children, className, }) {
    const baseId = useId();
    const controlId = `${baseId}-control`;
    const supportId = `${baseId}-support`;
    const errorId = `${baseId}-error`;
    const hasError = Boolean(errorText);
    const describedBy = [supportText ? supportId : null, hasError ? errorId : null]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("div", { className: `magi-form-field${hasError ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`, children: [_jsxs("label", { className: "magi-form-label", htmlFor: controlId, children: [_jsx("span", { children: label }), _jsx(RequirementBadge, { required: required })] }), supportText ? (_jsx("p", { className: "magi-form-support", id: supportId, children: supportText })) : null, children({
                id: controlId,
                'aria-describedby': describedBy || undefined,
                'aria-invalid': hasError || undefined,
                'aria-required': required || undefined,
            }), hasError ? (_jsx("p", { className: "magi-form-error", id: errorId, role: "alert", children: errorText })) : null] }));
}
//# sourceMappingURL=FormField.js.map