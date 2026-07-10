import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

/**
 * ResidentSelector is a presentation component, not an authorization boundary.
 * The server must return only the residents and tabs that the signed-in operator
 * is allowed to see. Create mode adds a fail-closed UI check for the two explicit
 * server decisions (`createAllowed` and `episodeOpen`) before showing a candidate.
 */
export type ResidentSelectorMode = 'create' | 'search';

export interface ResidentSelectorResident {
  /** Five-digit resident ID. Keep this as a string so leading zeroes are preserved. */
  residentId: string;
  name: string;
  kana: string;
  room?: string;
  episodeId: string;
  spineStatus: string;
  locationUnknown?: boolean;
  /** Server decision. Create mode only shows true; search accepts either boolean value. */
  createAllowed: boolean;
  /** Server decision. Create mode only shows true; search accepts either boolean value. */
  episodeOpen: boolean;
}

export interface ResidentSelectorCreateResident extends ResidentSelectorResident {
  /** B2 create contract requires an explicit boolean, including when the value is false. */
  locationUnknown: boolean;
}

export interface ResidentSelectorCreateData {
  /** Already-authorized candidates in the server's canonical display order. */
  residents: readonly ResidentSelectorCreateResident[];
}

export interface ResidentSelectorTab {
  id: string;
  label: string;
  /** Already-authorized residents in the server's canonical display order. */
  residents: readonly ResidentSelectorResident[];
}

export interface ResidentSelectorSearchData {
  /** Only server-authorized scopes/tabs. The component never invents a scope. */
  tabs: readonly ResidentSelectorTab[];
}

export interface ResidentSelectorLoadContext {
  mode: ResidentSelectorMode;
}

interface ResidentSelectorCommonProps {
  value?: ResidentSelectorResident | null;
  onSelect: (resident: ResidentSelectorResident) => void;
  onClear?: () => void;
  /** Optional sanitized loading state for a parent-managed data source. */
  loading?: boolean;
  /** Optional sanitized error text for a parent-managed data source. */
  error?: string | null;
  /** Called by the retry button when the parent owns loading. */
  onRetry?: () => void;
  /** Receives the original loader error for app-side logging. It is not rendered. */
  onLoadError?: (error: unknown) => void;
  searchLabel?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export type ResidentSelectorProps =
  | (ResidentSelectorCommonProps & {
      mode: 'create';
      data?: ResidentSelectorCreateData;
      loadData?: (
        context: ResidentSelectorLoadContext & { mode: 'create' },
      ) => Promise<ResidentSelectorCreateData>;
    })
  | (ResidentSelectorCommonProps & {
      mode: 'search';
      data?: ResidentSelectorSearchData;
      loadData?: (
        context: ResidentSelectorLoadContext & { mode: 'search' },
      ) => Promise<ResidentSelectorSearchData>;
    });

function searchableText(resident: ResidentSelectorResident): string {
  return [resident.residentId, resident.name, resident.kana, resident.room]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('ja-JP');
}

function isCreateCandidate(resident: ResidentSelectorResident): boolean {
  return (
    hasRequiredB2Fields(resident) &&
    typeof resident.locationUnknown === 'boolean' &&
    resident.createAllowed === true &&
    resident.episodeOpen === true
  );
}

function hasRequiredB2Fields(resident: ResidentSelectorResident): boolean {
  return (
    resident !== null &&
    typeof resident === 'object' &&
    typeof resident.residentId === 'string' &&
    /^\d{5}$/.test(resident.residentId) &&
    typeof resident.name === 'string' &&
    resident.name.trim().length > 0 &&
    typeof resident.kana === 'string' &&
    resident.kana.trim().length > 0 &&
    typeof resident.episodeId === 'string' &&
    resident.episodeId.trim().length > 0 &&
    typeof resident.spineStatus === 'string' &&
    resident.spineStatus.trim().length > 0 &&
    typeof resident.createAllowed === 'boolean' &&
    typeof resident.episodeOpen === 'boolean'
  );
}

function residentKey(resident: ResidentSelectorResident, index: number): string {
  return `${resident.residentId}:${resident.episodeId ?? ''}:${index}`;
}

export function ResidentSelector(props: ResidentSelectorProps) {
  const {
    value,
    onSelect,
    onClear,
    loading,
    error,
    onRetry,
    onLoadError,
    searchLabel = '利用者を検索',
    emptyMessage = '該当する利用者はいません。',
    className,
    disabled = false,
  } = props;
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [selectedTabId, setSelectedTabId] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [loadedCreateData, setLoadedCreateData] = useState<ResidentSelectorCreateData>();
  const [loadedSearchData, setLoadedSearchData] = useState<ResidentSelectorSearchData>();
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (props.data !== undefined) {
      setInternalLoading(false);
      setInternalError(null);
      return;
    }
    if (props.loadData === undefined) return;

    let active = true;
    setInternalLoading(true);
    setInternalError(null);

    if (props.mode === 'create') {
      props
        .loadData({ mode: 'create' })
        .then((nextData) => {
          if (active) setLoadedCreateData(nextData);
        })
        .catch((loadError: unknown) => {
          if (!active) return;
          setLoadedCreateData(undefined);
          setInternalError('利用者一覧を読み込めませんでした。');
          onLoadError?.(loadError);
        })
        .finally(() => {
          if (active) setInternalLoading(false);
        });
    } else {
      props
        .loadData({ mode: 'search' })
        .then((nextData) => {
          if (active) setLoadedSearchData(nextData);
        })
        .catch((loadError: unknown) => {
          if (!active) return;
          setLoadedSearchData(undefined);
          setInternalError('利用者一覧を読み込めませんでした。');
          onLoadError?.(loadError);
        })
        .finally(() => {
          if (active) setInternalLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [onLoadError, props.data, props.loadData, props.mode, retryKey]);

  const createData =
    props.mode === 'create' ? (props.data ?? loadedCreateData) : undefined;
  const searchData =
    props.mode === 'search' ? (props.data ?? loadedSearchData) : undefined;
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
    const source =
      props.mode === 'create'
        ? (createData?.residents ?? []).filter(isCreateCandidate)
        : (tabs.find((tab) => tab.id === selectedTabId)?.residents ?? []).filter(
            hasRequiredB2Fields,
          );
    const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP');
    if (!normalizedQuery) return source;
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
    if (props.loadData) setRetryKey((current) => current + 1);
  };

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || effectiveLoading || effectiveError || candidates.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const first = candidates[0];
      if (first) onSelect(first);
    }
  };

  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(Math.min(index + 1, candidates.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        const searchInput = event.currentTarget
          .closest('.magi-resident-selector')
          ?.querySelector<HTMLInputElement>('.magi-resident-selector__search');
        searchInput?.focus();
      } else {
        focusOption(index - 1);
      }
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length < 2) return;
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    setSelectedTabId(nextTab.id);
    const tabList = event.currentTarget.parentElement;
    tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <section
      className={`magi-resident-selector${className ? ` ${className}` : ''}`}
      aria-label={props.mode === 'create' ? '記録対象の利用者選択' : '利用者検索'}
      aria-busy={effectiveLoading}
    >
      {value ? (
        <div className="magi-resident-selector__selected" aria-label="選択中の利用者">
          <div>
            <span className="magi-resident-selector__selected-label">選択中</span>
            <strong>{value.name}</strong>
            <span className="magi-resident-selector__id">ID {value.residentId}</span>
          </div>
          {onClear ? (
            <button
              type="button"
              className="themed-btn-secondary magi-resident-selector__clear"
              onClick={onClear}
              disabled={disabled}
              aria-label={`${value.name}の選択を解除`}
            >
              選択を解除
            </button>
          ) : null}
        </div>
      ) : null}

