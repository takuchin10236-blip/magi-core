import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MagiStatusSummary — 重要状態の表示・安全側集約・不明時展開（v0.5.1・AppShell / Sol R1 修正）。
 *
 * 最重要・P0対策の中核。設計の背骨は候補_core_AppShell部品設計.md §0:
 *   - 本番URL・書込ON/OFF は機械検出のみ（アプリは検出設定/検出関数を渡すだけ、値は渡せない）
 *   - 宣言できるのは許可リスト型 DeclarableState（業務本番化のみ）＝必ず「無検証」バッジ併記
 *   - fail-closed 集約: 安全に揃った時だけ1バッジへ畳み、不明・不整合・宣言存在なら個別展開
 *   - 誤申告（不正 kind）は表示せずエラー個別表示（拒否）
 *
 * Sol R1 修正（v0.5.1）:
 *   - R1-C2-PROP-TYPE-BYPASS: 公開 declaredStates を許可リスト型 readonly DeclarableState[] に。
 *     JS/外部境界用は unsafeDeclaredStates?: unknown[]（実行時検証してから合流）に分離。
 *   - R1-C2-DETECTOR-SELFDECLARATION: 書込検出器が Core提供ファクトリ由来（信頼済み）かを
 *     実行時判定し、生関数の結果は無検証併記＋集約除外にする（deriveStatusDisplay の writeTrusted）。
 *   - R1-C2-FAILCLOSED-EDGE: 書込結果は typeof boolean のみ受理（Boolean() 丸めを廃止）。
 *
 * 見た目は magi-resident-spine の StatusStrip/statusDisplay の2段レイアウトを踏襲
 *   （1段目=バッジ群、2段目=版チップ＋状態の説明 details）。表示原子は既存 StatusBadge。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { deriveStatusDisplay, detectRuntime, isTrustedWriteDetector, validateDeclaredState, } from './statusDetection';
