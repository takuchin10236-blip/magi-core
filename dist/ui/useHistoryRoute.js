/**
 * useHistoryRoute — ブラウザの「戻る/進む」を業務アプリに効かせる汎用フック（v0.18.0）
 *
 * 事の起こり（2026-08-11 社長指示「戻る、進むは、結構大事」）:
 *   MAGI の業務アプリは hash ルーティングの単一ページアプリで、画面遷移が
 *   `replaceState`（履歴の書き換え）だけ＝**履歴を1回も積まず、popstate の耳も無かった**。
 *   職員がブラウザの戻るボタン（マウスのサイドボタン・トラックパッドの横スワイプを含む）を
 *   押すと、1つ前の作業画面ではなく**アプリの外**へ出る。2階マニュアルハブ v0.9.0 で実装し、
 *   本番配備・社長実機確認まで通した仕組みを、ルートの形に依存しない形へ蒸留した。
 *
 * このフックが持つのは「URLと履歴」だけ。**ルートの形（view/id 等）・URL断片の作り方・
 * 確認モーダルの文言・fail-closed の中身・スクロール復元先は、全部アプリが渡す側**にある
 * （持ち込むと、アプリごとに違うものを core が決めてしまい、次のアプリで必ず剥がすことになる）。
 *
 * ── 使い方の骨格 ──
 *   const history = useHistoryRoute<Route>({
 *     parse: (hash) => parseAppHash(hash),          // URL断片 → ルート
 *     format: (route) => routeHash(route),          // ルート → URL断片（parse の逆）
 *     guard: (route) => (canSee(route) ? route : HOME),  // fail-closed（全経路を通る）
 *     onRoute: (route, state) => applyScreen(route, state),    // 画面を出す（唯一の反映点）
 *     canLeave: (to) => !(view === 'suggest' && dirty),        // 書きかけ保護
 *     onBlocked: (resume) => setPendingLeave(() => resume),    // 確認モーダルへ預ける
 *   });
 *   const [route, setRoute] = useState<Route>(history.initialRoute);  // 直リンクの受け口
 *   <a href={history.hrefFor(next)} onClick={(e) => { if (!isPlainLeftClick(e)) return;
 *      e.preventDefault(); history.navigate(next); }}>…</a>
 *
 * ── 画面の反映点は1つ（`onRoute`）。このフックは setState を1つも持たない ──
 *   `navigate`（タブ・カード押下）でも、戻る/進む（popstate）でも、止めた後の `resume()` でも、
 *   **URLを確定させてから同じ `onRoute` を呼ぶ**。アプリは画面の組み立てを1か所に書けばよい。
 *
 *   なぜ1つに揃えるか: 経路ごとに反映を書くと、必ずどれかが古いまま取り残される
 *   （書きかけ保護の塞ぎ忘れと同じ構図）。反映点が1つなら、経路が増えても書き足す場所は増えない。
 *   第3引数 `cause` で由来（'navigate' / 'popstate'）を渡すので、スクロールを滑らかにするか
 *   即座に飛ばすか等、**由来で変えたいものだけ**をアプリが分岐できる。
 *
 *   ただし**マウント時は呼ばない**（初回は `initialRoute` を useState の初期値に使う想定で、
 *   ここで呼ぶと初回描画と二重に画面を組むことになる）。
 */
import { useEffect, useRef, useState } from 'react';
/**
 * 修飾キー無しの左クリックだけを SPA 遷移にする判定。
 * Command/Ctrl/Shift/Alt・中クリック・右クリックは false ＝「新しいタブで開く」等の
 * ブラウザ標準へ譲る。カード等を <button> でなく本物の <a href> で作る時に使う
 * （本物のリンクにしておくと、職員が「新しいタブで開く」「リンクをコピー」を普通に使える）。
 *
 * 引数は必要な5つだけを要求する形（Pick）にしてある＝React の合成イベントも
 * ネイティブの MouseEvent も、そのまま渡せる。
 */
