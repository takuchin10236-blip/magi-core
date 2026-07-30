/**
 * copy-brand-assets — src/ui/brand の画像を dist/ui/brand へ運ぶ（build の後段）。
 *
 * tsc は .ts/.tsx しか出力しないため、SgBrandLogo が import する画像は明示的に運ぶ。
 *   dist/ui/SgBrandLogo.js から見た './brand/*.png' が実在する状態を作るのが目的
 *   （＝採用側アプリの Vite が解決できる）。
 * 運ぶ前に manifest の SHA-256 と突合し、差し替わった画像をここで止める。
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  MANIFEST_NAME,
  distBrandDir,
  expectedFiles,
  readManifest,
  srcBrandDir,
  verifyDir,
} from './brand-assets-sources.mjs';

const manifest = readManifest();

// 運ぶ前に出所を確認する（壊れた/差し替わった画像を dist へ広げない）。
const { errors } = verifyDir(srcBrandDir, manifest, { label: 'src/ui/brand' });
if (errors.length > 0) {
  console.error('copy:brand FAIL: 同梱画像が manifest と不一致。');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

mkdirSync(distBrandDir, { recursive: true });
const files = [...expectedFiles(manifest).map((item) => item.file), MANIFEST_NAME];
for (const file of files) {
  copyFileSync(join(srcBrandDir, file), join(distBrandDir, file));
}

console.log(`copy:brand OK: ${files.length}件を dist/ui/brand へ複製（画像${files.length - 1}枚＋manifest）`);
