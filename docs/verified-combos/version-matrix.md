# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-24T01:35:01.758Z
- Core: **v0.5.3（作業中・タグ未作成）**（tag数: 15）
- template_commit（雛形 origin/main）: cd28b06209bc1600024c1bc2e4efba7120592c5a

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.5.2 | cd28b06209bc1600024c1bc2e4efba7120592c5a |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| @magi/core | v0.5.3 | cd28b06209bc1600024c1bc2e4efba7120592c5a | aa2c02822f02cded499bda4ad9c4662dc4493d18 | 2026-07-24T10:30:00Z | tachikoma | magi-goal-work/GOAL-20260724-002/evidence/core_fix3_test.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: 82c313dcc70d02dfd819e9764f1d38749516ae4ccdf2ea0409c3bc23b82f0546
- `magi-webapp-template:origin-main:package.json`: 1a7117367dc729af2a2da7144e19d1bc4df45959b685d546b2075a86bc62030e
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

