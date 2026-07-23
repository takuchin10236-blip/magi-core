import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MagiVersionChip — 短い版表示＋クリックでビルド詳細（v0.5・AppShell）。
 *
 * magi-resident-spine src/lib/version.ts の思想（版・時刻をハードコードせず単一ソースから）を
 *   踏襲し、core 版は値を持たずアプリが version / buildTime / details を props で渡す。
 *   整形は versionFormat.ts（単一の整形ロジック）に集約する。
 */
import { useEffect, useRef, useState } from 'react';
import { formatBuildTime, formatReleaseLabel } from './versionFormat';
export function MagiVersionChip({ version, buildTime = '', details, className }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const label = formatReleaseLabel(version, buildTime);
    const builtAtText = formatBuildTime(buildTime);
    useEffect(() => {
        if (!open)
            return;
        const onPointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target))
                setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);
    return (_jsxs("div", { className: `magi-appshell-version${className ? ` ${className}` : ''}`, ref: rootRef, children: [_jsx("button", { "aria-expanded": open, "aria-haspopup": "dialog", "aria-label": `版 ${label}。詳細を開きます`, className: "magi-appshell-version-chip", onClick: () => setOpen((value) => !value), type: "button", children: label }), open ? (_jsx("div", { className: "magi-appshell-version-panel", role: "dialog", "aria-label": "\u7248\u306E\u8A73\u7D30", children: _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u7248" }), _jsx("dd", { children: version.startsWith('v') ? version : `v${version}` })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u30D3\u30EB\u30C9\u6642\u523B" }), _jsx("dd", { children: builtAtText || '確認中' })] }), Object.entries(details ?? {}).map(([key, value]) => (_jsxs("div", { children: [_jsx("dt", { children: key }), _jsx("dd", { children: value })] }, key)))] }) })) : null] }));
}
//# sourceMappingURL=MagiVersionChip.js.map