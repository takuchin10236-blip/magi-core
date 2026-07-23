import { readFileSync } from 'node:fs';

const files = {
  modal: readFileSync(new URL('../src/ui/DraggableModal.tsx', import.meta.url), 'utf8'),
  confirm: readFileSync(new URL('../src/ui/ConfirmModal.tsx', import.meta.url), 'utf8'),
  design: readFileSync(new URL('../src/ui/design-system.css', import.meta.url), 'utf8'),
  core: readFileSync(new URL('../src/ui/core.css', import.meta.url), 'utf8'),
};

const checks = [
  ['親枠内ドラッグ', files.modal.includes('bounds="parent"')],
  ['Escapeキー', files.modal.includes("event.key === 'Escape'")],
  ['背景スクロール停止', files.modal.includes("document.body.style.overflow = 'hidden'")],
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
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
}
if (failed.length > 0) process.exit(1);

console.log(`U8 modal standard: ${checks.length} checks passed`);
