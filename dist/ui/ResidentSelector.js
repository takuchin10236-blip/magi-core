import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState, } from 'react';
function searchableText(resident) {
    return [resident.residentId, resident.name, resident.kana, resident.room]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('ja-JP');
}
function isCreateCandidate(resident) {
    return (isFiveDigitResidentId(resident) &&
        resident.createAllowed === true &&
        resident.episodeOpen === true);
}
function isFiveDigitResidentId(resident) {
    return /^\d{5}$/.test(resident.residentId);
}
function residentKey(resident, index) {
    return `${resident.residentId}:${resident.episodeId ?? ''}:${index}`;
}
export function ResidentSelector(props) {
    const { value, onSelect, onClear, loading, error, onRetry, onLoadError, searchLabel = '利用者を検索', emptyMessage = '該当する利用者はいません。', className, disabled = false, } = props;
    const listboxId = useId();
    const [query, setQuery] = useState('');
    const [selectedTabId, setSelectedTabId] = useState('');
    const [retryKey, setRetryKey] = useState(0);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const [loadedCreateData, setLoadedCreateData] = useState();
    const [loadedSearchData, setLoadedSearchData] = useState();
    const optionRefs = useRef([]);
    useEffect(() => {
        if (props.data !== undefined) {
            setInternalLoading(false);
            setInternalError(null);
            return;
        }
        if (props.loadData === undefined)
            return;
        let active = true;
        setInternalLoading(true);
        setInternalError(null);
        if (props.mode === 'create') {
            props
                .loadData({ mode: 'create' })
                .then((nextData) => {
                if (active)
                    setLoadedCreateData(nextData);
            })
                .catch((loadError) => {
                if (!active)
                    return;
                setLoadedCreateData(undefined);
                setInternalError('利用者一覧を読み込めませんでした。');
                onLoadError?.(loadError);
            })
                .finally(() => {
                if (active)
                    setInternalLoading(false);
            });
        }
        else {
            props
                .loadData({ mode: 'search' })
                .then((nextData) => {
                if (active)
                    setLoadedSearchData(nextData);
            })
                .catch((loadError) => {
                if (!active)
                    return;
                setLoadedSearchData(undefined);
                setInternalError('利用者一覧を読み込めませんでした。');
                onLoadError?.(loadError);
            })
                .finally(() => {
                if (active)
                    setInternalLoading(false);
            });
        }
        return () => {
            active = false;
        };
    }, [onLoadError, props.data, props.loadData, props.mode, retryKey]);
    const createData = props.mode === 'create' ? (props.data ?? loadedCreateData) : undefined;
    const searchData = props.mode === 'search' ? (props.data ?? loadedSearchData) : undefined;
    const tabs = searchData?.tabs ?? [];
    useEffect(() => {
        if (props.mode !== 'search') {
            setSelectedTabId('');
            return;
        }
        if (tabs.length === 0) {
            setSelectedTabId('');
            return;
        }
        if (!tabs.some((tab) => tab.id === selectedTabId)) {
            setSelectedTabId(tabs[0]?.id ?? '');
        }
    }, [props.mode, selectedTabId, tabs]);
    const candidates = useMemo(() => {
        const source = props.mode === 'create'
            ? (createData?.residents ?? []).filter(isCreateCandidate)
            : (tabs.find((tab) => tab.id === selectedTabId)?.residents ?? []).filter(isFiveDigitResidentId);
        const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP');
        if (!normalizedQuery)
            return source;
        return source.filter((resident) => searchableText(resident).includes(normalizedQuery));
    }, [createData?.residents, props.mode, query, selectedTabId, tabs]);
    optionRefs.current.length = candidates.length;
    const effectiveLoading = loading ?? internalLoading;
    const effectiveError = error ?? internalError;
    const canRetry = Boolean(onRetry || props.loadData);
    const activeTabIndex = tabs.findIndex((tab) => tab.id === selectedTabId);
    const tabPanelId = `${listboxId}-panel`;
    const retry = () => {
        onRetry?.();
        if (props.loadData)
            setRetryKey((current) => current + 1);
    };
    const focusOption = (index) => {
        optionRefs.current[index]?.focus();
    };
    const onSearchKeyDown = (event) => {
        if (disabled || effectiveLoading || effectiveError || candidates.length === 0)
            return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusOption(0);
        }
        else if (event.key === 'Enter') {
            event.preventDefault();
            const first = candidates[0];
            if (first)
                onSelect(first);
        }
    };
    const onOptionKeyDown = (event, index) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusOption(Math.min(index + 1, candidates.length - 1));
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (index === 0) {
                const searchInput = event.currentTarget
                    .closest('.magi-resident-selector')
                    ?.querySelector('.magi-resident-selector__search');
                searchInput?.focus();
            }
            else {
                focusOption(index - 1);
            }
        }
    };
    const onTabKeyDown = (event, index) => {
        if (tabs.length < 2)
            return;
        let nextIndex;
        if (event.key === 'ArrowRight')
            nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft')
            nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (nextIndex === undefined)
            return;
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        if (!nextTab)
            return;
        setSelectedTabId(nextTab.id);
        const tabList = event.currentTarget.parentElement;
        tabList?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
    };
    return (_jsxs("section", { className: `magi-resident-selector${className ? ` ${className}` : ''}`, "aria-label": props.mode === 'create' ? '記録対象の利用者選択' : '利用者検索', "aria-busy": effectiveLoading, children: [value ? (_jsxs("div", { className: "magi-resident-selector__selected", "aria-label": "\u9078\u629E\u4E2D\u306E\u5229\u7528\u8005", children: [_jsxs("div", { children: [_jsx("span", { className: "magi-resident-selector__selected-label", children: "\u9078\u629E\u4E2D" }), _jsx("strong", { children: value.name }), _jsxs("span", { className: "magi-resident-selector__id", children: ["ID ", value.residentId] })] }), onClear ? (_jsx("button", { type: "button", className: "themed-btn-secondary magi-resident-selector__clear", onClick: onClear, disabled: disabled, "aria-label": `${value.name}の選択を解除`, children: "\u9078\u629E\u3092\u89E3\u9664" })) : null] })) : null, props.mode === 'search' && tabs.length > 0 ? (_jsx("div", { className: "magi-resident-selector__tabs", role: "tablist", "aria-label": "\u691C\u7D22\u7BC4\u56F2", children: tabs.map((tab, index) => (_jsx("button", { id: `${listboxId}-tab-${index}`, type: "button", role: "tab", "aria-controls": tabPanelId, "aria-selected": tab.id === selectedTabId, tabIndex: tab.id === selectedTabId ? 0 : -1, className: "magi-resident-selector__tab", onClick: () => setSelectedTabId(tab.id), onKeyDown: (event) => onTabKeyDown(event, index), disabled: disabled || effectiveLoading || Boolean(effectiveError), children: tab.label }, tab.id))) })) : null, _jsxs("label", { className: "magi-resident-selector__search-label", children: [_jsx("span", { children: searchLabel }), _jsx("input", { className: "themed-input magi-resident-selector__search", type: "search", value: query, onChange: (event) => setQuery(event.target.value), onKeyDown: onSearchKeyDown, placeholder: "\u6C0F\u540D\u30FB\u304B\u306A\u30FB\u5C45\u5BA4\u30FB5\u6841ID", disabled: disabled || effectiveLoading || Boolean(effectiveError), "aria-controls": listboxId, autoComplete: "off" })] }), _jsxs("div", { className: "magi-resident-selector__state", "aria-live": "polite", children: [effectiveLoading ? _jsx("p", { children: "\u5229\u7528\u8005\u4E00\u89A7\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059\u2026" }) : null, !effectiveLoading && effectiveError ? (_jsxs("div", { className: "magi-resident-selector__error", role: "alert", children: [_jsx("p", { children: effectiveError }), _jsx("p", { children: "\u65B0\u3057\u3044\u5229\u7528\u8005\u306F\u9078\u3079\u307E\u305B\u3093\u3002\u6642\u9593\u3092\u304A\u3044\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }), canRetry ? (_jsx("button", { type: "button", className: "themed-btn-secondary", onClick: retry, children: "\u518D\u8A66\u884C" })) : null] })) : null] }), !effectiveLoading && !effectiveError ? (_jsx("div", { id: tabPanelId, role: props.mode === 'search' && tabs.length > 0 ? 'tabpanel' : undefined, "aria-labelledby": props.mode === 'search' && activeTabIndex >= 0
                    ? `${listboxId}-tab-${activeTabIndex}`
                    : undefined, children: _jsx("div", { id: listboxId, className: "magi-resident-selector__list", role: "listbox", children: candidates.length === 0 ? (_jsx("p", { className: "magi-resident-selector__empty", children: emptyMessage })) : (candidates.map((resident, index) => (_jsxs("button", { ref: (element) => {
                            optionRefs.current[index] = element;
                        }, type: "button", role: "option", "aria-selected": value?.residentId === resident.residentId, className: "magi-resident-selector__option", onClick: () => onSelect(resident), onKeyDown: (event) => onOptionKeyDown(event, index), disabled: disabled, children: [_jsxs("span", { className: "magi-resident-selector__identity", children: [_jsx("strong", { children: resident.name }), resident.kana ? _jsx("span", { children: resident.kana }) : null] }), _jsxs("span", { className: "magi-resident-selector__details", children: [_jsxs("span", { className: "magi-resident-selector__id", children: ["ID ", resident.residentId] }), resident.room ? _jsxs("span", { children: ["\u5C45\u5BA4 ", resident.room] }) : null, resident.episodeId ? (_jsxs("span", { children: ["\u30A8\u30D4\u30BD\u30FC\u30C9 ", resident.episodeId] })) : null, resident.spineStatus ? _jsxs("span", { children: ["\u72B6\u614B ", resident.spineStatus] }) : null, resident.locationUnknown ? (_jsx("span", { className: "magi-resident-selector__unknown", children: "\u5C45\u5834\u6240\u672A\u78BA\u8A8D" })) : null] })] }, residentKey(resident, index))))) }) })) : null] }));
}
//# sourceMappingURL=ResidentSelector.js.map