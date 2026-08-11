/**
 * 履歴エントリに同伴させる付帯情報（アプリが自由に決める。例: 本文の「← 戻る」の帰り先）。
 *
 * なぜ型を決めないか: エントリに何を載せたいかはアプリ固有で、core が形を決めると
 * 次のアプリで必ず合わない。**載せられること**だけを保証し、中身の解釈はアプリに委ねる。
 */
export type HistoryRouteState = unknown;
/**
 * 画面が変わった由来。`onRoute` の第3引数で届く。
 * 'navigate' ＝ アプリが `navigate()` を呼んだ（タブ・カードの押下）。
 * 'popstate' ＝ ブラウザの戻る/進む（マウスのサイドボタン・トラックパッドのスワイプを含む）。
 *
 * 使い道は「由来で変えたいものだけ」——例: 押して進む時のスクロールは滑らかに、
 * 戻ってきた時は即座に（戻る操作で滑らかに流れると、職員には「戻っていない」ように見える）。
 */
export type HistoryRouteCause = 'navigate' | 'popstate';
export interface UseHistoryRouteOptions<Route> {
    /** URLの断片（location.hash）からアプリのルートを作る。 */
    parse: (hash: string) => Route;
    /** ルートからURLの断片を作る（parse の逆・'#' を含む文字列）。 */
    format: (route: Route) => string;
    /**
     * fail-closed。届いたルートを、いま許される形へ落とす（省略時は素通し）。
     * **直リンク（初回読込）・戻る/進む・navigate の全経路で必ず通る**＝片方だけ緩い状態を作らない。
     * これを片側だけに掛けると「記名が要る画面を直リンクされた時だけ素通り」のような穴が残る。
     */
    guard?: (route: Route) => Route;
    /**
     * **画面の唯一の反映点**。URLが確定した後に呼ばれる（`navigate` でも戻る/進むでも同じここ）。
     * `state` は履歴エントリの付帯情報、`cause` は由来（'navigate' / 'popstate'）。
     * マウント時は呼ばれない（初回は `initialRoute` を使う）。
     */
    onRoute: (route: Route, state: HistoryRouteState, cause: HistoryRouteCause) => void;
    /** いま画面を離れてよいか（書きかけ保護）。false を返すと onBlocked が呼ばれる。省略時は常に true。 */
    canLeave?: (to: Route) => boolean;
    /** 離脱を止めた時。アプリが確認モーダル等を出し、続行してよくなったら resume() を呼ぶ。 */
    onBlocked?: (resume: () => void, to: Route) => void;
}
export interface HistoryRouteApi<Route> {
    /**
     * 画面を移る唯一の入口。既定は履歴を積む（push）。既定で `canLeave` を通る。
     *
     * `force: true` は `canLeave` を迂回する。**「職員に断らせてはいけない移動」専用**——
     * 権限や記名が失効して、いま開いている画面をもう見せられない時の追い出しがこれにあたる。
     * ここを通常の確認へ流すと、職員が「書きかけを続ける」を押すだけで**追い出しを拒否でき**、
     * しかも多くの実装は再試行しないので、見せられない画面に居座られる（2026-08-11 実測の後退）。
     * 逆に、職員の意思で移る操作（タブ・カード・リンク）へ force を使ってはいけない。
     */
    navigate: (route: Route, options?: {
        replace?: boolean;
        state?: HistoryRouteState;
        force?: boolean;
    }) => void;
    /** リンクの href に使う断片。履歴に積む形と同じ関数から作る（形の二重管理をしない）。 */
    hrefFor: (route: Route) => string;
    /** 初回読込時に guard を通したルート。アプリの useState 初期値に使う。 */
    initialRoute: Route;
}
/**
 * 修飾キー無しの左クリックだけを SPA 遷移にする判定。
 * Command/Ctrl/Shift/Alt・中クリック・右クリックは false ＝「新しいタブで開く」等の
 * ブラウザ標準へ譲る。カード等を <button> でなく本物の <a href> で作る時に使う
 * （本物のリンクにしておくと、職員が「新しいタブで開く」「リンクをコピー」を普通に使える）。
 *
 * 引数は必要な5つだけを要求する形（Pick）にしてある＝React の合成イベントも
 * ネイティブの MouseEvent も、そのまま渡せる。
 */
export declare function isPlainLeftClick(event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'button'>): boolean;
export declare function useHistoryRoute<Route>(options: UseHistoryRouteOptions<Route>): HistoryRouteApi<Route>;
//# sourceMappingURL=useHistoryRoute.d.ts.map