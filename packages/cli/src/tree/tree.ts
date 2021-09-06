import * as fg from 'fast-glob'
import chalk from 'chalk'
import { autoInjectable, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import yargs from 'yargs'
import { Argv } from './types'
import { Workspace, Workspaces } from './workspace'
import { getBorderCharacters, table } from 'table'

@singleton()
@autoInjectable()
export class TreeService {
    private workspaces: Workspaces = []

    constructor() {
        this.init()
    }

    getWorkspaces = (): Workspaces => this.workspaces

    private init(): TreeService {
        const args = <Argv>yargs(process.argv)
        const { directory, exclude } = args.options({ e: { alias: 'exclude' }, d: { alias: 'directory', default: '**' } }).argv
        const ignore = ['**/{node_modules,vendor,.git}/**'].concat([exclude].flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`)))
        const workspacesPaths: string[] = fg
            .sync(join(directory, 'angular.json'), { ignore })
            .map(ws => ws.replace('/angular.json', ''))

        this.workspaces = workspacesPaths.map(dir => Workspace.load(dir))

        if (!workspacesPaths.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        this.listWorkspaces(this.workspaces)

        return this
    }

    private listWorkspaces(workspaces: Workspaces): void {
        const msgFoundedWorkspaces = [`Found ${workspaces.length} angular`, workspaces.length === 1 ? 'workspace' : 'workspaces']
            .join(' ')
            .concat('\n')

        const workspaceTable = [[chalk.bold.whiteBright('Workspace Directory'), '|', chalk.bold.whiteBright('Default Project')]]

        workspaces.forEach(w => workspaceTable.push([w.getDirectory(), '|', chalk.cyan(w.defaultProject.getName())]))

        console.log(chalk.bold.cyanBright(msgFoundedWorkspaces))
        console.log(chalk.white(this.outputTable(workspaceTable)))
    }

    private outputTable = (data: string[][], drawHorizontalLines = false) =>
        table(data, {
            border: getBorderCharacters('void'),
            columnDefault: { paddingLeft: 0, paddingRight: 2 },
            drawHorizontalLine: () => drawHorizontalLines,
        })
}
