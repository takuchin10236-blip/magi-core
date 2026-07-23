/**
 * ColorModeSwitch — White/Dark だけの職員向け色切替（v0.5・AppShell）。
 *
 * DisplaySwitch（8テーマ・プリセット選択つき）は温存する。こちらは職員が日常で
 *   触る最小の2択だけを出す簡素版。useThemeState の返り値をそのまま渡せる
 *   （themeMode / onThemeMode だけを要求＝ThemeState は構造的に代入可能）。
 * 表示名は日本語「ホワイト」「ダーク」（職員向けの分かりやすさ優先）。
 */
import { Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ThemeMode } from './uiPresets';

const MODES: Array<{ value: ThemeMode; label: string; icon: LucideIcon; description: string }> = [
  { value: 'white', label: 'ホワイト', icon: Sun, description: '明るい背景で表示します' },
  { value: 'dark', label: 'ダーク', icon: Moon, description: '暗い背景で表示します' },
];

export interface ColorModeSwitchProps {
  themeMode: ThemeMode;
  onThemeMode: (value: ThemeMode) => void;
  /** アプリ固有の微調整用（本体クラスの再定義には使わない）。 */
  className?: string;
}

export function ColorModeSwitch({ themeMode, onThemeMode, className }: ColorModeSwitchProps) {
  return (
    <div
      className={`magi-appshell-colormode${className ? ` ${className}` : ''}`}
      role="group"
      aria-label="色テーマ"
    >
      {MODES.map((item) => {
        const Icon = item.icon;
        const active = themeMode === item.value;
        return (
          <button
            aria-pressed={active}
            className={active ? 'active' : ''}
            key={item.value}
            onClick={() => onThemeMode(item.value)}
            title={item.description}
            type="button"
          >
            <Icon size={15} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
