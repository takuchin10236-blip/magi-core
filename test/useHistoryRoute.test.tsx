/**
 * useHistoryRoute の振る舞い試験（v0.18.0）。
 *
 * 事の起こり（2026-08-11 社長指示「戻る、進むは、結構大事」）: 業務アプリの画面遷移が
 * replaceState だけ＝履歴を1回も積まず、popstate の耳も無かったため、職員が戻るボタンを
 * 押すとアプリの外へ出ていた。2階マニュアルハブ v0.9.0 で実装し実機確認まで通った仕組みを
 * core へ蒸留した便で、ここでは**ルートの形に依存しない部分だけ**を固定する。
 *
 * 戻る操作は、実ブラウザと同じ順序（**URLと付帯情報が先に目的地へ動いてから popstate が届く**）を
 * replaceState + PopStateEvent で再現する（jsdom の履歴走査に依存しない＝決定的にする）。
 */
import { useState } from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useHistoryRoute, isPlainLeftClick, type HistoryRouteApi, type HistoryRouteCause, type HistoryRouteState } from '../src/ui/useHistoryRoute';

/** 試験用の（アプリ固有を模した）ルート。core はこの形を1つも知らない。 */
type Route = { view: 'home' | 'list' | 'mine'; itemId?: string };

const HOME: Route = { view: 'home' };

