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
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ManualBlock, ManualContent, ManualSection } from './manual-types';

type Props = {
  content: ManualContent;
  onClose: () => void;
};

/** 正規表現の特殊文字をエスケープ（検索語をそのまま正規表現に使うため） */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * テキストを検索語で分割し、ヒット部分を <mark className="search-hit"> で包む。
 * query が空なら素のテキストをそのまま返す（不要な span 生成を避ける）。
 */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  // capture group 付き split＝区切り(ヒット語)も配列に残る。ヒット語だけ <mark> で包む。
  // g フラグ付き正規表現の .test() は lastIndex がずれるため使わず、小文字一致で判定する。
  const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const lower = q.toLowerCase();
  const parts = text.split(re);
  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <mark className="search-hit" key={i}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** 1 block 内に検索語が含まれるか（text または items のいずれか） */
function blockMatches(block: ManualBlock, q: string): boolean {
  const needle = q.toLowerCase();
  if (block.type === 'steps') {
    return block.items.some((item) => item.toLowerCase().includes(needle));
  }
  return block.text.toLowerCase().includes(needle);
}

/** 1 section 内に検索語が含まれるか（title / keywords / 各 block） */
function sectionMatches(section: ManualSection, q: string): boolean {
  const needle = q.toLowerCase();
  if (section.title.toLowerCase().includes(needle)) return true;
  if (section.keywords?.some((k) => k.toLowerCase().includes(needle))) return true;
  return section.blocks.some((b) => blockMatches(b, needle));
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

/** 1 block をタイプ別に描画（検索語があればハイライト込み） */
function BlockView({ block, query }: { block: ManualBlock; query: string }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="manual-paragraph">{highlight(block.text, query)}</p>;
    case 'steps':
      return (
        <ol className="manual-steps">
          {block.items.map((item, i) => (
            <li key={i}>{highlight(item, query)}</li>
          ))}
        </ol>
      );
    case 'note':
      return (
        <div className={`manual-note manual-note-${block.tone}`} role="note">
          <span className="manual-note-label" aria-hidden="true">
            {block.tone === 'warning' ? '!' : block.tone === 'tip' ? '+' : 'i'}
          </span>
          <p>{highlight(block.text, query)}</p>
        </div>
      );
    case 'analogy':
      return (
        <div className="manual-analogy">
          <span className="manual-analogy-label">たとえば</span>
          <p>{highlight(block.text, query)}</p>
        </div>
      );
    default:
      return null;
  }
}

export function ManualViewer({ content, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(content.sections[0]?.id ?? '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // 目次クリック直後の一時的な「スクロール連動の上書き禁止」フラグ。
  // クリックでスムーズスクロール中は、途中で通過する節に active が奪われないようにする。
  const suppressScrollSync = useRef(false);

  // Esc で閉じる / Tab は全画面マニュアル内で循環させる
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = focusableElements(root);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
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
  const matchedSections = useMemo(
    () => (q ? content.sections.filter((s) => sectionMatches(s, q)) : content.sections),
    [content.sections, q],
  );
  const hasResults = !q || matchedSections.length > 0;

  // スクロール連動で目次の active を更新（本文の上端付近にある節を現在地とみなす）。
  // IntersectionObserver で各節の交差を監視し、最も上にある可視の節を active にする。
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressScrollSync.current) return;
        // 可視（交差中）の節のうち、最も上（boundingClientRect.top が小さい）を現在地に。
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section-id');
          if (id) setActiveId(id);
        }
      },
      {
        root,
        // 本文上端から 40% の帯に入った節を「現在地」とみなす（早めに切り替わって自然）。
        rootMargin: '0px 0px -55% 0px',
        threshold: 0,
      },
    );
    const nodes = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
    // sections の数が変われば再構築（検索中も節は消さないので通常は初回のみ）
  }, [content.sections]);

  // 目次クリック → 該当 section へスムーズスクロール（連動を一時停止して取り合いを防ぐ）
  const jumpTo = (id: string) => {
    setActiveId(id);
    suppressScrollSync.current = true;
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // スムーズスクロール完了の正確なイベントが無いため、概算で連動を再開する。
    window.setTimeout(() => {
      suppressScrollSync.current = false;
    }, 600);
  };

  return (
    <div
      ref={dialogRef}
      className="manual-fullpage"
      role="dialog"
      aria-modal="true"
      aria-label={`${content.appName} 操作マニュアル`}
    >
      {/* ── ヘッダバー（上部固定・背後が透けないので見切れない） ── */}
      <header className="manual-page-header">
        <div className="manual-page-title">
          <span className="manual-page-eyebrow" aria-hidden="true">
            📖 操作マニュアル
          </span>
          <h1>
            {content.appName}
            {content.appVersion && (
              <span className="manual-page-version">{content.appVersion}</span>
            )}
          </h1>
          {content.subtitle && <p className="manual-page-subtitle">{content.subtitle}</p>}
        </div>
        <button
          type="button"
          className="manual-page-close"
          onClick={onClose}
          aria-label="閉じる"
          title="閉じます（Esc でも閉じられます）"
        >
          <span aria-hidden="true">×</span>
          <span className="manual-page-close-text">閉じる</span>
        </button>
      </header>

      {/* ── 検索バー（ヘッダ直下・固定） ── */}
      <div className="manual-page-search">
        <div className="manual-search-row">
          <span className="manual-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="manual-search-input"
            ref={searchInputRef}
            className="manual-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="知りたいことを探す（例: 発注 / 印刷 / 在庫）"
            aria-label="マニュアル内を検索"
            aria-describedby="manual-search-summary"
          />
          {query && (
            <button
              type="button"
              className="manual-search-clear"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="検索をクリア"
              title="検索をクリアします"
            >
              ×
            </button>
          )}
        </div>
        <p id="manual-search-summary" className="manual-search-summary" aria-live="polite">
          {q
            ? `「${q}」に当てはまる項目: ${matchedSections.length} 件`
            : `全 ${content.sections.length} 項目`}
        </p>
      </div>

      {/* ── 2カラム本体（左=目次サイドバー / 右=本文） ── */}
      <div className="manual-page-body">
        {/* 左: 目次サイドバー（縦リスト・active ハイライト） */}
        <nav className="manual-toc" aria-label="目次">
          <p className="manual-toc-heading">目次</p>
          <ul className="manual-toc-list">
            {content.sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`manual-toc-item${activeId === s.id ? ' active' : ''}`}
                  onClick={() => jumpTo(s.id)}
                  title={s.summary || s.title}
                  aria-current={activeId === s.id ? 'true' : undefined}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 右: 本文（読みやすい幅・MAGI書式）。検索中も節を消さずハイライト。 */}
        <div className="manual-body" ref={bodyRef}>
          <div className="manual-body-inner">
            {hasResults ? (
              content.sections.map((s) => (
                <section
                  key={s.id}
                  id={`manual-section-${s.id}`}
                  data-section-id={s.id}
                  ref={(el) => {
                    sectionRefs.current[s.id] = el;
                  }}
                  className="manual-section"
                >
                  <h3>{highlight(s.title, q)}</h3>
                  {s.blocks.map((block, i) => (
                    <BlockView block={block} query={q} key={i} />
                  ))}
                </section>
              ))
            ) : (
              <div className="manual-no-results" role="status">
                <h3>見つかりませんでした</h3>
                <p>
                  「{q}」に当てはまる項目はありませんでした。別の言葉（例: ひらがな、短い単語）で
                  探してみてください。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
