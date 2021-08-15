import { autoInjectable, singleton } from 'tsyringe'
import { join } from 'path'
import execa, { ExecaReturnValue } from 'execa'
import { existsSync } from 'fs'
import chalk from 'chalk'

@autoInjectable()
@singleton()
export class NgPackagrService {
    private bin = join(__dirname, '../node_modules/.bin/ng-packagr')

    validateConfig(cwd: string): { hasErrors: boolean; errors: string } {
        const errors = <string[]>[]

        if (!existsSync(join(cwd, 'ng-package.json'))) {
            errors.push(
                cwd.concat(': ') + chalk.red('Required ng-package.json was not found.'),
                chalk.cyan('See https://github.com/ng-packagr/ng-packagr#usage-example')
            )
        }

        return {
            hasErrors: errors.length > 0,
            errors: errors.join('\n'),
        }
    }

    async build(params: { cwd: string; path?: string; tsconfigPath?: string }): Promise<ExecaReturnValue> {
        return execa(this.bin, ['-p', params.path ?? 'ng-package.json', params.tsconfigPath && '-c', params.tsconfigPath], {
            cwd: params.cwd,
        })
    }
}
