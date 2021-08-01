import * as fg from 'fast-glob'
import * as path from 'path'
import chalk from 'chalk'
import Workspace from './workspace/workspace'
import {Report} from './report'

export class Tree {
    public workspaces = <Workspace[]>[]
    private report = new Report()

    init(source = '**'): void {
        const workspaces: string[] = fg.sync(path.join(source, 'angular.json'))

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        // todo check if plugin is active

        workspaces
            .map(c => c.replace('/angular.json', ''))
            .map(appDir => this.workspaces.push(new Workspace({
                dir: appDir,
                path: path.join(appDir, 'angular.json'),
            }).init()))

        this.report.listWorkspaces(this.workspaces)
    }
}
