/**
 * scrollLock — モーダルが開いている間の背景スクロール停止を、参照カウントで管理する（v0.13.6）。
 *
 * なぜ要るか（2026-08-05・連絡ノート実機で社長が再現した事故）:
 *   従来は各モーダルが `document.body.style.overflow` を**自分で退避**して 'hidden' を掛け、
 *   閉じる時に**自分が退避した値**へ戻していた。モーダルが入れ子で開くと（投稿フォーム＋
 *   投稿前の確認モーダル等）、後から開いた側が退避する値は既に 'hidden' である。
 *   両方が同じ更新で閉じると、先に閉じた側が元の値へ戻した後、後の側が 'hidden' を
 *   **書き戻す**。結果、開いているモーダルが1つも無いのに画面がスクロールできなくなる。
 *
 * 対策: 退避を「最初の1枚」だけが行い、「最後の1枚」が閉じた時にだけ戻す（参照カウント）。
 *   入れ子・同時開閉・閉じる順序の入れ替わりのいずれでも壊れない。
 *
 * 注意: StrictMode の効果二重実行（mount→cleanup→mount）に耐えるため、
 *   解除関数は二度呼んでもカウントを壊さない。
 */
let depth = 0;
let savedOverflow = null;
/** 背景スクロールを止める。戻り値を呼ぶと解除（最後の1枚なら元の値へ戻す）。 */
export function lockBodyScroll(doc = document) {
    if (depth === 0) {
        savedOverflow = doc.body.style.overflow;
        doc.body.style.overflow = 'hidden';
    }
    depth += 1;
    let released = false;
    return function releaseBodyScroll() {
        if (released)
            return;
        released = true;
        depth -= 1;
        if (depth <= 0) {
            depth = 0;
            doc.body.style.overflow = savedOverflow ?? '';
            savedOverflow = null;
        }
    };
}
/** 試験用: 今いくつのモーダルが背景スクロールを止めているか。 */
export function getBodyScrollLockDepth() {
    return depth;
}
/** 試験用: 状態を初期化する（試験間の持ち越しを防ぐ）。本番コードから呼ばない。 */
export function resetBodyScrollLockForTest() {
    depth = 0;
    savedOverflow = null;
}
//# sourceMappingURL=scrollLock.js.map