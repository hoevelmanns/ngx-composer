import * as fg from 'fast-glob'
import * as path from 'path'
import chalk from 'chalk'
import Workspace from './workspace/workspace'
import {autoInjectable, singleton} from 'tsyringe'

@singleton()
@autoInjectable()
export class Tree {
    public workspaces = <Workspace[]>[]

    build(directory: string, ...exclude: string[]): Tree {
        const workspaces: string[] =
            fg.sync(path.join(directory, 'angular.json'), {
                ignore: ['**/node_modules/**', './node_modules/**', '**/vendor/**', './vendor/**']
            })
                .map(ws => ws.replace('/angular.json', ''))
                .filter(ws => !exclude.flat(1).filter(ex => ws.includes(ex)).length)

        console.log({workspaces})

        console.log(chalk.bold.cyanBright(`Found ${workspaces.length} angular ` + (workspaces.length > 1 ? 'workspaces' : 'workspace')), '\n')

        workspaces.map(appDir => this.workspaces.push(
            new Workspace({
                dir: appDir,
                path: path.join(appDir, 'angular.json'),
            })))

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }
}
