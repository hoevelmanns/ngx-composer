# NGX Composer

Composes multiple Angular workspaces for building, serving and more without an overhead of configuration.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/74da2fd774574631b3c02c51ed53a293)](https://www.codacy.com/gh/hoevelmanns/ngx-composer/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=hoevelmanns/ngx-composer&amp;utm_campaign=Badge_Grade)

## Commands

### Build
Build the angular application(s)

```shell
ngx build
```
*Options*
```
      --version             Show version number                        [boolean]
      --help                Show help                                  [boolean]
  -d, --directory           Directory or glob (e.g. "custom/plugins/**") to
                            define the apps to process.          [default: "**"]
  -e, --exclude             Exclude specified path or glob. Can be used many
                            times.
  -s, --single-bundle       Only build the shell app.            [default: true]
  -c, --concurrent          Run the tasks concurrently.          [default: true]
      --vendor-chunk        Generate a separate bundle containing only vendor
                            libraries.                          [default: false]
      --named-chunks        Use file name for lazy loaded chunks.[default: true]
      --create-loader-file  Creates a template containing only the angular dist
                            scripts
      --loader-file-name    The name of the loader file
                                                     [default: "app-loader.tpl"]

```

### Serve
Serve the angular application(s)

```shell
ngx serve
```

*Options*
```shell
      --version             Show version number                        [boolean]
      --help                Show help                                  [boolean]
  -d, --directory           Directory or glob (e.g. "custom/plugins/**") to
                            define the apps to process.          [default: "**"]
  -e, --exclude             Exclude specified path or glob. Can be used many
                            times.
      --create-loader-file  Creates a template containing only the angular dist
                            scripts
      --loader-file-name    The name of the loader file
                                                     [default: "app-loader.tpl"]
```
