# [0.5.0](https://github.com/matte1240/employee-app/compare/v0.4.0...v0.5.0) (2025-11-17)


### Features

* add sickness hours tracking to time entries and update related logic ([a75f50c](https://github.com/matte1240/employee-app/commit/a75f50c964b8370e18c960b34944c7cbda459843))
* add vacation hours tracking across dashboard components ([c970d3c](https://github.com/matte1240/employee-app/commit/c970d3c7cb8ce4bb675d825ebfbfc0e8cf7f0be5))
* refactor admin dashboard to use AdminOverview component and add leaderboard functionality ([7de5753](https://github.com/matte1240/employee-app/commit/7de5753bb2f4329ffb948bbb9ca655517b818e98))
* remove top stats cards and update related text to Italian ([6676639](https://github.com/matte1240/employee-app/commit/667663950e990695a6bba62579577879953773fe))
* update dashboard layout to include an additional column for stats cards ([6dfa79d](https://github.com/matte1240/employee-app/commit/6dfa79d7bd3ec99dde653dbcf8548e60707d182e))
* update time tracking to consolidate vacation and permission hours, and enhance dashboard statistics ([976baf8](https://github.com/matte1240/employee-app/commit/976baf88488ca3eeba9d6e5641b98fe517619bfd))

# [0.4.0](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.4.0) (2025-11-17)


### Bug Fixes

* add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
* correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
* downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
* update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
* update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
* update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
* update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))


### Features

* add medical certificate field to time entries and update related logic ([c733015](https://github.com/matte1240/employee-app/commit/c733015bbc6b3c299385526c2eed639752dcca74))

## [0.3.1](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.3.1) (2025-11-16)


### Bug Fixes

* add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
* correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
* downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
* update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
* update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
* update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
* update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))

# [0.3.0](https://github.com/matte1240/employee-app/compare/v0.2.0...v0.3.0) (2025-11-16)


### Bug Fixes

* improve cache cleanup workflow to find and filter caches properly ([2238b00](https://github.com/matte1240/employee-app/commit/2238b0036037f5c54bff56c5a5788545d787dda4))
* update GitHub token secret reference in cache cleanup workflow ([bc41bf2](https://github.com/matte1240/employee-app/commit/bc41bf2b7a722d41fda11c8951b2fbd376c1084c))


### Features

* enhance database backup process with improved options and scheduling ([ce26f66](https://github.com/matte1240/employee-app/commit/ce26f6627052cb84c2aefd84f8f5ef6eda77bab6))
* enhance database backup workflow with production and staging jobs ([5f88302](https://github.com/matte1240/employee-app/commit/5f883025d9ef83d908b56e469b1843df277ddf97))
* refactor backup download step to use scp-action for improved reliability ([7f82ca6](https://github.com/matte1240/employee-app/commit/7f82ca6df5bd20d3b876ae4d21a9ab9538c9ecbe))
* update backup download step to use SCP for enhanced security and reliability ([5c9a9a7](https://github.com/matte1240/employee-app/commit/5c9a9a7a847cdf84529176e57ac48d1a32927016))

# [0.2.0](https://github.com/matte1240/employee-app/compare/v0.1.1...v0.2.0) (2025-11-16)


### Bug Fixes

* add GH_TOKEN and repo flag to cache cleanup workflow ([4da1de1](https://github.com/matte1240/employee-app/commit/4da1de11128c805458c9f7673eeb64c61fa44d49))
* add sudo to database backup command in deployment script ([207f49c](https://github.com/matte1240/employee-app/commit/207f49c780ec02644a04b49baa2abaf1c2763360))
* enhance deployment script with detailed logging and conditional database backup ([dcb6f99](https://github.com/matte1240/employee-app/commit/dcb6f997359b2b59843e43adf184b606ff098905))
* ensure backups directory exists and set permissions before database backup ([9f3d712](https://github.com/matte1240/employee-app/commit/9f3d712a52794fbf20e975850b71747d8d60ea2b))
* refactor staging workflow to separate build and deploy jobs ([9b5a552](https://github.com/matte1240/employee-app/commit/9b5a5527a84fbaaed7ee1c9738e80df95763a69f))
* remove version declaration from docker-compose files ([f1adaec](https://github.com/matte1240/employee-app/commit/f1adaec7f954c42444ec8b5c015aba942ed2c530))
* replace git pull with git reset for more reliable main branch updates ([16fb571](https://github.com/matte1240/employee-app/commit/16fb5718f844023440a2c18cb96ece0c15e53984))
* update backup directory permissions and ownership in deployment guide ([334274a](https://github.com/matte1240/employee-app/commit/334274aadddeb019f639bd5b15b79e8c4835389a))
* update database backup command and change npm ci to npm install ([3a74775](https://github.com/matte1240/employee-app/commit/3a7477536e0e0f8f3b0c2ada57922952c6c067e0))
* update database backup command and improve main branch update process ([a10273c](https://github.com/matte1240/employee-app/commit/a10273c29797d225f707b713d5c872fcec12478e))
* update PostgreSQL version to 17 in Dockerfiles and docker-compose files ([d59a95d](https://github.com/matte1240/employee-app/commit/d59a95d015b1293fc7940a3e5137afa5b32b226f))


### Features

* add cache cleanup workflow for GitHub Actions ([566dfef](https://github.com/matte1240/employee-app/commit/566dfefbb84b0f01265ecacc5bcb64d73d2df918))
* implement automatic semantic releases and changelog generation ([ef34fab](https://github.com/matte1240/employee-app/commit/ef34fab02ae41a28b84aa540c2122fb5b02c3122))
