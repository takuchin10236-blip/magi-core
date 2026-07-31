# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-07-31T07:41:41.820Z
- Core: **v0.12.0**（tag数: 39）
- template_commit（雛形 origin/main）: f480b3ebe4d493be5b89bbc01cf4a780f8b929c5

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.10.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |
| magi-resident-master | 0.1.0 | v0.12.0 | 4ead0d922c7a2bb6710873bc10059053bc37b9d5 |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| magi-resident-master | v0.12.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 | 4ead0d922c7a2bb6710873bc10059053bc37b9d5 | 2026-07-31 | タチコマ（実装座席・サブエージェント） | GOAL-20260731-CORE-V0120/verify-v0.12.0.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: 7a1c5e5efefb94d9aa837f5538265a7dabce0ddda1939e213dcc445cf7a41a41
- `magi-webapp-template:origin-main:package.json`: 5134bbca1b61224cf164a5fd79e9dc4ef5f391ee66125e444e05b5f597e481a3
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550
- `magi-resident-master:origin-main:package.json`: e35e9ac7a5ecdb886256fa9ddf2e53c45e0e50fc61775aad2691098a91b44ce5

