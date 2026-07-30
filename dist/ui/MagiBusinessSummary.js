import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MagiBusinessSummary — 業務状況の要約パネル（v0.5・「現在の状況」＋ダッシュボード）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 原本: 利用者マスタ magi-resident-spine の `.business-summary`（自前実装）を一般化。
 *   2026-07-26 社長裁定「利用者マスタの形を正とする／枠（パネルの形）は揃え、
 *   ダッシュボードの内容と各項目はアプリごとに変更してよい」に基づき Core 部品化した。
 *
 * 何を Core が持ち、何をアプリが決めるか:
 *   - Core が持つ＝**器**（ラベル＋チップ列＋開閉式ダッシュボード、寸法・配色・余白・挙動）
 *   - アプリが決める＝**中身**（項目の数・ラベル・値・押した時の動き・説明文）
 *   これにより「見た目は全アプリで揃い、業務ごとの中身は自由」を両立する。
 *   各アプリが自前でパネルを作ると必ず drift する（職員マスタのUI検査459行コピーが実例）。
 *
 * 重なり順の規約（v0.9.2）: 帯は `--magi-z-business-band`、開いたダッシュボードは
 *   `--magi-z-popover`。**アプリの sticky 帯は `--magi-z-app-sticky-max`（100）未満にすること。**
 *   帯ごと下に潜るとダッシュボードが分断されて見える（2026-07-30 社長の実機指摘）。
 *
 * 使い方:
 *   <MagiBusinessSummary
 *     ariaLabel="職員マスタの状況"
 *     items={[
 *       { key: 'active', label: '在籍', value: 7, title: '在籍中の職員数', onSelect: () => ...,
 *         description: '在籍中の職員数' },
 *       { key: 'read', label: '読取', value: '04:47', description: '最後に読み取った時刻' },
 *     ]}
 *     storageKey="magi-staff-master.dashboard-open.v1"
 *   />
 *
 * 挙動:
 *   - onSelect のある項目は button（押せる）、無い項目は静的表示になる。
 *   - ダッシュボード（details）は外側クリック・Escape でも閉じる（共有PC・介護現場で
 *     「閉じられない」と感じさせないため。MagiStatusSummary と同じ流儀）。
 *   - storageKey を渡すと開閉状態を localStorage に覚える（渡さなければ覚えない）。
 *   - description を持つ項目だけがダッシュボードに並ぶ。1件も無ければダッシュボードは出さない。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
export function MagiBusinessSummary({ items, label = '現在の状況', detailsLabel = 'ダッシュボード', ariaLabel, storageKey, className, }) {
    const detailsRef = useRef(null);
    const [open, setOpen] = useState(() => {
        if (!storageKey)
            return false;
        try {
            return window.localStorage.getItem(storageKey) === 'true';
        }
        catch {
            return false; // localStorage を使えないブラウザでも表示自体は続ける
        }
    });
    // 外側クリック / Escape で閉じる。ネイティブ details は summary 再クリックでしか
    // 閉じないため、共有PCでは「閉じられない」と感じやすい（MagiStatusSummary と同じ対策）。
    useEffect(() => {
        const closeIfOpen = () => {
            const element = detailsRef.current;
            if (element?.open)
                element.open = false;
        };
        const onDocClick = (event) => {
            const element = detailsRef.current;
            if (!element?.open)
                return;
            if (event.target instanceof Node && element.contains(event.target))
                return;
            closeIfOpen();
        };
        const onKeyDown = (event) => {
            if (event.key !== 'Escape' || !detailsRef.current?.open)
                return;
            detailsRef.current.open = false;
            detailsRef.current.querySelector('summary')?.focus();
        };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);
    const describedItems = items.filter((item) => item.description !== undefined);
    return (_jsxs("section", { "aria-label": ariaLabel, className: `magi-business-summary themed-card no-print${className ? ` ${className}` : ''}`, children: [_jsx("span", { className: "magi-business-summary-label", children: label }), _jsx("div", { className: "magi-business-summary-chips", 
                // 列数は項目数に追随させる（4項目固定にしない＝アプリごとに項目数を変えられる）。
                style: { ['--magi-summary-columns']: String(Math.max(items.length, 1)) }, children: items.map((item) => item.onSelect ? (_jsxs("button", { disabled: item.disabled, onClick: item.onSelect, title: item.title, type: "button", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.key)) : (_jsxs("div", { className: "magi-business-summary-item", title: item.title, children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.key))) }), describedItems.length > 0 ? (_jsxs("details", { className: "magi-business-summary-details", onToggle: (event) => {
                    const next = event.currentTarget.open;
                    setOpen(next);
                    if (!storageKey)
                        return;
                    try {
                        window.localStorage.setItem(storageKey, String(next));
                    }
                    catch {
                        // 保存できないブラウザでも開閉そのものは継続する
                    }
                }, open: open, ref: detailsRef, children: [_jsxs("summary", { children: [detailsLabel, _jsx(ChevronDown, { size: 14, "aria-hidden": true })] }), _jsx("div", { className: "magi-business-summary-panel", children: describedItems.map((item) => (_jsxs("p", { children: [_jsx("strong", { children: item.label }), _jsx("span", { children: item.description })] }, item.key))) })] })) : null] }));
}
//# sourceMappingURL=MagiBusinessSummary.js.map