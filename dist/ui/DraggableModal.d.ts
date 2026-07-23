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
import { type ReactNode } from 'react';
type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
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
export declare function DraggableModal({ onClose, title, subtitle, customHeader, maxWidth, extraClass, children, footer, zIndex, titleColorClass, }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=DraggableModal.d.ts.map