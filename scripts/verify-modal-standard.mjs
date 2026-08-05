import { readFileSync } from 'node:fs';

const files = {
  modal: readFileSync(new URL('../src/ui/DraggableModal.tsx', import.meta.url), 'utf8'),
  confirm: readFileSync(new URL('../src/ui/ConfirmModal.tsx', import.meta.url), 'utf8'),
  design: readFileSync(new URL('../src/ui/design-system.css', import.meta.url), 'utf8'),
  core: readFileSync(new URL('../src/ui/core.css', import.meta.url), 'utf8'),
  scrollLock: readFileSync(new URL('../src/ui/scrollLock.ts', import.meta.url), 'utf8'),
};

const checks = [
  ['親枠内ドラッグ', files.modal.includes('bounds="parent"')],
  ['Escapeキー', files.modal.includes("event.key === 'Escape'")],
  // v0.13.6: 各モーダルが自前で退避・復元すると、入れ子で同時に閉じた時に 'hidden' が書き戻される
  // （2026-08-05 連絡ノート実機）。参照カウント（scrollLock）へ移した後も「止めていること」は検査し続ける。
  ['背景スクロール停止', files.modal.includes('lockBodyScroll()') && files.scrollLock.includes("doc.body.style.overflow = 'hidden'")],
  ['背景スクロールを自前で復元しない', !files.modal.includes('document.body.style.overflow =')],
  ['フォーカス復帰', files.modal.includes('previouslyFocused?.focus()')],
  ['Tabフォーカス循環', files.modal.includes("event.key === 'Tab'") && files.modal.includes('querySelectorAll<HTMLElement>')],
  ['固定フッタprop', files.modal.includes('footer?: ReactNode') && files.modal.includes('magi-modal-footer')],
  ['確認画面の固定フッタ', files.confirm.includes('footer={(')],
  ['閉じる印をSVGで中央固定', files.modal.includes('className="magi-modal-close-icon"') && !files.modal.includes('>×<')],
  ['閉じるSVG寸法/design-system', /\.magi-modal-close-icon[\s\S]*?width:\s*24px;[\s\S]*?height:\s*24px;/.test(files.design)],
  ['閉じるSVG寸法/core', /\.magi-modal-close-icon[\s\S]*?width:\s*24px;[\s\S]*?height:\s*24px;/.test(files.core)],
  ['44px閉じるボタン/design-system', /\.magi-modal-close[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/.test(files.design)],
  ['枠内スクロール/design-system', /\.magi-modal-body[\s\S]*?overflow-y:\s*auto;/.test(files.design)],
  ['44px閉じるボタン/core', /\.magi-modal-close[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/.test(files.core)],
  ['枠内スクロール/core', /\.magi-modal-body[\s\S]*?overflow-y:\s*auto;/.test(files.core)],
  // 2026-08-05 追加: モーダルが背面に回る事故の再発防止（実機・職員指導記録アプリ）。
  // 旧実装は portal を使わず既定 zIndex=50 で、ヘッダのメニュー(500)に負けていた。
  ['body直下へポータル', files.modal.includes('createPortal') && files.modal.includes('document.body')],
  ['重なりはトークン経由（生数値の既定値を作らない）', /zIndex = 'var\(--magi-z-/.test(files.modal)],
  ['重なりトークンの階段が定義済み/design-system', /--magi-z-modal:\s*\d+/.test(files.design) && /--magi-z-header-popover:\s*\d+/.test(files.design)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
}
if (failed.length > 0) process.exit(1);

console.log(`U8 modal standard: ${checks.length} checks passed`);
