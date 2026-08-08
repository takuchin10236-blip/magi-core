# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-08-08T08:49:57.518Z
- Core: **v0.14.0**（tag数: 48）
- template_commit（雛形 origin/main）: 102b996477cfb1443863205bc978d9cd99ff69b0

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.13.7 | 102b996477cfb1443863205bc978d9cd99ff69b0 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |
| magi-resident-master | 0.1.0 | v0.12.0 | 0a7e4015d6d7f65fbf6698d385fc442db429a5e0 |
| magi-staff-directory | 0.3.0 | v0.13.3 | a1770b6d7410ed0a183ed654e4b2c193a18fa26b |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| @magi/core | v0.14.0 | 102b996477cfb1443863205bc978d9cd99ff69b0 | af4b9469d829c8fe9f003e92cd89adfabdf79b82 | 2026-08-08 | タチコマ（実装座席・サブエージェント） | GOAL-20260808-CORE-V0140/verify-v0.14.0.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: 2c71f424312c944397ccc74853a2f62137402c245e1ac49f8ec1646974070675
- `magi-webapp-template:origin-main:package.json`: 0117b807690f534d93de3a941410eaa041f5a3b4f5f8175d0313d69b62d8a023
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550
- `magi-resident-master:origin-main:package.json`: cbb16fe1aed54593795548aab02577a606db55f61d38a6bdab97bb02a32396b7
- `magi-staff-directory:origin-main:package.json`: c7e6c6d171730a6537cec0056eee49a3f67d639ce46bc56c27f4003171a1d798

