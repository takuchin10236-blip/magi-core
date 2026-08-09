/**
 * ショーケースの入口（開発者検証用・dist へは出ない）。
 *
 * CSS は採用アプリと同じ1行で読む＝ここで読めない/崩れるなら採用アプリでも崩れる。
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@magi/core/ui/design-system.css';
import './showcase.css';
import { Showcase } from './Showcase';

const host = document.getElementById('root');
if (!host) throw new Error('#root が見つかりません（dev/index.html を確認）');

createRoot(host).render(
  <StrictMode>
    <Showcase />
  </StrictMode>,
);