function runtimeSurfaceLabel(surface) {
    if (surface === 'local')
        return 'このPC内';
    if (surface === 'preview')
        return 'レビュー環境';
    if (surface === 'production')
        return '本番環境';
    return '確認中';
}
export function MagiStatusSummary({ runtimeDetector, writeDetector, declaredStates, unsafeDeclaredStates, detailRows, className, }) {
    const detailsRef = useRef(null);
    // 型経路（declaredStates）は許可リスト型で縛られ済み＝そのまま信頼。
    // JS/外部境界経路（unsafeDeclaredStates）だけ実行時に許可リスト照合する。
    const declared = [...(declaredStates ?? [])];
    const rejected = [];
    for (const entry of (unsafeDeclaredStates ?? []).map(validateDeclaredState)) {
        if (entry.ok)
            declared.push(entry.state);
        else
            rejected.push({ reason: entry.reason, received: entry.received });
    }
    // 書込検出器が Core提供ファクトリ由来（信頼済み）か。生関数は無検証扱い（R1-C2）。
    const writeTrusted = writeDetector !== undefined && isTrustedWriteDetector(writeDetector);
    // ランタイム面は同期検出、書込は非同期になり得るので effect で解決する。
    const runtimeSurface = detectRuntime(runtimeDetector);
    const [writeState, setWriteState] = useState({
        writable: null,
        failed: false,
        ready: writeDetector === undefined ? true : false,
    });
    useEffect(() => {
        if (!writeDetector) {
            // 検出手段が無い＝書込状態は不明。安全に見せず「書込確認中」を出す。
            setWriteState({ writable: null, failed: false, ready: true });
            return;
        }
        let cancelled = false;
        setWriteState({ writable: null, failed: false, ready: false });
        Promise.resolve()
            .then(() => writeDetector())
            .then((value) => {
            if (cancelled)
                return;
            // boolean 以外（undefined/null/0/''/非boolean）は検出失敗へ落とす（Boolean 丸め廃止・R1-C2）。
            if (typeof value === 'boolean') {
                setWriteState({ writable: value, failed: false, ready: true });
            }
            else {
                setWriteState({ writable: null, failed: true, ready: true });
            }
        })
            .catch(() => {
            if (!cancelled)
                setWriteState({ writable: null, failed: true, ready: true });
        });
        return () => {
            cancelled = true;
        };
    }, [writeDetector]);
    const resolution = {
        healthReady: writeState.ready,
        runtimeSurface,
        writable: writeState.writable,
        writeDetectorFailed: writeState.failed,
        writeTrusted,
        declared,
        rejected,
    };
    const display = deriveStatusDisplay(resolution);
    useEffect(() => {
        const onDocClick = (event) => {
            const element = detailsRef.current;
            if (!element?.open)
                return;
            if (event.target instanceof Node && element.contains(event.target))
                return;
            element.open = false;
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
    return (_jsxs("div", { className: `magi-appshell-status-cluster${className ? ` ${className}` : ''}`, "data-status-mode": display.mode, "aria-label": "MAGI\u72B6\u614B", children: [_jsx("div", { className: "magi-appshell-status-badges", role: "status", "aria-live": "polite", children: display.visible.map((item) => (_jsxs("span", { className: "magi-appshell-status-item", children: [_jsx(StatusBadge, { className: "magi-appshell-status-badge", tone: item.tone, tooltip: item.detail, children: item.label }), item.unverified ? (_jsx(StatusBadge, { className: "magi-appshell-unverified", tone: "warn", tooltip: item.detail ? `無検証（根拠: ${item.detail}）` : '機械検証されていない自己申告です', children: "\u7121\u691C\u8A3C" })) : null] }, item.id))) }), _jsxs("details", { className: "magi-appshell-status-details", ref: detailsRef, children: [_jsxs("summary", { "aria-label": "\u72B6\u614B\u306E\u8A73\u3057\u3044\u8AAC\u660E\u3092\u8868\u793A", children: [_jsx(ShieldCheck, { size: 15, "aria-hidden": true }), _jsx("span", { children: "\u72B6\u614B\u306E\u8AAC\u660E" }), _jsx(ChevronDown, { size: 14, "aria-hidden": true })] }), _jsxs("div", { className: "magi-appshell-status-detail-body", role: "group", "aria-label": "\u72B6\u614B\u306E\u8AAC\u660E\u4E00\u89A7", children: [_jsx("button", { className: "magi-appshell-status-close", onClick: (event) => event.currentTarget.closest('details')?.removeAttribute('open'), type: "button", children: "\u9589\u3058\u308B" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u53CD\u6620\u5148" }), _jsx("dd", { children: runtimeSurfaceLabel(runtimeSurface) })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u672C\u756A\u53CD\u6620" }), _jsx("dd", { children: runtimeSurface === 'production' ? '済' : runtimeSurface === 'unknown' ? '確認中' : '未' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u66F8\u8FBC" }), _jsx("dd", { children: !writeState.ready ? '確認中' : writeState.failed || writeState.writable === null ? '確認中' : writeState.writable ? 'ON' : 'OFF' })] }), declared.map((state) => (_jsxs("div", { children: [_jsx("dt", { children: "\u696D\u52D9\u672C\u756A\u5316\uFF08\u7121\u691C\u8A3C\uFF09" }), _jsxs("dd", { children: [state.value ? '済（申告）' : '未（申告）', " / \u6839\u62E0: ", state.basis] })] }, `declared-${state.kind}`))), rejected.map((entry, index) => (_jsxs("div", { children: [_jsx("dt", { children: "\u7533\u544A\u30A8\u30E9\u30FC" }), _jsx("dd", { children: entry.reason })] }, `rejected-${index}`))), (detailRows ?? []).map((row) => (_jsxs("div", { children: [_jsx("dt", { children: row.label }), _jsx("dd", { children: row.value })] }, `row-${row.label}`)))] })] })] })] }));
}
//# sourceMappingURL=MagiStatusSummary.js.map