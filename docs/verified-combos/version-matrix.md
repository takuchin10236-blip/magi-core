# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-24T09:07:25+09:00
- Core: **v0.5.2**（tag数: 15）
- template_commit（雛形 origin/main）: cd28b06209bc1600024c1bc2e4efba7120592c5a

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.5.2 | cd28b06209bc1600024c1bc2e4efba7120592c5a |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| magi-core | v0.5.2 | cd28b06209bc1600024c1bc2e4efba7120592c5a | - | 2026-07-24T09:07:25+09:00 | GOAL-20260724-002 | magi-goal-work/GOAL-20260724-002/evidence/core_fix2_test.log(check+test exit0/41pass) |
| magi-webapp-template | v0.5.2 | cd28b06209bc1600024c1bc2e4efba7120592c5a | cd28b06209bc1600024c1bc2e4efba7120592c5a | 2026-07-24T09:07:25+09:00 | GOAL-20260724-002 | magi-goal-work/GOAL-20260724-002/evidence/template_v052pin_test.log(check exit0/48pass/AppShell型直接合格) |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: e4616d47cc5c6e6073cc79e30df05b770e8d3856c59a1838b41b12a7fca12d36
- `magi-webapp-template:origin-main:package.json`: 1a7117367dc729af2a2da7144e19d1bc4df45959b685d546b2075a86bc62030e
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550