      {props.mode === 'search' && tabs.length > 0 ? (
        <div className="magi-resident-selector__tabs" role="tablist" aria-label="検索範囲">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              id={`${listboxId}-tab-${index}`}
              type="button"
              role="tab"
              aria-controls={tabPanelId}
              aria-selected={tab.id === selectedTabId}
              tabIndex={tab.id === selectedTabId ? 0 : -1}
              className="magi-resident-selector__tab"
              onClick={() => setSelectedTabId(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              disabled={disabled || effectiveLoading || Boolean(effectiveError)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <label className="magi-resident-selector__search-label">
        <span>{searchLabel}</span>
        <input
          className="themed-input magi-resident-selector__search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="氏名・かな・居室・5桁ID"
          disabled={disabled || effectiveLoading || Boolean(effectiveError)}
          aria-controls={listboxId}
          autoComplete="off"
        />
      </label>

      <div className="magi-resident-selector__state" aria-live="polite">
        {effectiveLoading ? <p>利用者一覧を読み込んでいます…</p> : null}
        {!effectiveLoading && effectiveError ? (
          <div className="magi-resident-selector__error" role="alert">
            <p>{effectiveError}</p>
            <p>新しい利用者は選べません。時間をおいて再試行してください。</p>
            {canRetry ? (
              <button type="button" className="themed-btn-secondary" onClick={retry}>
                再試行
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!effectiveLoading && !effectiveError ? (
        <div
          id={tabPanelId}
          role={props.mode === 'search' && tabs.length > 0 ? 'tabpanel' : undefined}
          aria-labelledby={
            props.mode === 'search' && activeTabIndex >= 0
              ? `${listboxId}-tab-${activeTabIndex}`
              : undefined
          }
        >
          <div id={listboxId} className="magi-resident-selector__list" role="listbox">
            {candidates.length === 0 ? (
              <p className="magi-resident-selector__empty">{emptyMessage}</p>
            ) : (
              candidates.map((resident, index) => (
                <button
                  key={residentKey(resident, index)}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={value?.residentId === resident.residentId}
                  className="magi-resident-selector__option"
                  onClick={() => onSelect(resident)}
                  onKeyDown={(event) => onOptionKeyDown(event, index)}
                  disabled={disabled}
                >
                  <span className="magi-resident-selector__identity">
                    <strong>{resident.name}</strong>
                    {resident.kana ? <span>{resident.kana}</span> : null}
                  </span>
                  <span className="magi-resident-selector__details">
                    <span className="magi-resident-selector__id">ID {resident.residentId}</span>
                    {resident.room ? <span>居室 {resident.room}</span> : null}
                    {resident.episodeId ? (
                      <span>エピソード {resident.episodeId}</span>
                    ) : null}
                    {resident.spineStatus ? <span>状態 {resident.spineStatus}</span> : null}
                    {resident.locationUnknown ? (
                      <span className="magi-resident-selector__unknown">居場所未確認</span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
