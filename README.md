# NGX Composer

Composes multiple Angular workspaces for building, serving and more without an overhead of configuration.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/74da2fd774574631b3c02c51ed53a293)](https://www.codacy.com/gh/hoevelmanns/ngx-composer/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=hoevelmanns/ngx-composer&amp;utm_campaign=Badge_Grade)

## Motivation

TODO
- wenn route nicht angular gefunden wird, wird auf / umgeleitet
- ng serve muss in vagrant gestartet werden mit --host... lt. rdss-next cli/index.js
- es muss ein template nach dem Build generiert werden, welches in der bspw. in der index.tpl inkludiert wird
- ngx build benötigt eine deploy-url:
  - ngx build -e rdss-next -e RdssExample2 --deploy-url /dist/
  
- [ ] check ng installation
- [ ] add "dist-serve" task with http-server
- [ ] add peerDependency check!
- [ ] add config.composer.json for configure the shell angular version and other things
- [ ] add tsconfig merger packages & shell
- [ ] support nx workspace with packagr
