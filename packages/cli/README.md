# NGX Composer

Composes multiple Angular workspaces for building, serving and more without an overhead of configuration.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/74da2fd774574631b3c02c51ed53a293)](https://www.codacy.com/gh/hoevelmanns/ngx-composer/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=hoevelmanns/ngx-composer&amp;utm_campaign=Badge_Grade)

[![Example](https://raw.githubusercontent.com/hoevelmanns/ngx-composer/main/packages/cli/assets/example.svg)](https://asciinema.org/a/Y7xHjoXeK3WEx1vxAsbCUW5Ok?t=1)

## Commands

### Build
Build the angular application(s)

```shell
ngx build
```
*Options*
```shell
      --version             Show version number                                  [boolean]
      --help                Show help                                            [boolean]
  -d, --directory           Directories or glob (e.g. "custom/plugins/**") to define the
                            workspaces to process.                 [array] [default: "**"]
  -e, --exclude             Exclude specified path or glob.                        [array]
      --outputPath          The full path for the new output directory
                                                                [string] [default: "dist"]
      --vendor-chunk        Generate a separate bundle containing only vendor libraries.
                                                                [boolean] [default: false]
      --named-chunks        Use file name for lazy loaded chunks.
                                                                [boolean] [default: false]
      --create-loader-file  Creates a template containing only the angular dist scripts
                                                                [boolean] [default: false]
      --loader-file-name    The name of the loader file
                                                      [string] [default: "app-loader.tpl"]

```

### Serve
Serve the angular application(s)

```shell
ngx serve
```

*Options*
```shell
      --version             Show version number                                  [boolean]
      --help                Show help                                            [boolean]
  -d, --directory           Directories or glob (e.g. "custom/plugins/**") to define the
                            workspaces to process.                 [array] [default: "**"]
  -e, --exclude             Exclude specified path or glob.                        [array]
      --create-loader-file  Creates a template containing only the angular dist scripts
                                                                                 [boolean]
      --loader-file-name    The name of the loader file
                                                      [string] [default: "app-loader.tpl"]
```
