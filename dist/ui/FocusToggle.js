import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FocusToggle — 作業面だけを全面表示にする切替ボタン（v0.9）。
 *
 * 社長要望「作業画面だけを全面表示に切り替える」の入口。MagiAppShell の focusMode と対で使う。
 *   非focus時「全画面」／focus時「戻る」の1ボタン。押すたびに反転する。
 *
 * 戻れなくしないための決まり（介護現場で詰まないこと）:
 *   - focus 中は MagiAppShell が**この部品を画面右上に必ず出す**（アプリ側の配置に依存しない）
 *   - Esc でも必ず戻れる（MagiAppShell 側で受ける）
 *   この2つは MagiAppShell の責務。ここは見た目と押下だけを持つ。
 */
import { Maximize2, Minimize2 } from 'lucide-react';
export function FocusToggle({ focusMode, onFocusModeChange, enterLabel = '全画面', exitLabel = '戻る', className, }) {
    const Icon = focusMode ? Minimize2 : Maximize2;
    const label = focusMode ? exitLabel : enterLabel;
    return (_jsxs("button", { "aria-pressed": focusMode, className: `magi-focus-toggle${className ? ` ${className}` : ''}`, onClick: () => onFocusModeChange(!focusMode), title: focusMode ? '全画面表示をやめて元の画面に戻ります（Escキーでも戻れます）' : '作業画面だけを全面に表示します', type: "button", children: [_jsx(Icon, { size: 16, "aria-hidden": "true" }), _jsx("span", { children: label })] }));
}
//# sourceMappingURL=FocusToggle.js.map