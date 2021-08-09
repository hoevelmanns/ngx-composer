import * as fg from 'fast-glob'
import chalk from 'chalk'
import { autoInjectable, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import { Workspace } from 'services'

@singleton()
@autoInjectable()
export class TreeService {
    public workspaces = <Workspace[]>[]

    build(directory: string, ...exclude: string[]): TreeService {
        const ignore = ['**/{node_modules,vendor}/**'].concat(
            exclude.flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`))
        )

        const workspaces: string[] = fg
            .sync(join(directory, 'angular.json'), { ignore })
            .map(ws => ws.replace('/angular.json', ''))

        console.log(
            chalk.bold.cyanBright(
                [`Found ${workspaces.length} angular`, workspaces.length > 1 ? 'workspaces' : 'workspace'].join(' ')
            ),
            '\n'
        )

        workspaces.map(dir =>
            this.workspaces.push(
                new Workspace({
                    path: join(dir, 'angular.json'),
                    dir,
                })
            )
        )

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }
}
