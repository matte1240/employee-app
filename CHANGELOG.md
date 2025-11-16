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
