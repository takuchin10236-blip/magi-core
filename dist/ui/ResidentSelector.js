import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ResidentSelector — B2契約の候補だけを扱う共通利用者選択部品。
 *
 * この部品は認可装置ではない。サーバーで認可済みの候補を受け取り、
 * 必須field・5桁ID・boolean型を再確認して、安全側に絞って表示する。
 */
import { useEffect, useId, useMemo, useState } from 'react';
const RESIDENT_ID_PATTERN = /^\d{5}$/;
const REQUIRED_TEXT_FIELDS = ['residentId', 'name', 'kana', 'episodeId', 'spineStatus'];
const REQUIRED_BOOLEAN_FIELDS = ['episodeOpen', 'createAllowed'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizeResident(value) {
    if (!isRecord(value))
        return null;
    for (const field of REQUIRED_TEXT_FIELDS) {
        if (typeof value[field] !== 'string' || !value[field].trim())
            return null;
    }
    if (!RESIDENT_ID_PATTERN.test(value.residentId))
        return null;
    for (const field of REQUIRED_BOOLEAN_FIELDS) {
        if (typeof value[field] !== 'boolean')
            return null;
    }
    if (value.room !== undefined && typeof value.room !== 'string')
        return null;
    if (value.locationUnknown !== undefined && typeof value.locationUnknown !== 'boolean')
        return null;
    return {
        residentId: value.residentId.trim(),
        name: value.name.trim(),
        kana: value.kana.trim(),
        room: typeof value.room === 'string' ? value.room.trim() : '',
        episodeId: value.episodeId.trim(),
        spineStatus: value.spineStatus.trim(),
        episodeOpen: value.episodeOpen,
        createAllowed: value.createAllowed,
        locationUnknown: value.locationUnknown,
    };
}
export function normalizeResidentSelectorData(data) {
    const rows = Array.isArray(data)
        ? data
        : isRecord(data) && Array.isArray(data.residents)
            ? data.residents
            : [];
    return rows.map(normalizeResident).filter((resident) => resident !== null);
}
export function filterResidentSelectorCandidates(residents, mode, query = '', sourceAvailable = true) {
    if (!sourceAvailable || (mode !== 'search' && mode !== 'create'))
        return [];
    const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP');
    return residents.filter((resident) => {
        if (mode === 'create'
            && !(resident.createAllowed === true
                && resident.episodeOpen === true
                && typeof resident.locationUnknown === 'boolean'))
            return false;
        if (!normalizedQuery)
            return true;
        return [resident.residentId, resident.name, resident.kana, resident.room]
            .some((value) => value.toLocaleLowerCase('ja-JP').includes(normalizedQuery));
    });
}
export async function resolveResidentSelectorLoad(loadData) {
    try {
        return { residents: normalizeResidentSelectorData(await loadData()), failed: false };
    }
    catch {
        return { residents: [], failed: true };
    }
}
export function ResidentSelector({ mode, data, loadData, onSelect, selectedResidentId, label = '利用者を選ぶ', placeholder = 'ID・氏名・かな・居室で検索', disabled = false, className, }) {
    const inputId = useId();
    const statusId = useId();
    const [query, setQuery] = useState('');
    const [residents, setResidents] = useState(() => normalizeResidentSelectorData(data));
    const [loading, setLoading] = useState(Boolean(data === undefined && loadData));
    const [loadFailed, setLoadFailed] = useState(false);
    useEffect(() => {
        if (data === undefined) {
            if (!loadData) {
                setResidents([]);
                setLoadFailed(false);
                setLoading(false);
            }
            return;
        }
        setResidents(normalizeResidentSelectorData(data));
        setLoadFailed(false);
        setLoading(false);
    }, [data, loadData]);
    useEffect(() => {
        if (data !== undefined || !loadData)
            return;
        let active = true;
        setLoading(true);
        setLoadFailed(false);
        resolveResidentSelectorLoad(loadData)
            .then((result) => {
            if (!active)
                return;
            setResidents(result.residents);
            setLoadFailed(result.failed);
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [data, loadData]);
    const sourceAvailable = data !== undefined || Boolean(loadData);
    const candidates = useMemo(() => filterResidentSelectorCandidates(residents, mode, query, sourceAvailable), [mode, query, residents, sourceAvailable]);
    const statusText = loading
        ? '利用者候補を読み込んでいます。'
        : loadFailed
            ? '利用者候補を取得できませんでした。再読み込みしてください。'
            : `${candidates.length}件の候補があります。`;
    return (_jsxs("section", { "aria-labelledby": `${inputId}-label`, className: className, style: { color: 'var(--text-primary)' }, children: [_jsx("label", { id: `${inputId}-label`, htmlFor: inputId, style: { display: 'block', fontWeight: 700, marginBottom: 6 }, children: label }), _jsx("input", { id: inputId, type: "search", value: query, onChange: (event) => setQuery(event.currentTarget.value), placeholder: placeholder, disabled: disabled || loading, "aria-describedby": statusId, autoComplete: "off", style: {
                    width: '100%',
                    minHeight: 44,
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    background: 'var(--surface-1, var(--bg-surface, #fff))',
                    color: 'var(--text-primary)',
                } }), _jsx("p", { id: statusId, "aria-live": "polite", style: { color: 'var(--text-secondary)', margin: '6px 0' }, children: statusText }), _jsx("ul", { "aria-label": "\u5229\u7528\u8005\u5019\u88DC", style: { listStyle: 'none', margin: 0, padding: 0 }, children: candidates.map((resident) => (_jsx("li", { style: { marginBottom: 6 }, children: _jsxs("button", { type: "button", disabled: disabled, "aria-pressed": selectedResidentId === resident.residentId, onClick: () => onSelect(resident), style: {
                            width: '100%',
                            minHeight: 44,
                            textAlign: 'left',
                            border: '1px solid var(--border-default)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            background: selectedResidentId === resident.residentId
                                ? 'var(--color-primary-light)'
                                : 'var(--surface-1, var(--bg-surface, #fff))',
                            color: 'var(--text-primary)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }, children: [_jsx("strong", { children: resident.name }), _jsxs("span", { style: { marginLeft: 8, color: 'var(--text-secondary)' }, children: [resident.residentId, " / ", resident.room ? `${resident.room}室` : '居室未設定', " / ", resident.spineStatus] }), resident.locationUnknown ? _jsx("span", { children: " / \u6240\u5728\u8981\u78BA\u8A8D" }) : null] }) }, `${resident.residentId}:${resident.episodeId}`))) })] }));
}
//# sourceMappingURL=ResidentSelector.js.map