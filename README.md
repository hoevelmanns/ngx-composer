# NGX Composer

Composes multiple Angular workspaces for building, serving and more without an overhead of configuration.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/74da2fd774574631b3c02c51ed53a293)](https://www.codacy.com/gh/hoevelmanns/ngx-composer/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=hoevelmanns/ngx-composer&amp;utm_campaign=Badge_Grade)

## Motivation

TODO
- ngx build --create-loader-file --deploy-url /themes/Frontend/Weinfreunde/dist/ --output-path ./themes/Frontend/Weinfreunde/dist
- ng-serve: set "--host" in vagrant using "printenv SERVERNAME"
- wenn angular route nicht gefunden wird, wird auf / umgeleitet
- ng serve muss in vagrant gestartet werden mit --host..., siehe. rdss-next cli/index.js
- ngx build benötigt eine deploy-url:
- ngx build -e rdss-next -e RdssExample2 --deploy-url /dist/
  
- [ ] check ng installation
- [ ] add "dist-serve" task with http-server
- [ ] add peerDependency check!
- [ ] add config.composer.json for configure the shell angular version and other things
- [ ] add tsconfig merger packages & shell
- [ ] support nx workspace with packagr
