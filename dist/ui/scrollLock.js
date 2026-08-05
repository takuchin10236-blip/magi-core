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
 * 設計の線（v0.13.7・二系統レビューの指摘を反映）:
 *   - **アプリ側もこの錠を使う**。自前で `body.style.overflow` を退避・復元すると、
 *     core の数え上げと二重所有になり、同じ膠着が「core のカウントは0なのに hidden」という
 *     検知しにくい形で再発する（実測で再現済み）。そのため公開APIとして配る。
 *   - **逃げ道を1つ持つ**（`forceReleaseBodyScroll`）。参照カウントは漏れると自力で戻れず、
 *     旧実装にあった偶発的な自己修復（次に開いた側が '' を書き戻す）が無い。
 *     介護現場の共用端末で固着したら職員はリロードするしかない、を避けるための非常口。
 *   - **状態は body 1つに対して1組**。複数 document は扱わない（扱えるように見える引数は置かない）。
 *   - StrictMode の効果二重実行（mount→cleanup→mount）に耐えるため、解除関数は
 *     二度呼んでもカウントを壊さない。
 */
let depth = 0;
let savedOverflow = null;
/** 背景スクロールを止める。戻り値を呼ぶと解除（最後の1枚なら元の値へ戻す）。 */
export function lockBodyScroll() {
    if (typeof document === 'undefined')
        return () => { };
    if (depth === 0) {
        savedOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    depth += 1;
    let released = false;
    return function releaseBodyScroll() {
        if (released)
            return;
        released = true;
        depth -= 1;
        if (depth > 0)
            return;
        depth = 0;
        // ロック中に他者（別ライブラリ・アプリ側の後始末）が値を変えていたら踏み潰さない。
        if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = savedOverflow ?? '';
        }
        savedOverflow = null;
    };
}
/**
 * 非常口: 数え漏れで固着した時に、その場で解除する。
 * 通常の経路では呼ばない（呼ぶ必要がある＝どこかで解除が漏れている、の合図）。
 */
export function forceReleaseBodyScroll() {
    depth = 0;
    if (typeof document !== 'undefined' && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = savedOverflow ?? '';
    }
    savedOverflow = null;
}
/** 今いくつのモーダルが背景スクロールを止めているか（試験・診断用）。 */
export function getBodyScrollLockDepth() {
    return depth;
}
//# sourceMappingURL=scrollLock.js.map