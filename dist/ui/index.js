/**
 * @magi/core/ui — 背骨UI最小エントリ（v0.1）
 *
 * 公開API（部品3つ）:
 *   - ConfirmModal（汎用確認モーダル・ネイティブ confirm 撲滅用）
 *   - DraggableModal（ドラッグ可能モーダルの土台）
 *   - Toast: ToastProvider / useToast
 *
 * CSS（状態色トークン + 背骨シェル + 部品クラス）は別ファイル core.css を
 *   採用側アプリが直接 import する:
 *     import '@magi/core/ui/core.css';
 *   （package.json の exports に "./ui/core.css" を公開している）
 *
 * peerDependencies: react / react-dom / lucide-react / react-draggable
 *   （@magi/core 自身はこれらを bundle しない＝採用側アプリのものを使う）
 */
export { ConfirmModal } from './ConfirmModal';
export { DraggableModal } from './DraggableModal';
export { ToastProvider, useToast } from './Toast';
//# sourceMappingURL=index.js.map