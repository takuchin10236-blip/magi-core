# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-24T15:30:00.000Z
- Core: **v0.5.4（作業中・タグ未作成）**（tag数: 16）
- template_commit（雛形 origin/main）: b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.5.3 | b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| @magi/core | v0.5.4 | b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce | 92ce64d6614ebeb5668151ba0f0e895842d8aaf8 | 2026-07-24T10:30:00Z | tachikoma | magi-goal-work/GOAL-20260724-002/evidence/core_fix4_test.log |
| magi-webapp-template | v0.5.3 | b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce | b04e0b8a26707d2ba7968fedfe0c9f7e196b63ce | 2026-07-24T09:00:00Z | tachikoma | magi-goal-work/GOAL-20260724-002/evidence/template_v053_test.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: c2c50e96b1416c7e694deaa29bb61df12dbab32a6aeef9a1862d11f85cc4612a
- `magi-webapp-template:origin-main:package.json`: f6d73cc3c86e668f512dae353d1a03570b2ab2475e94421c1c1a0a72d853b289
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

