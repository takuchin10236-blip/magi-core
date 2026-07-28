import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * VersionHistoryModal — 更新履歴を開くモーダル（v0.6・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 2026-07-28 社長裁定: 更新履歴は画面本文に常設せず、メニュー最下段から開く。
 *   本文に置くと毎回目に入る割に、実際に見る頻度は最も低いため。
 *
 * 履歴の実体は各アプリの `src/lib/changelog.ts`（金型v1.2の様式）。
 * ここは「器」だけを持ち、値はアプリが entries で渡す（coreは値を持たない）。
 */
import { DraggableModal } from './DraggableModal';
export function VersionHistoryModal({ entries, onClose, title = 'これまでの更新履歴', subtitle, }) {
    return (_jsx(DraggableModal, { maxWidth: "lg", onClose: onClose, subtitle: subtitle, title: title, children: _jsx("ol", { className: "magi-version-history", children: entries.map((entry, index) => (_jsxs("li", { className: `magi-version-history-item${index === 0 ? ' is-latest' : ''}`, children: [_jsxs("div", { className: "magi-version-history-head", children: [_jsxs("span", { className: "magi-version-history-version", children: ["v", entry.version] }), _jsx("span", { className: "magi-version-history-date", children: entry.date }), index === 0 ? _jsx("span", { className: "magi-version-history-latest", children: "\u6700\u65B0" }) : null] }), _jsx("p", { className: "magi-version-history-summary", children: entry.summary })] }, entry.version))) }) }));
}
//# sourceMappingURL=VersionHistoryModal.js.map