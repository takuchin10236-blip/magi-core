/**
 * VersionHistoryModal — 更新履歴を開くモーダル（v0.6・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 2026-07-28 社長裁定: 更新履歴は画面本文に常設せず、メニュー最下段から開く。
 *   本文に置くと毎回目に入る割に、実際に見る頻度は最も低いため。
 *
 * 履歴の実体は各アプリの `src/lib/changelog.ts`（金型v1.2の様式）。
 * ここは「器」だけを持ち、値はアプリが entries で渡す（coreは値を持たない）。
 */
import { DraggableModal } from './DraggableModal';

export interface VersionHistoryEntry {
  version: string;
  date: string;
  summary: string;
}

export interface VersionHistoryModalProps {
  entries: VersionHistoryEntry[];
  onClose: () => void;
  /** 見出し。既定「これまでの更新履歴」。 */
  title?: string;
  /** 副題。既定はアプリ名を入れる想定。 */
  subtitle?: string;
}

export function VersionHistoryModal({
  entries,
  onClose,
  title = 'これまでの更新履歴',
  subtitle,
}: VersionHistoryModalProps) {
  return (
    <DraggableModal maxWidth="lg" onClose={onClose} subtitle={subtitle} title={title}>
      <ol className="magi-version-history">
        {entries.map((entry, index) => (
          <li className={`magi-version-history-item${index === 0 ? ' is-latest' : ''}`} key={entry.version}>
            <div className="magi-version-history-head">
              <span className="magi-version-history-version">v{entry.version}</span>
              <span className="magi-version-history-date">{entry.date}</span>
              {index === 0 ? <span className="magi-version-history-latest">最新</span> : null}
            </div>
            <p className="magi-version-history-summary">{entry.summary}</p>
          </li>
        ))}
      </ol>
    </DraggableModal>
  );
}
