# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-08-02T05:24:20.343Z
- Core: **v0.13.0（作業中・タグ未作成）**（tag数: 39）
- template_commit（雛形 origin/main）: f480b3ebe4d493be5b89bbc01cf4a780f8b929c5

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.10.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |
| magi-resident-master | 0.1.0 | v0.12.0 | 4ead0d922c7a2bb6710873bc10059053bc37b9d5 |
| magi-staff-directory | 0.1.0 | v0.12.0 | 1155e5524b6e79496778dd486edc71589bb6b9db |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| magi-resident-master | v0.12.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 | 4ead0d922c7a2bb6710873bc10059053bc37b9d5 | 2026-07-31 | タチコマ（実装座席・サブエージェント） | GOAL-20260731-CORE-V0120/verify-v0.12.0.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: 10a97913df0ec299de320151b8b461bbf550914351f8fe1327181cc71a865447
- `magi-webapp-template:origin-main:package.json`: 5134bbca1b61224cf164a5fd79e9dc4ef5f391ee66125e444e05b5f597e481a3
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550
- `magi-resident-master:origin-main:package.json`: e35e9ac7a5ecdb886256fa9ddf2e53c45e0e50fc61775aad2691098a91b44ce5
- `magi-staff-directory:origin-main:package.json`: c4e03b56d99a1aa5a2cd394c07a453d8e560174b8c80481a03a4b389aa08de92

