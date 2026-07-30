# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-30T09:56:35.747Z
- Core: **v0.9.1（作業中・タグ未作成）**（tag数: 31）
- template_commit（雛形 origin/main）: b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.5.3 | b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

（未登録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...` で追加）

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: f6a0eb0d03756db503457f9770479372c30cf6d879385a358cf1f9d59b432f19
- `magi-webapp-template:origin-main:package.json`: f6d73cc3c86e668f512dae353d1a03570b2ab2475e94421c1c1a0a72d853b289
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

