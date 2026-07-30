/**
 * modalGuards — 「今、開いているモーダルの中か」を判定する共通部（v0.9.1）。
 *
 * なぜ要るか（2026-07-30・shift-v4 実機で再現した事故）:
 *   モーダルは portal で document.body 直下へ出る。一方、メニューや詳細パネルの
 *   「外側をクリックしたら閉じる」判定は自分の DOM 配下かどうかで見るため、
 *   **モーダル本文のクリックが「外側」に見えてしまう**。
 *   メニューが閉じると、その中に置かれた部品（例: ManualEntry）ごと unmount され、
 *   開いていたマニュアルが消える。BusinessNav の menuChildren に ManualEntry を置く
 *   標準構成で必ず起きる。
 *
 * 対策: 「開いているモーダル（またはその子孫）で起きた操作は外側ではない」と見なす。
 *   判定は event.target からの closest なので、portal 先でも DOM 上の祖先を辿って拾える。
 *
 * 対象の印: role="dialog" かつ aria-modal="true"（DraggableModal＝ConfirmModal・
 *   VersionHistoryModal 系、ManualViewer が該当）と、ネイティブ <dialog open>。
 *   aria-modal を持たない popover（版チップのパネル等）は対象外＝従来どおり閉じてよい。
 */
export const OPEN_MODAL_SELECTOR = '[role="dialog"][aria-modal="true"], dialog[open]';
/** イベントの発生点が、開いているモーダルの内側か。 */
export function isInsideOpenModal(target) {
    const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
    return Boolean(element?.closest(OPEN_MODAL_SELECTOR));
}
/** 画面のどこかに開いているモーダルがあるか（キー操作を横取りしないための判定）。 */
export function hasOpenModal() {
    if (typeof document === 'undefined')
        return false;
    return Boolean(document.querySelector(OPEN_MODAL_SELECTOR));
}
//# sourceMappingURL=modalGuards.js.map