function parse(hashValue: string): Route {
  const hash = hashValue.replace(/^#/, '');
  if (hash.startsWith('item/')) return { view: 'list', itemId: hash.slice('item/'.length) };
  if (hash === 'list' || hash === 'mine') return { view: hash };
  return HOME;
}

function format(route: Route): string {
  return route.itemId ? `#item/${route.itemId}` : `#${route.view}`;
}

/** 記名が要る画面（'mine'）は、記名していなければホームへ落とす＝アプリ側の fail-closed の模型。 */
function signedOutGuard(route: Route): Route {
  return route.view === 'mine' ? HOME : route;
}

interface HarnessProps {
  /** fail-closed を有効にするか（＝未記名の職員を想定）。 */
  guarded?: boolean;
  /** 書きかけがあるか（canLeave=false）。 */
  dirty?: boolean;
}

const restored: Array<{ route: Route; state: HistoryRouteState; cause: HistoryRouteCause }> = [];
const blocked: Array<{ resume: () => void; to: Route }> = [];
let api: HistoryRouteApi<Route> | null = null;

function Harness({ guarded = false, dirty = false }: HarnessProps) {
  const history = useHistoryRoute<Route>({
    parse,
    format,
    guard: guarded ? signedOutGuard : undefined,
    // 画面の反映点は1つだけ（navigate 経路も戻る/進む経路もここへ来る）。
    // 押した側で setRoute を書き足さないのが、このAPIの要点。
    onRoute: (route, state, cause) => {
      restored.push({ route, state, cause });
      setRoute(route);
    },
    canLeave: () => !dirty,
    onBlocked: (resume, to) => {
      blocked.push({ resume, to });
    },
  });
  // 直リンクの受け口＝初回描画は guard を通した後のルートで始まる。
  const [route, setRoute] = useState<Route>(history.initialRoute);
  api = history;
  return (
    <div>
      <span data-testid="view">{route.view}</span>
      <span data-testid="item">{route.itemId ?? ''}</span>
      <a data-testid="link" href={history.hrefFor({ view: 'list', itemId: 'a1' })}>
        文書A
      </a>
      <button onClick={() => history.navigate({ view: 'list' })} type="button">
        一覧へ
      </button>
    </div>
  );
}

/** 実ブラウザの「戻る/進む」を再現する: URLと付帯情報が先に目的地へ動き、その後 popstate が届く。 */
function travel(hash: string, state: HistoryRouteState = null) {
  window.history.replaceState(state, '', hash);
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function renderAt(hash: string, props: HarnessProps = {}) {
  window.history.replaceState(null, '', hash);
  return render(<Harness {...props} />);
}

beforeEach(() => {
  restored.length = 0;
  blocked.length = 0;
  api = null;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '#');
});

describe('画面遷移と履歴（push）', () => {
  it('navigate は履歴を積む（＝戻るボタンの土台）', () => {
    renderAt('#home');
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      api?.navigate({ view: 'list' });
    });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][2]).toBe('#list');
    expect(window.location.hash).toBe('#list');
  });

  it('同じ断片への navigate は積まない（同じタブの押し直しで履歴が無限に積み上がらない）', () => {
    renderAt('#home');
    act(() => {
      api?.navigate({ view: 'list' });
    });
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      api?.navigate({ view: 'list' });
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('navigate に渡した state が履歴エントリに載る（書き側の契約）', () => {
    // これが無いと、将来この受け渡しを落としても復元試験は state を手渡ししているため全部緑のまま通る
    // ＝「戻る/進むで帰った時の帰り先復元」が黙って死ぬ（2026-08-11 二系統レビューの指摘）。
    renderAt('#home');
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      api?.navigate({ view: 'list', itemId: 'a1' }, { state: { returnView: 'home' } });
    });
    expect(push.mock.calls[0][0]).toEqual({ returnView: 'home' });
    expect(push.mock.calls[0][2]).toBe('#item/a1');
  });

  it('replace 指定なら履歴を積まずに書き換える', () => {
    renderAt('#home');
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    act(() => {
      api?.navigate({ view: 'list' }, { replace: true });
    });
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#list');
  });

  it('hrefFor は履歴に積むのと同じ断片を返す（形の二重管理をしない）', () => {
    renderAt('#home');
    expect(screen.getByTestId('link').getAttribute('href')).toBe('#item/a1');
    expect(api?.hrefFor({ view: 'mine' })).toBe(format({ view: 'mine' }));
  });

  it('hrefFor は guard を通さない（リンクは「アプリが出すと決めた行き先」を指す）', () => {
    // 通すと、見えている行き先とURLがずれ、コピーして共有した時に別の場所が開く。
    // guarded な状況でも hrefFor の値が変わらないことで、この設計判断を固定する。
    renderAt('#home', { guarded: true });
    expect(api?.hrefFor({ view: 'mine' })).toBe('#mine');
  });

  it('同じ断片でも付帯情報が違えば履歴エントリを置き換える（画面と履歴を食い違わせない）', () => {
    // 素通りさせると「画面は新しい state・エントリは古い state」になり、再読込で帰り先が巻き戻る
    // （2026-08-11 二系統レビューで実測した取り違え）。積まないが、書きはする。
    renderAt('#home');
    act(() => {
      api?.navigate({ view: 'list', itemId: 'a1' }, { state: { returnView: 'list' } });
    });
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      api?.navigate({ view: 'list', itemId: 'a1' }, { state: { returnView: 'search' } });
    });

    expect(push).not.toHaveBeenCalled(); // 履歴は増やさない
    expect(window.history.state).toEqual({ returnView: 'search' }); // でもエントリは最新
    expect(restored[restored.length - 1].state).toEqual({ returnView: 'search' });
  });

  it('navigate も onRoute を呼ぶ（画面の反映点は1つ・由来は navigate）', () => {
    // このAPIの要点。押した側で画面を組み立てる形に戻すと、経路が増えるたびに
    // 反映の書き足しが要り、必ずどれかが取り残される（＝書きかけ保護の塞ぎ忘れと同じ構図）。
    renderAt('#home');
    act(() => {
      api?.navigate({ view: 'list', itemId: 'a1' }, { state: { returnView: 'home' } });
    });

    expect(restored).toHaveLength(1);
    expect(restored[0].route).toEqual({ view: 'list', itemId: 'a1' });
    expect(restored[0].state).toEqual({ returnView: 'home' });
    expect(restored[0].cause).toBe('navigate');
    // 押した側は setRoute を書いていない（Harness の button 参照）。それでも画面が変わる。
    expect(screen.getByTestId('item').textContent).toBe('a1');
  });

  it('マウント時には onRoute を呼ばない（初回は initialRoute で組むので二重反映になる）', () => {
    renderAt('#item/a1');
    expect(restored).toHaveLength(0);
    expect(screen.getByTestId('item').textContent).toBe('a1');
  });

  it('同じ断片で積まなかった時も画面は反映する（押した手応えが消えない）', () => {
    renderAt('#list');
    act(() => {
      api?.navigate({ view: 'list' });
    });
    expect(restored).toHaveLength(1);
    expect(restored[0].cause).toBe('navigate');
  });

  it('マウント時にブラウザの自動スクロール復元を切る（画面が丸ごと入れ替わるため）', () => {
    window.history.scrollRestoration = 'auto';
    renderAt('#home');
    expect(window.history.scrollRestoration).toBe('manual');
  });
});

describe('戻る/進むによる復元（popstate）', () => {
  it('onRoute が呼ばれ、届いたエントリの付帯情報と由来 popstate も渡る', () => {
    renderAt('#home');
    act(() => {
      api?.navigate({ view: 'list' });
    });
    restored.length = 0; // navigate 分は上で見る。ここは戻る/進む経路だけを見る。

    travel('#item/a1', { returnView: 'list' });

    expect(restored).toHaveLength(1);
    expect(restored[0].route).toEqual({ view: 'list', itemId: 'a1' });
    expect(restored[0].state).toEqual({ returnView: 'list' });
    expect(restored[0].cause).toBe('popstate');
    expect(screen.getByTestId('item').textContent).toBe('a1');
  });

  it('guard が戻る/進む経路で効き、URLも guard 後の形へ置き換わる', () => {
    // 「画面はホーム・URLは #mine」を持ち越すと、後から記名して再読込した職員に
    // 開いた覚えのない画面が開く（2026-08-11 実測）。URLの後始末まで見る。
    renderAt('#home', { guarded: true });
    travel('#mine');

    expect(restored[0].route).toEqual(HOME);
    expect(screen.getByTestId('view').textContent).toBe('home');
    expect(window.location.hash).toBe('#home');
  });
});

