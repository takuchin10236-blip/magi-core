import { type ThemeMode } from './uiPresets';
export declare function subscribeColorMode(onStoreChange: () => void): () => void;
export declare function readColorMode(): ThemeMode;
export declare function readServerColorMode(): ThemeMode;
/** いまの色モード。属性が変われば再描画される。 */
export declare function useColorMode(): ThemeMode;
//# sourceMappingURL=colorMode.d.ts.map