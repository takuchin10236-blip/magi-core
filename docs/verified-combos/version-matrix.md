# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-31T06:28:32.777Z
- Core: **v0.11.0（作業中・タグ未作成）**（tag数: 36）
- template_commit（雛形 origin/main）: f480b3ebe4d493be5b89bbc01cf4a780f8b929c5

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.10.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

（未登録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...` で追加）

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: 8cf1de60d36fd87f83083a38538f96dd986bf90b9892ebf31ba43ef5cca5cf67
- `magi-webapp-template:origin-main:package.json`: 5134bbca1b61224cf164a5fd79e9dc4ef5f391ee66125e444e05b5f597e481a3
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

