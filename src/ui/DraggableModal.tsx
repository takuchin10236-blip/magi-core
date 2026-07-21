/**
 * ドラッグ可能モーダルの共通コンポーネント (Step 13 / 2026-05-04 タチコマ)
 *
 * 設計意図:
 *   既存モーダル群（EditModal, RouteModal, CancelModal, DeleteModal,
 *   CommentModal, TaskListModal, ConfirmPostModal, EditLogTab, StatsDashboard）が
 *   画面中央に固定されていて動かせなかった問題を解決。
 *   ヘッダ部分（タイトルバー）を掴んでドラッグ移動可能にする。
 *
 *   既存の各モーダルの構造（オーバーレイ + themed-card 内部）を維持しつつ、
 *   オーバーレイ + DraggableModal でラップする形にリファクタする。
 *
 * 実装ポイント:
 *   - react-draggable v4 を採用（軽量・実績あり）
 *   - findDOMNode 非推奨警告回避のため nodeRef を使う
 *   - bounds=parent でオーバーレイ内に制限し、画面外へ出さない
 *   - オーバーレイクリックで閉じる動作は維持（モーダル本体のクリックは伝播停止）
 *   - ヘッダ・スクロール本文・固定フッタの3層構造（U8標準）
 *   - 閉じるボタンは44px、Escape対応、背景スクロール停止、閉じた後に元の場所へフォーカス復帰
 *
 * 使い方:
 *   <DraggableModal onClose={onClose} title="モーダルのタイトル" maxWidth="xl">
 *     <div>本体コンテンツ</div>
 *   </DraggableModal>
 *
 *   タイトル + 閉じるボタン込みのヘッダを自動生成。
 *   独自ヘッダにしたい場合は title=null + customHeader prop を使う。
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import Draggable from 'react-draggable';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

type Props = {
  onClose: () => void;
  /** モーダルのタイトル（左上、ドラッグハンドル兼）。null なら customHeader を使う */
  title?: ReactNode;
  /** タイトル下のサブテキスト（任意、小さい灰色） */
  subtitle?: ReactNode;
  /** カスタムヘッダ（title=null時に使う、ドラッグ可能にしたい場合は draggable-handle クラスを付ける） */
  customHeader?: ReactNode;
  /** 最大幅（Tailwind max-w-*）。デフォルト 'xl' */
  maxWidth?: MaxWidth;
  /** 警告表示用の追加CSSクラス（例: 'border-2 border-red-500'） */
  extraClass?: string;
  /** モーダル本体（ヘッダの下に表示） */
  children: ReactNode;
  /** 本文とは別に固定表示するフッタ（操作ボタン等） */
  footer?: ReactNode;
  /** z-index（デフォルト 50。ConfirmPostModal等の重ねモーダルは 60 にする） */
  zIndex?: number;
  /** タイトルの色クラス（デフォルト 'text-[var(--color-primary)]'） */
  titleColorClass?: string;
};

export function DraggableModal({
  onClose,
  title,
  subtitle,
  customHeader,
  maxWidth = 'xl',
  extraClass = '',
  children,
  footer,
  zIndex = 50,
  titleColorClass = 'text-[var(--color-primary)]',
}: Props) {
  // findDOMNode 回避用 ref（React 19 / StrictMode 対応）
  const nodeRef = useRef<HTMLDivElement>(null!);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const subtitleId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && nodeRef.current) {
        const focusable = Array.from(
          nodeRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.getAttribute('aria-hidden') !== 'true');

        if (focusable.length === 0) {
          event.preventDefault();
          nodeRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      (closeButtonRef.current ?? nodeRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="magi-modal-overlay fixed inset-0 flex items-center justify-center bg-black/50 p-4 no-print"
      style={{ zIndex }}
      onClick={onClose}
    >
      <Draggable
        nodeRef={nodeRef}
        handle=".draggable-handle"
        bounds="parent"
      >
        <div
          ref={nodeRef}
          tabIndex={-1}
          className={`themed-card draggable-modal magi-modal-frame rounded-2xl shadow-2xl w-full ${MAX_WIDTH_CLASS[maxWidth]} ${extraClass}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title !== null && title !== undefined ? titleId : undefined}
          aria-describedby={subtitle ? subtitleId : undefined}
        >
          {/* デフォルトヘッダ（タイトル + 閉じるボタン、タイトル部分がドラッグハンドル） */}
          {title !== null && title !== undefined && (
            <div className="draggable-handle magi-modal-header flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-default)]">
              <div className="flex-1 min-w-0">
                <h3 id={titleId} className={`text-lg font-bold ${titleColorClass} flex items-center gap-2`}>
                  {title}
                  <span
                    className="text-xs themed-text-muted opacity-60 font-normal hidden md:inline"
                    title="上の部分をつかむと、この小さな画面を動かせます"
                  >
                    ⋮⋮ つかんで動かせます
                  </span>
                </h3>
                {subtitle && <p id={subtitleId} className="text-xs themed-text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="magi-modal-close themed-text-muted hover:themed-text-secondary ml-2"
                aria-label="閉じる"
                title="閉じます"
              >
                <svg
                  aria-hidden="true"
                  className="magi-modal-close-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
                </svg>
              </button>
            </div>
          )}

          {/* カスタムヘッダ（特殊なデザインのモーダル用） */}
          {customHeader && customHeader}

          {/* 本体 */}
          <div className="magi-modal-body p-5">{children}</div>

          {footer !== null && footer !== undefined && (
            <div className="magi-modal-footer">{footer}</div>
          )}
        </div>
      </Draggable>
    </div>
  );
}
