# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-24T00:00:25.635Z
- Core: **v0.5.2（作業中・タグ未作成）**（tag数: 14）
- template_commit（雛形 origin/main）: ea091097e50e25dcbc68b8b5556bf6233b0d40ca

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.5.1 | ea091097e50e25dcbc68b8b5556bf6233b0d40ca |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

（未登録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...` で追加）

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: e4616d47cc5c6e6073cc79e30df05b770e8d3856c59a1838b41b12a7fca12d36
- `magi-webapp-template:origin-main:package.json`: 9244a51f2b3dd1ff1dd9f2c7f1a29c655272b9ea312126f55d21e430da1e35d2
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

