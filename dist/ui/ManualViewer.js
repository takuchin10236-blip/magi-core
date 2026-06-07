import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @magi/core/ui — 統一マニュアルビューア本体（全画面ページ型・v0.3.1）
 *
 * 設計意図（2026-06-07 社長レビュー反映・全画面ページ化）:
 *   旧「右半分ドロワー」は背後のアプリが透けてヘッダが見切れる問題があったため、
 *   背後が一切透けない「完全な全画面1ページ」に作り直す。MAGIのWord書式に倣って
 *   きれいに揃える（紺見出し・■・コールアウト枠・読みやすい本文幅）。
 *
 *   構造（縦に積む）:
 *   ┌──────────────────────────────────────────────┐
 *   │ ヘッダバー（固定）: {appName} 操作マニュアル + 版 / 閉じる×  │
 *   ├──────────────────────────────────────────────┤
 *   │ 検索バー（固定）: 検索入力 + ヒット件数サマリ            │
 *   ├───────────────┬──────────────────────────────┤
 *   │ 左=目次サイドバー │ 右=本文（max-width 760px・MAGI書式）   │
 *   │ （縦リスト・active）│ 各節を縦に。見出し■紺・段落・手順・note・たとえ │
 *   └───────────────┴──────────────────────────────┘
 *
 *   - 全画面オーバーレイ: position:fixed; inset:0; 背景は不透明（テーマの --bg-app）。
 *   - 検索＋ヒット語ハイライト（<mark className="search-hit">・既存資産）は維持。
 *   - 目次クリックで本文の該当節へ scrollIntoView スムーズ。スクロール連動で active 更新。
 *   - 検索中も節を消さず全表示し、ヒット語をハイライト。0件時は manual-no-results。
 *
 * ガードレール:
 *   - ネイティブ confirm/alert/prompt は使わない（規約6）
 *   - Esc 閉じ・role="dialog" aria-modal・初期フォーカスを検索欄
 *   - 全画面のため暗幕クリック閉じは不要（閉じるボタンと Esc のみ）
 *   - lucide-react は peer optional のため使わず、アイコンはユニコード記号のフォールバック
 *   - 色・余白は design-system.css の manual-* CSS変数経由＝8テーマ自動追従（規約5）
 */
import { useEffect, useMemo, useRef, useState } from 'react';
/** 正規表現の特殊文字をエスケープ（検索語をそのまま正規表現に使うため） */
function escapeRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * テキストを検索語で分割し、ヒット部分を <mark className="search-hit"> で包む。
 * query が空なら素のテキストをそのまま返す（不要な span 生成を避ける）。
 */
function highlight(text, query) {
    const q = query.trim();
    if (!q)
        return text;
    // capture group 付き split＝区切り(ヒット語)も配列に残る。ヒット語だけ <mark> で包む。
    // g フラグ付き正規表現の .test() は lastIndex がずれるため使わず、小文字一致で判定する。
    const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    const lower = q.toLowerCase();
    const parts = text.split(re);
    return parts.map((part, i) => part.toLowerCase() === lower ? (_jsx("mark", { className: "search-hit", children: part }, i)) : (_jsx("span", { children: part }, i)));
}
/** 1 block 内に検索語が含まれるか（text または items のいずれか） */
function blockMatches(block, q) {
    const needle = q.toLowerCase();
    if (block.type === 'steps') {
        return block.items.some((item) => item.toLowerCase().includes(needle));
    }
    return block.text.toLowerCase().includes(needle);
}
/** 1 section 内に検索語が含まれるか（title / keywords / 各 block） */
function sectionMatches(section, q) {
    const needle = q.toLowerCase();
    if (section.title.toLowerCase().includes(needle))
        return true;
    if (section.keywords?.some((k) => k.toLowerCase().includes(needle)))
        return true;
    return section.blocks.some((b) => blockMatches(b, needle));
}
function focusableElements(root) {
    const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(root.querySelectorAll(selectors)).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}
