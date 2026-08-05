import { readFileSync } from 'node:fs';

const files = {
  modal: readFileSync(new URL('../src/ui/DraggableModal.tsx', import.meta.url), 'utf8'),
  confirm: readFileSync(new URL('../src/ui/ConfirmModal.tsx', import.meta.url), 'utf8'),
  design: readFileSync(new URL('../src/ui/design-system.css', import.meta.url), 'utf8'),
  core: readFileSync(new URL('../src/ui/core.css', import.meta.url), 'utf8'),
  scrollLock: readFileSync(new URL('../src/ui/scrollLock.ts', import.meta.url), 'utf8'),
  manual: readFileSync(new URL('../src/ui/ManualViewer.tsx', import.meta.url), 'utf8'),
};

// 背景スクロールを止める部品はすべてここに挙げる。scrollLock.ts だけが body を直接触ってよい。
// （v0.13.7: 直した箇所は2つなのに番人が1つだった＝ManualViewer の全面退行が全ゲートを
//   素通りした二系統レビューの指摘。以後「止める部品」を足したらこの表に足す。）
const SCROLL_OWNERS = [
  ['DraggableModal.tsx', files.modal],
  ['ManualViewer.tsx', files.manual],
];
// 綴りに依存しない検出（`b.style.overflow =` の別名経由や setProperty も拾う）。
const RAW_OVERFLOW_WRITE = /\.style\.overflow\s*=|setProperty\(\s*['"]overflow['"]/;

const checks = [
  ['親枠内ドラッグ', files.modal.includes('bounds="parent"')],
  ['Escapeキー', files.modal.includes("event.key === 'Escape'")],
  // v0.13.6: 各モーダルが自前で退避・復元すると、入れ子で同時に閉じた時に 'hidden' が書き戻される
  // （2026-08-05 連絡ノート実機）。参照カウント（scrollLock）へ移した後も「止めていること」は検査し続ける。
  ['背景スクロール停止', SCROLL_OWNERS.every(([, code]) => code.includes('lockBodyScroll()')) && files.scrollLock.includes("document.body.style.overflow = 'hidden'")],
  ['背景スクロールを自前で退避・復元しない（止める部品すべて）', SCROLL_OWNERS.every(([, code]) => !RAW_OVERFLOW_WRITE.test(code))],
  ['背景スクロールの錠を公開している（アプリが二重に持たないため）', readFileSync(new URL('../src/ui/index.ts', import.meta.url), 'utf8').includes('lockBodyScroll')],
  ['固着からの非常口がある', files.scrollLock.includes('forceReleaseBodyScroll')],
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
