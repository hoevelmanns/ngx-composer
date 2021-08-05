import * as fg from 'fast-glob'
import * as path from 'path'
import chalk from 'chalk'
import Workspace from './workspace/workspace'

export class Tree {
    public workspaces = <Workspace[]>[]

    init(source: string, ...exclude: string[]): Tree {
        const workspaces: string[] = fg.sync(path.join(source, 'angular.json'))
            .map(w => w.replace('/angular.json', ''))
            .filter(w => !exclude.flat(1).filter(n => w.includes(n)).length)

        console.log(chalk.bold.cyanBright(`Found ${workspaces.length} angular ` + (workspaces.length > 1 ? 'workspaces' : 'workspace')), '\n')

        workspaces.map(appDir => this.workspaces.push(new Workspace({
            dir: appDir,
            path: path.join(appDir, 'angular.json'),
        }).init()))

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }
}
