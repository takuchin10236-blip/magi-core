# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-08-03T07:42:21.448Z
- Core: **v0.13.4（作業中・タグ未作成）**（tag数: 43）
- template_commit（雛形 origin/main）: f480b3ebe4d493be5b89bbc01cf4a780f8b929c5

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.10.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |
| magi-resident-master | 0.1.0 | v0.12.0 | 82f88e97f25dab6d21173d1c22cff7018d46509f |
| magi-staff-directory | 0.3.0 | v0.13.3 | 3cb480e831bde397aaf35bcb2d774ced1992cbd6 |

## verified（検証済み組合せ・11 §0.5）

| app | core_tag | template_commit | app_commit | verified_at | verified_by | evidence |
|---|---|---|---|---|---|---|
| magi-resident-master | v0.12.0 | f480b3ebe4d493be5b89bbc01cf4a780f8b929c5 | 82f88e97f25dab6d21173d1c22cff7018d46509f | 2026-07-31 | タチコマ（実装座席・サブエージェント） | GOAL-20260731-CORE-V0120/verify-v0.12.0.log |

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: e14cb16615ab02dbb2652dc0d9ddc335a8a074d1c7e6106896faa4f9dccd641a
- `magi-webapp-template:origin-main:package.json`: 5134bbca1b61224cf164a5fd79e9dc4ef5f391ee66125e444e05b5f597e481a3
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550
- `magi-resident-master:origin-main:package.json`: cbb16fe1aed54593795548aab02577a606db55f61d38a6bdab97bb02a32396b7
- `magi-staff-directory:origin-main:package.json`: c7e6c6d171730a6537cec0056eee49a3f67d639ce46bc56c27f4003171a1d798

