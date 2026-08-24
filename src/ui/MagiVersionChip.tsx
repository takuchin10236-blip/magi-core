/**
 * MagiVersionChip — 短い版表示＋クリックでビルド詳細（v0.5・AppShell）。
 *
 * magi-resident-spine src/lib/version.ts の思想（版・時刻をハードコードせず単一ソースから）を
 *   踏襲し、core 版は値を持たずアプリが version / buildTime / dataUpdatedAt / details を props で渡す。
 *   整形は versionFormat.ts（単一の整形ロジック）に集約する。
 */
import { useEffect, useRef, useState } from 'react';
import { formatBuildTime, formatReleaseLabel, resolveReleaseTime } from './versionFormat';

export interface MagiVersionChipProps {
  /** 版文字列（例 '1.3.2' / 'v1.3.2-release'）。ビルド時に注入した単一ソースを渡す。 */
  version: string;
  /** ビルド時刻 ISO 文字列（任意）。あればラベルへ 'M/D HH:MM' を併記。 */
  buildTime?: string;
  /** データ台帳の最終更新時刻 ISO（任意）。ビルド時刻より新しければラベルの時刻はこちらを採る。 */
  dataUpdatedAt?: string;
  /** 開いた時に見せる追加詳細（環境名・コミット等）。 */
  details?: Record<string, string>;
  className?: string;
}

/** どの時刻がラベルに出ているかを詳細パネルで示す印。両方ある時だけ付ける（片方だけなら自明）。 */
const SHOWN_MARK = '（ヘッダに表示中）';

export function MagiVersionChip({ version, buildTime = '', dataUpdatedAt = '', details, className }: MagiVersionChipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = formatReleaseLabel(version, buildTime, dataUpdatedAt);
  const builtAtText = formatBuildTime(buildTime);
  const dataUpdatedText = formatBuildTime(dataUpdatedAt);
  const shown = resolveReleaseTime(buildTime, dataUpdatedAt).source;
  const marked = (text: string, source: 'build' | 'data'): string =>
    builtAtText && dataUpdatedText && shown === source ? `${text}${SHOWN_MARK}` : text;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`magi-appshell-version${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`版 ${label}。詳細を開きます`}
        className="magi-appshell-version-chip"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
      </button>
      {open ? (
        <div className="magi-appshell-version-panel" role="dialog" aria-label="版の詳細">
          <dl>
            <div><dt>版</dt><dd>{version.startsWith('v') ? version : `v${version}`}</dd></div>
            <div><dt>ビルド時刻</dt><dd>{builtAtText ? marked(builtAtText, 'build') : '確認中'}</dd></div>
            {dataUpdatedText ? (
              <div><dt>データの更新</dt><dd>{marked(dataUpdatedText, 'data')}</dd></div>
            ) : null}
            {Object.entries(details ?? {}).map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
