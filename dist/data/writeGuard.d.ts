import type { AccessUser, Env, WriteReason } from './types';
export type WriteState = {
    allowed: boolean;
    blocks: WriteReason[];
};
export declare function writeState(env: Env, user: AccessUser, requireAdmin?: boolean): WriteState;
export declare function assertAllowedUser(user: AccessUser): void;
export declare function assertWriteAllowed(env: Env, user: AccessUser, requireAdmin?: boolean): void;
//# sourceMappingURL=writeGuard.d.ts.map