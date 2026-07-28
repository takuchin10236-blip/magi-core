/**
 * useBusyGuard — 連打・二重送信を物理的に防ぐフック（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * 社長指示（2026-07-28）の物理化。待ち時間に不安になった人は必ず連打する。
 * 「押せてしまうが2回目は無視される」ではなく、「処理中は押せない」を既定にする。
 *
 * 使い方:
 *   const { busy, run } = useBusyGuard();
 *   <Button busy={busy} onClick={() => run(() => save(payload))}>保存</Button>
 *
 * 保証すること:
 *   - run 実行中に再度 run が呼ばれても、2回目以降は**発火しない**（await 中の多重送信を殺す）
 *   - 例外が出ても必ず busy を戻す（押せないまま固まらない）
 *   - アンマウント後に state を触らない
 */
import { useCallback, useEffect, useRef, useState } from 'react';
export function useBusyGuard() {
    const [busy, setBusy] = useState(false);
    // state は非同期に反映されるため、多重送信の判定は ref で行う（連打はミリ秒で来る）。
    const runningRef = useRef(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);
    const run = useCallback(async (task) => {
        if (runningRef.current)
            return false;
        runningRef.current = true;
        if (mountedRef.current)
            setBusy(true);
        try {
            await task();
            return true;
        }
        finally {
            runningRef.current = false;
            if (mountedRef.current)
                setBusy(false);
        }
    }, []);
    return { busy, run };
}
//# sourceMappingURL=useBusyGuard.js.map