export function isPlainLeftClick(event) {
    return !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
}
/** SSR（window が無い）でも初回描画を落とさないための断片の読み取り。サーバでは空＝parse の既定値へ落ちる。 */
function readHash() {
    return typeof window === 'undefined' ? '' : window.location.hash;
}
export function useHistoryRoute(options) {
    const { parse, format, guard, onRoute, canLeave, onBlocked } = options;
    /** fail-closed を1か所に集約する（guard 未指定なら素通し）。全経路がここを通る。 */
    const applyGuard = (route) => (guard ? guard(route) : route);
    // 初回読込のルート。描画のたびに解き直さない（useState の遅延初期化＝1度だけ走る）。
    // window を触るのは readHash の中だけなので、サーバ描画では parse('') が使われる。
    const [initialRoute] = useState(() => applyGuard(parse(readHash())));
    // 「いまURLが指している場所」。書きかけ保護で戻るを止めた時、**ここへURLを積み直す**。
    // 画面の状態はアプリが持つので、フックは自分が最後に書いた行き先だけを覚えておく。
    const currentRoute = useRef(initialRoute);
    const currentState = useRef(null);
    /**
     * URL断片を書く。
     *
     * push で**同じ断片なら積まずに置き換える**——同じタブの押し直しで履歴が無限に積み上がり、
     * 戻るボタンが同じ画面で何回も空回りするのを防ぐ。ただし**書かずに素通りはしない**：
     * 付帯情報（state）だけが違う場合、素通りさせると「画面は新しい state で組み立てられたのに、
     * 履歴エントリは古い state のまま」という食い違いが残り、再読込で帰り先が巻き戻る
     * （2026-08-11 の二系統レビューで実測。同じ本文へ別の一覧から入り直した時に踏む）。
     * 置き換えなら履歴は増えず、画面とエントリが必ず一致する。
     *
     * replace は常に書く＝popstate の後始末で「URLを正規形へ揃え直す」役目があり、
     * ここを飛ばすと guard で落とした時の食い違いが残る。
     */
    function writeHash(hash, mode, state) {
        if (mode === 'push' && window.location.hash !== hash) {
            window.history.pushState(state, '', hash);
            return;
        }
        window.history.replaceState(state, '', hash);
    }
    /** フックが覚えている「現在地」を、いま履歴に書いた内容へ合わせる。 */
    function settle(route, state) {
        currentRoute.current = route;
        currentState.current = state;
    }
    useEffect(() => {
        // 戻る/進むの画面復元は採用アプリが自分で行う（画面が丸ごと入れ替わるため、
        // ブラウザの自動スクロール復元と相性が悪い＝関係ない位置へ飛ばされる）。
        if ('scrollRestoration' in window.history)
            window.history.scrollRestoration = 'manual';
        // 最初のURLを正規形にする（履歴は増やさない＝replace）。戻る/進むの比較の起点をここで揃える。
        // **素の parse 結果ではなく guard を通した後**を書く。ここを素通しにすると、記名が要る画面を
        // 直リンクされた時に「画面はホーム・URLは #mine」の食い違いが残り、後から記名して再読込した
        // 職員に**開いた覚えのない画面**が開く（2026-08-11 に実際に踏んだ穴）。
        // 付帯情報は今のエントリのものを引き継ぐ（再読込では history.state が生き残る＝null で潰さない）。
        currentState.current = window.history.state ?? null;
        writeHash(format(initialRoute), 'replace', currentState.current);
        currentRoute.current = initialRoute;
        // マウント時に1度だけ（initialRoute は useState で固定済み＝描画のたびに解き直さない）。
    }, []);
    /**
     * ブラウザの戻る/進む（マウスのサイドボタン・トラックパッドのスワイプを含む）。
     * ブラウザはURLだけを先に動かして popstate を投げてくるので、その断片から行き先を組み立て、
     * 直リンクと同じ guard を通してからアプリへ渡す。
     */
    useEffect(() => {
        function onPopState() {
            const to = applyGuard(parse(window.location.hash));
            // 届いたエントリの付帯情報は、URLを積み直す**前に**退避する
            // （下の pushState を先に走らせると history.state が入れ替わり、帰り先の復元が黙って死ぬ）。
            const poppedState = window.history.state ?? null;
            /** 移動を確定させる。URLを目的地の正規形へ揃えてから画面を反映する（逆順だと反映中に読まれるURLが古い）。 */
            const resume = () => {
                // 常に置き換える＝guard で落とした時・アプリ内専用の断片（送信完了画面等）が
                // 戻るで届いた時の食い違いを、次の再読込へ持ち越さない。
                writeHash(format(to), 'replace', poppedState);
                settle(to, poppedState);
                onRoute(to, poppedState, 'popstate');
            };
            if (canLeave && !canLeave(to)) {
                // URLは既に目的地へ動いてしまっている。**画面（現在地）とURLを一致させ直してから**尋ねる
                // ＝「書きかけを続ける」でそのまま留まれるし、その場で再読込しても同じ画面に居られる。
                // 積み直した分だけ履歴に重複が1つ残るが、もう一度戻ればもう一度尋ねる＝安全側に倒れる。
                window.history.pushState(currentState.current, '', format(currentRoute.current));
                onBlocked?.(resume, to);
                return;
            }
            resume();
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
        // 依存配列を意図して付けていない（**付けるな**）: 毎レンダーで購読し直すことで、ハンドラが
        // 掴む canLeave / guard / onRestore が常に最新の描画のものになる。依存配列で「最適化」すると、
        // 列挙し漏れた値が古いまま固まる（stale closure）＝**書きかけ保護が黙って抜ける**。
        // 購読の張り替えは addEventListener の付け外し1組で、実測できる負荷ではない。
    });
    /**
     * 画面を移る唯一の入口。タブ押下・カード押下・戻るボタンが**同じ1つのガード層**を通ることで、
     * 「書きかけが消える経路」の塞ぎ忘れが構造的に起きなくなる（経路ごとに塞ぐと必ず1つ残る）。
     *
     * 通った時は、URLを書いてから `onRoute(..., 'navigate')` を呼ぶ＝戻る/進むと同じ反映点。
     * 呼び出し元は「どこへ行くか」だけを言えばよく、画面の組み立てを各所に書かない。
     */
    function navigate(route, navigateOptions = {}) {
        const to = applyGuard(route);
        const state = navigateOptions.state ?? null;
        const run = () => {
            writeHash(format(to), navigateOptions.replace ? 'replace' : 'push', state);
            settle(to, state);
            onRoute(to, state, 'navigate');
        };
        // force ＝ 権限・記名の失効による追い出し。職員に拒否させない（上の JSDoc 参照）。
        if (!navigateOptions.force && canLeave && !canLeave(to)) {
            // 履歴は1ミリも動かさない（この経路ではまだ何も起きていない＝取り消す物が無い）。
            // resume はこの run＝「URLを書いて画面も反映する」で、popstate 経路の resume と意味が揃う。
            onBlocked?.(run, to);
            return;
        }
        run();
    }
    return {
        navigate,
        // guard は通さない＝リンクは「アプリが出すと決めた行き先」をそのまま指す
        // （見えている行き先とURLがずれると、コピーして共有した時に別の場所が開く）。
        hrefFor: (route) => format(route),
        initialRoute,
    };
}
//# sourceMappingURL=useHistoryRoute.js.map