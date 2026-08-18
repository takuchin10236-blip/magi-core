# 版同期・検証済み組合せ一覧（機械生成）

> `scripts/collect-version-matrix.mts` の自動生成物。手で版番号を書かない。
> 固定版は origin/main 確定commitから収集（dirty ローカルは使わない）。

- 生成時刻: 2026-08-18T05:53:25.212Z
- Core: **v0.18.1**（tag数: 53）
- template_commit（雛形 origin/main）: 102b996477cfb1443863205bc978d9cd99ff69b0

## 採用repo（origin/main 確定commit）

| repo | app version | @magi/core 固定タグ | app_commit(origin/main) |
|---|---|---|---|
| magi-webapp-template | 0.0.0-template | v0.13.7 | 102b996477cfb1443863205bc978d9cd99ff69b0 |
| magi-resident-spine | 0.2.0-f0f1 | v0.4.3 | 329a2f70b92156238ea80ca95d85e51273ecd158 |
| magi-resident-master | 0.3.2 | v0.18.1 | 4008264820ceb75042474360c735a3bc54ee775d |
| magi-staff-directory | 0.4.2 | v0.18.1 | a0b8939ac0139113ce9acb537ed6d5700b5219e5 |
| magi-resident-adl | 0.4.0 | v0.18.1 | 159d9d3af50a982f36b4c5fbb7f6f1a9ad850b87 |
| magi-floor-calendar-v2 | 0.9.0 | v0.18.1 | 4ee47d0c6d6cb00013460fb96cba50f192b55f91 |

## verified（検証済み組合せ・11 §0.5）

（未登録。`--verified-entry app=...,core_tag=...,evidence=...,verified_at=...` で追加）

## source_hashes（版pin実体の SHA-256・`npm run verify:matrix` が鮮度検査）

- `core:package.json`: bbf291b9e5cb0252ff6cfbf6b9b5c2c64d52315742cf536bcf363cc249f1e633
- `magi-webapp-template:origin-main:package.json`: 0117b807690f534d93de3a941410eaa041f5a3b4f5f8175d0313d69b62d8a023
- `magi-resident-spine:origin-main:package.json`: 82a98ed6361821524e0874ad73f2c3df8e835f52349ff62e34d1073018690550
- `magi-resident-master:origin-main:package.json`: ab730906556de81d805580c956a0ad1b18b70923953500a801f58cb9a9b4ee31
- `magi-staff-directory:origin-main:package.json`: d414d05d7110a1d153dd79c42418a70e0176e36484ebaf560244b0ede0db3bad
- `magi-resident-adl:origin-main:package.json`: 4abc2627d340ce3a762a46e2af693ea824113798b44cd00bcf4079cd4242fe32
- `magi-floor-calendar-v2:origin-main:package.json`: 9ddf90743f4bde2f8279fba4486471eb70e9b2fbcdc755dce1598108e095eaa5

