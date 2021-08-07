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
        const ignore = ['**/{node_modules,vendor}/**'].concat(exclude.flat(1).map(ex => `**/${ex}/**`))
        const workspaces: string[] =
            fg.sync(path.join(directory, 'angular.json'), {ignore})
                .map(ws => ws.replace('/angular.json', ''))

        console.log(chalk.bold.cyanBright([
            `Found ${workspaces.length} angular`,
            workspaces.length > 1 ? 'workspaces' : 'workspace'
        ].join(' ')), '\n')

        workspaces.map(dir => this.workspaces.push(
            new Workspace({
                path: path.join(dir, 'angular.json'),
                dir,
            })))

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }
}
