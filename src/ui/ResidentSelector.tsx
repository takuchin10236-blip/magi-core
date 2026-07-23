/**
 * ResidentSelector — B2契約の候補だけを扱う共通利用者選択部品。
 *
 * この部品は認可装置ではない。サーバーで認可済みの候補を受け取り、
 * 必須field・5桁ID・boolean型を再確認して、安全側に絞って表示する。
 */
import { useEffect, useId, useMemo, useState } from 'react';

export type ResidentSelectorMode = 'search' | 'create';

export interface ResidentSelectorResident {
  residentId: string;
  name: string;
  kana: string;
  room: string;
  episodeId: string;
  spineStatus: string;
  episodeOpen: boolean;
  createAllowed: boolean;
  locationUnknown?: boolean;
}

export interface ResidentSelectorProps {
  /** searchは過去利用者を含む検索、createは新規記録作成可能な利用者だけを表示する。 */
  mode: ResidentSelectorMode;
  /** 認可済みB2配列、または { residents: [...] }。不正な形は空配列へ倒す。 */
  data?: unknown;
  /** 親側の読取関数。失敗時は生エラーを出さず候補0件へ倒す。 */
  loadData?: () => Promise<unknown>;
  onSelect: (resident: ResidentSelectorResident) => void;
  selectedResidentId?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const RESIDENT_ID_PATTERN = /^\d{5}$/;
const REQUIRED_TEXT_FIELDS = ['residentId', 'name', 'kana', 'episodeId', 'spineStatus'] as const;
const REQUIRED_BOOLEAN_FIELDS = ['episodeOpen', 'createAllowed'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeResident(value: unknown): ResidentSelectorResident | null {
  if (!isRecord(value)) return null;
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (typeof value[field] !== 'string' || !value[field].trim()) return null;
  }
  if (!RESIDENT_ID_PATTERN.test(value.residentId as string)) return null;
  for (const field of REQUIRED_BOOLEAN_FIELDS) {
    if (typeof value[field] !== 'boolean') return null;
  }
  if (value.room !== undefined && typeof value.room !== 'string') return null;
  if (value.locationUnknown !== undefined && typeof value.locationUnknown !== 'boolean') return null;
  return {
    residentId: (value.residentId as string).trim(),
    name: (value.name as string).trim(),
    kana: (value.kana as string).trim(),
    room: typeof value.room === 'string' ? value.room.trim() : '',
    episodeId: (value.episodeId as string).trim(),
    spineStatus: (value.spineStatus as string).trim(),
    episodeOpen: value.episodeOpen as boolean,
    createAllowed: value.createAllowed as boolean,
    locationUnknown: value.locationUnknown as boolean | undefined,
  };
}

export function normalizeResidentSelectorData(data: unknown): ResidentSelectorResident[] {
  const rows = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.residents)
      ? data.residents
      : [];
  return rows.map(normalizeResident).filter((resident): resident is ResidentSelectorResident => resident !== null);
}

export function filterResidentSelectorCandidates(
  residents: ResidentSelectorResident[],
  mode: ResidentSelectorMode,
  query = '',
  sourceAvailable = true,
): ResidentSelectorResident[] {
  if (!sourceAvailable || (mode !== 'search' && mode !== 'create')) return [];
  const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP');
  return residents.filter((resident) => {
    if (
      mode === 'create'
      && !(
        resident.createAllowed === true
        && resident.episodeOpen === true
        && typeof resident.locationUnknown === 'boolean'
      )
    ) return false;
    if (!normalizedQuery) return true;
    return [resident.residentId, resident.name, resident.kana, resident.room]
      .some((value) => value.toLocaleLowerCase('ja-JP').includes(normalizedQuery));
  });
}

export async function resolveResidentSelectorLoad(
  loadData: () => Promise<unknown>,
): Promise<{ residents: ResidentSelectorResident[]; failed: boolean }> {
  try {
    return { residents: normalizeResidentSelectorData(await loadData()), failed: false };
  } catch {
    return { residents: [], failed: true };
  }
}

export function ResidentSelector({
  mode,
  data,
  loadData,
  onSelect,
  selectedResidentId,
  label = '利用者を選ぶ',
  placeholder = 'ID・氏名・かな・居室で検索',
  disabled = false,
  className,
}: ResidentSelectorProps) {
  const inputId = useId();
  const statusId = useId();
  const [query, setQuery] = useState('');
  const [residents, setResidents] = useState<ResidentSelectorResident[]>(() => normalizeResidentSelectorData(data));
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
    if (data !== undefined || !loadData) return;
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    resolveResidentSelectorLoad(loadData)
      .then((result) => {
        if (!active) return;
        setResidents(result.residents);
        setLoadFailed(result.failed);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [data, loadData]);

  const sourceAvailable = data !== undefined || Boolean(loadData);
  const candidates = useMemo(
    () => filterResidentSelectorCandidates(residents, mode, query, sourceAvailable),
    [mode, query, residents, sourceAvailable],
  );

  const statusText = loading
    ? '利用者候補を読み込んでいます。'
    : loadFailed
      ? '利用者候補を取得できませんでした。再読み込みしてください。'
      : `${candidates.length}件の候補があります。`;

  return (
    <section
      aria-labelledby={`${inputId}-label`}
      className={className}
      style={{ color: 'var(--text-primary)' }}
    >
      <label id={`${inputId}-label`} htmlFor={inputId} style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        aria-describedby={statusId}
        autoComplete="off"
        style={{
          width: '100%',
          minHeight: 44,
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '8px 12px',
          background: 'var(--surface-1, var(--bg-surface, #fff))',
          color: 'var(--text-primary)',
        }}
      />
      <p id={statusId} aria-live="polite" style={{ color: 'var(--text-secondary)', margin: '6px 0' }}>
        {statusText}
      </p>
      <ul aria-label="利用者候補" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {candidates.map((resident) => (
          <li key={`${resident.residentId}:${resident.episodeId}`} style={{ marginBottom: 6 }}>
            <button
              type="button"
              disabled={disabled}
              aria-pressed={selectedResidentId === resident.residentId}
              onClick={() => onSelect(resident)}
              style={{
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
              }}
            >
              <strong>{resident.name}</strong>
              <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>
                {resident.residentId} / {resident.room ? `${resident.room}室` : '居室未設定'} / {resident.spineStatus}
              </span>
              {resident.locationUnknown ? <span> / 所在要確認</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