/** 1 block をタイプ別に描画（検索語があればハイライト込み） */
function BlockView({ block, query }) {
    switch (block.type) {
        case 'paragraph':
            return _jsx("p", { className: "manual-paragraph", children: highlight(block.text, query) });
        case 'steps':
            return (_jsx("ol", { className: "manual-steps", children: block.items.map((item, i) => (_jsx("li", { children: highlight(item, query) }, i))) }));
        case 'note':
            return (_jsxs("div", { className: `manual-note manual-note-${block.tone}`, role: "note", children: [_jsx("span", { className: "manual-note-label", "aria-hidden": "true", children: block.tone === 'warning' ? '!' : block.tone === 'tip' ? '+' : 'i' }), _jsx("p", { children: highlight(block.text, query) })] }));
        case 'analogy':
            return (_jsxs("div", { className: "manual-analogy", children: [_jsx("span", { className: "manual-analogy-label", children: "\u305F\u3068\u3048\u3070" }), _jsx("p", { children: highlight(block.text, query) })] }));
        default:
            return null;
    }
}
export function ManualViewer({ content, onClose }) {
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState(content.sections[0]?.id ?? '');
    const dialogRef = useRef(null);
    const bodyRef = useRef(null);
    const searchInputRef = useRef(null);
    const sectionRefs = useRef({});
    // 目次クリック直後の一時的な「スクロール連動の上書き禁止」フラグ。
    // クリックでスムーズスクロール中は、途中で通過する節に active が奪われないようにする。
    const suppressScrollSync = useRef(false);
    // Esc で閉じる / Tab は全画面マニュアル内で循環させる
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab')
                return;
            const root = dialogRef.current;
            if (!root)
                return;
            const focusables = focusableElements(root);
            if (focusables.length === 0)
                return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);
    // 全画面表示中は背後のページをスクロールさせない
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);
    // 初期フォーカスを検索欄へ
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);
    const q = query.trim();
    // 検索ヒット集計（節を消さず、件数だけサマリに出す）
    const matchedSections = useMemo(() => (q ? content.sections.filter((s) => sectionMatches(s, q)) : content.sections), [content.sections, q]);
    const hasResults = !q || matchedSections.length > 0;
    // スクロール連動で目次の active を更新（本文の上端付近にある節を現在地とみなす）。
    // IntersectionObserver で各節の交差を監視し、最も上にある可視の節を active にする。
    useEffect(() => {
        const root = bodyRef.current;
        if (!root)
            return;
        const observer = new IntersectionObserver((entries) => {
            if (suppressScrollSync.current)
                return;
            // 可視（交差中）の節のうち、最も上（boundingClientRect.top が小さい）を現在地に。
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visible.length > 0) {
                const id = visible[0].target.getAttribute('data-section-id');
                if (id)
                    setActiveId(id);
            }
        }, {
            root,
            // 本文上端から 40% の帯に入った節を「現在地」とみなす（早めに切り替わって自然）。
            rootMargin: '0px 0px -55% 0px',
            threshold: 0,
        });
        const nodes = Object.values(sectionRefs.current).filter(Boolean);
        nodes.forEach((n) => observer.observe(n));
        return () => observer.disconnect();
        // sections の数が変われば再構築（検索中も節は消さないので通常は初回のみ）
    }, [content.sections]);
    // 目次クリック → 該当 section へスムーズスクロール（連動を一時停止して取り合いを防ぐ）
    const jumpTo = (id) => {
        setActiveId(id);
        suppressScrollSync.current = true;
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // スムーズスクロール完了の正確なイベントが無いため、概算で連動を再開する。
        window.setTimeout(() => {
            suppressScrollSync.current = false;
        }, 600);
    };
    return (_jsxs("div", { ref: dialogRef, className: "manual-fullpage", role: "dialog", "aria-modal": "true", "aria-label": `${content.appName} 操作マニュアル`, children: [_jsxs("header", { className: "manual-page-header", children: [_jsxs("div", { className: "manual-page-title", children: [_jsx("span", { className: "manual-page-eyebrow", "aria-hidden": "true", children: "\uD83D\uDCD6 \u64CD\u4F5C\u30DE\u30CB\u30E5\u30A2\u30EB" }), _jsxs("h1", { children: [content.appName, content.appVersion && (_jsx("span", { className: "manual-page-version", children: content.appVersion }))] }), content.subtitle && _jsx("p", { className: "manual-page-subtitle", children: content.subtitle })] }), _jsxs("button", { type: "button", className: "manual-page-close", onClick: onClose, "aria-label": "\u9589\u3058\u308B", title: "\u9589\u3058\u307E\u3059\uFF08Esc \u3067\u3082\u9589\u3058\u3089\u308C\u307E\u3059\uFF09", children: [_jsx("span", { "aria-hidden": "true", children: "\u00D7" }), _jsx("span", { className: "manual-page-close-text", children: "\u9589\u3058\u308B" })] })] }), _jsxs("div", { className: "manual-page-search", children: [_jsxs("div", { className: "manual-search-row", children: [_jsx("span", { className: "manual-search-icon", "aria-hidden": "true", children: "\uD83D\uDD0D" }), _jsx("input", { id: "manual-search-input", ref: searchInputRef, className: "manual-search-input", type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "\u77E5\u308A\u305F\u3044\u3053\u3068\u3092\u63A2\u3059\uFF08\u4F8B: \u767A\u6CE8 / \u5370\u5237 / \u5728\u5EAB\uFF09", "aria-label": "\u30DE\u30CB\u30E5\u30A2\u30EB\u5185\u3092\u691C\u7D22", "aria-describedby": "manual-search-summary" }), query && (_jsx("button", { type: "button", className: "manual-search-clear", onClick: () => {
                                    setQuery('');
                                    searchInputRef.current?.focus();
                                }, "aria-label": "\u691C\u7D22\u3092\u30AF\u30EA\u30A2", title: "\u691C\u7D22\u3092\u30AF\u30EA\u30A2\u3057\u307E\u3059", children: "\u00D7" }))] }), _jsx("p", { id: "manual-search-summary", className: "manual-search-summary", "aria-live": "polite", children: q
                            ? `「${q}」に当てはまる項目: ${matchedSections.length} 件`
                            : `全 ${content.sections.length} 項目` })] }), _jsxs("div", { className: "manual-page-body", children: [_jsxs("nav", { className: "manual-toc", "aria-label": "\u76EE\u6B21", children: [_jsx("p", { className: "manual-toc-heading", children: "\u76EE\u6B21" }), _jsx("ul", { className: "manual-toc-list", children: content.sections.map((s) => (_jsx("li", { children: _jsx("button", { type: "button", className: `manual-toc-item${activeId === s.id ? ' active' : ''}`, onClick: () => jumpTo(s.id), title: s.summary || s.title, "aria-current": activeId === s.id ? 'true' : undefined, children: s.title }) }, s.id))) })] }), _jsx("div", { className: "manual-body", ref: bodyRef, children: _jsx("div", { className: "manual-body-inner", children: hasResults ? (content.sections.map((s) => (_jsxs("section", { id: `manual-section-${s.id}`, "data-section-id": s.id, ref: (el) => {
                                    sectionRefs.current[s.id] = el;
                                }, className: "manual-section", children: [_jsx("h3", { children: highlight(s.title, q) }), s.blocks.map((block, i) => (_jsx(BlockView, { block: block, query: q }, i)))] }, s.id)))) : (_jsxs("div", { className: "manual-no-results", role: "status", children: [_jsx("h3", { children: "\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" }), _jsxs("p", { children: ["\u300C", q, "\u300D\u306B\u5F53\u3066\u306F\u307E\u308B\u9805\u76EE\u306F\u3042\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u5225\u306E\u8A00\u8449\uFF08\u4F8B: \u3072\u3089\u304C\u306A\u3001\u77ED\u3044\u5358\u8A9E\uFF09\u3067 \u63A2\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002"] })] })) }) })] })] }));
}
//# sourceMappingURL=ManualViewer.js.map