describe('直リンク（初回読込）', () => {
  it('guard が初回読込でも効き、initialRoute も URL も guard 後になる', () => {
    // 戻る/進む経路だけ塞いで「根治」と名乗らない（片方だけ緩い状態を作らない）。
    renderAt('#mine', { guarded: true });

    expect(screen.getByTestId('view').textContent).toBe('home');
    expect(window.location.hash).toBe('#home');
  });

  it('guard が無ければ直リンクの断片をそのまま初期ルートにする', () => {
    renderAt('#item/a1');
    expect(screen.getByTestId('view').textContent).toBe('list');
    expect(screen.getByTestId('item').textContent).toBe('a1');
    expect(window.location.hash).toBe('#item/a1');
  });
});

describe('書きかけ保護（canLeave / onBlocked）', () => {
  it('戻るを止めた時は onBlocked が呼ばれ、URLは現在地のまま', () => {
    renderAt('#home', { dirty: true });
    travel('#list');

    expect(restored).toHaveLength(0);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].to).toEqual({ view: 'list' });
    // URLは先に動いてしまう分を積み直してある＝その場で再読込しても同じ画面に居られる。
    expect(window.location.hash).toBe('#home');
    expect(screen.getByTestId('view').textContent).toBe('home');
  });

  it('resume を呼んで初めて移り、URLも目的地に揃う', () => {
    renderAt('#home', { dirty: true });
    travel('#list');
    act(() => {
      blocked[0].resume();
    });

    expect(restored).toHaveLength(1);
    expect(restored[0].route).toEqual({ view: 'list' });
    expect(screen.getByTestId('view').textContent).toBe('list');
    expect(window.location.hash).toBe('#list');
  });

  it('navigate 経路でも canLeave が効く（タブ押下と戻るボタンが同じガード層を通る）', () => {
    renderAt('#home', { dirty: true });
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      api?.navigate({ view: 'list' });
    });

    expect(blocked).toHaveLength(1);
    expect(blocked[0].to).toEqual({ view: 'list' });
    // 止めた時点では履歴を1ミリも動かさない（取り消す物を作らない）。
    expect(push).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#home');
  });

  it('navigate を止めた後の resume で、履歴が積まれ画面も移る（resume の意味が両経路で同じ）', () => {
    // ここが 2026-08-11 還流時にタチコマが見つけた非対称の本丸。
    // resume が経路によって「URLだけ」「URL＋画面」と揺れると、アプリは onBlocked を1つしか
    // 持てないので、必ずどちらかの経路で二重反映か無反映を踏む。両経路とも onRoute まで担う。
    renderAt('#home', { dirty: true });
    act(() => {
      api?.navigate({ view: 'list' });
    });
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      blocked[0].resume();
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#list');
    expect(restored).toHaveLength(1);
    expect(restored[0].cause).toBe('navigate');
    expect(screen.getByTestId('view').textContent).toBe('list');
  });

  it('force は canLeave を迂回する（権限が失効した画面からの追い出しを職員に断らせない）', () => {
    // ここを通常の確認へ流すと、職員が「書きかけを続ける」を押すだけで追い出しを拒否でき、
    // 多くの実装は再試行しないので見せられない画面に居座られる（2026-08-11 実測の後退）。
    renderAt('#home', { dirty: true });
    act(() => {
      api?.navigate({ view: 'home' }, { replace: true, force: true });
    });

    expect(blocked).toHaveLength(0);
    expect(restored).toHaveLength(1);
    expect(restored[0].route).toEqual(HOME);
  });

  it('canLeave は guard を通した後の行き先で判断する（見ていない行き先で尋ねない）', () => {
    renderAt('#home', { guarded: true, dirty: true });
    act(() => {
      api?.navigate({ view: 'mine' });
    });
    expect(blocked[0].to).toEqual(HOME);
  });
});

describe('isPlainLeftClick', () => {
  it('素の左クリックだけ true', () => {
    expect(isPlainLeftClick({ metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, button: 0 })).toBe(true);
  });

  it('修飾キー付き・中クリック・右クリックは false（ブラウザ標準へ譲る）', () => {
    const plain = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, button: 0 };
    expect(isPlainLeftClick({ ...plain, metaKey: true })).toBe(false);
    expect(isPlainLeftClick({ ...plain, ctrlKey: true })).toBe(false);
    expect(isPlainLeftClick({ ...plain, shiftKey: true })).toBe(false);
    expect(isPlainLeftClick({ ...plain, altKey: true })).toBe(false);
    expect(isPlainLeftClick({ ...plain, button: 1 })).toBe(false);
    expect(isPlainLeftClick({ ...plain, button: 2 })).toBe(false);
  });

  it('React の合成イベントもそのまま渡せる（必要な5つだけ要求している）', () => {
    let received: boolean | null = null;
    render(
      <button onClick={(event) => { received = isPlainLeftClick(event); }} type="button">
        押す
      </button>,
    );
    fireEvent.click(screen.getByText('押す'));
    expect(received).toBe(true);
  });
});
