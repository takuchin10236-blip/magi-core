import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Operator — 操作者チップ＋選択モーダル（v0.7・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 何のための部品か:
 *   施設の端末は職員が共通アカウントで使うため、ログイン情報からは
 *   「いま操作しているのが誰か」が分からない。保存の前に本人が名乗り、
 *   その名前を記録へ残す——これが操作者。16番§3.5「すべての操作はアプリを
 *   通す。ログを残す」を成立させている部品である。
 *
 * なぜ core に置くか（2026-07-28 実測）:
 *   同じ `OperatorSelectModal.tsx` が **8アプリ**（adl / seat-chart / staff-master /
 *   floor-calendar / staff-tasks / survey / 2f-inventory / cushion）に手写しで存在した。
 *   `01_UI標準` の型v1.6では既に「必須型」と決まっているのに core 実装が無く、
 *   文言と見た目が枝分かれし始めていた。1か所に集約して枝分かれを止める。
 *
 * 型として守ること:
 *   1. **本人認証ではないと画面に明示する**（共通ログイン＋自己申告の限界を隠さない）
 *   2. select 要素を使わない（型違反。一覧から押して選ぶ）
 *   3. 未選択でも閲覧・印刷はできる。止めるのは保存・取消だけ
 *   4. チップは未選択が一目で分かる見た目にする（色だけに頼らず文字でも示す）
 */
import { useLayoutEffect, useRef } from 'react';
import { UserRound } from 'lucide-react';
import { DraggableModal } from './DraggableModal';
import { domFitTarget, fitOperatorLabel } from './operatorFit';
/* 固定幅チップ内でラベルを収める算法は `operatorFit.ts`（DOM 無しで試験できるように切り出した）。
   2026-09-05: 下限10pxで止めていたため17字の名前が枠外へ出て切れていた——下限7px＋字間詰めで入れ切る。 */
export function OperatorChip({ operatorName, onClick, unsetLabel = '未選択', fixedWidth, className }) {
    const isSet = Boolean(operatorName);
    const fixed = fixedWidth !== undefined;
    const labelRef = useRef(null);
    useLayoutEffect(() => {
        if (!fixed)
            return;
        const span = labelRef.current;
        if (!span)
            return;
        fitOperatorLabel(domFitTarget(span));
    }, [fixed, operatorName]);
    const label = fixed ? (operatorName ?? '操作者') : `操作者: ${operatorName ?? unsetLabel}`;
    return (_jsxs("button", { className: `operator-chip ${isSet ? 'is-set' : 'is-unset'}${fixed ? ' is-fixed' : ''}${className ? ` ${className}` : ''}`, onClick: onClick, style: fixed && fixedWidth !== true ? { width: `${fixedWidth}px` } : undefined, title: "\u4FDD\u5B58\u306E\u8A18\u9332\u306B\u6B8B\u308B\u64CD\u4F5C\u8005\u3067\u3059\u3002\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u672C\u4EBA\u306E\u540D\u524D\u3092\u9078\u3073\u307E\u3059\u3002\u95B2\u89A7\u30FB\u5370\u5237\u3060\u3051\u306A\u3089\u9078\u629E\u4E0D\u8981\u3067\u3059\u3002", type: "button", children: [_jsx(UserRound, { size: 16, "aria-hidden": true }), _jsx("span", { className: "operator-chip-label", ref: labelRef, children: label })] }));
}
export function OperatorSelectModal({ open, onClose, onSelect, staff, selectedOperatorId, emptyMessage = '在籍職員の名簿を確認できません。更新してから管理者へ確認してください。', }) {
    if (!open)
        return null;
    return (_jsx(DraggableModal, { maxWidth: "md", onClose: onClose, subtitle: "\u4FDD\u5B58\u306E\u8A18\u9332\u306B\u6B8B\u308A\u307E\u3059", title: "\u64CD\u4F5C\u8005\u3092\u9078\u629E", children: _jsxs("div", { className: "operator-select-body", children: [_jsx("p", { className: "operator-select-note operator-select-disclaimer", role: "note", children: "\u3053\u308C\u306F\u672C\u4EBA\u8A8D\u8A3C\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u5171\u6709\u7AEF\u672B\u3067\u64CD\u4F5C\u3057\u305F\u672C\u4EBA\u304C\u3001\u81EA\u5206\u306E\u540D\u524D\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002" }), staff.length === 0 ? (_jsx("p", { className: "operator-select-note", children: emptyMessage })) : (_jsx("div", { "aria-label": "\u5728\u7C4D\u8077\u54E1\u306E\u4E00\u89A7", className: "operator-select-grid", role: "listbox", children: staff.map((member) => (_jsx("button", { "aria-selected": member.id === selectedOperatorId, className: `operator-select-item ${member.id === selectedOperatorId ? 'is-current' : ''}`, onClick: () => {
                            onSelect(member.id);
                            onClose();
                        }, role: "option", type: "button", children: _jsx("span", { className: "operator-select-name", children: member.name }) }, member.id))) })), _jsx("p", { className: "operator-select-note", children: "\u95B2\u89A7\u3068\u5370\u5237\u306F\u672A\u9078\u629E\u3067\u3082\u4F7F\u3048\u307E\u3059\u3002\u4FDD\u5B58\u30FB\u53D6\u6D88\u3067\u306F\u9078\u629E\u304C\u5FC5\u9808\u3067\u3059\u3002" })] }) }));
}
//# sourceMappingURL=Operator.js.map