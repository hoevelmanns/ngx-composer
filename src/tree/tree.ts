import * as fg from 'fast-glob'
import chalk from 'chalk'
import { autoInjectable, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import yargs from 'yargs'
import { Argv, Workspaces } from './types'
import { Workspace } from './workspace'
import { getBorderCharacters, table } from 'table' // todo

@singleton()
@autoInjectable()
export class TreeService {
    private workspaces: Workspaces = []

    constructor() {
        this.init()
    }

    getWorkspaces = (): Workspaces => this.workspaces

    private init(): TreeService {
        const { directory, exclude } = <Argv>(
            yargs(process.argv).options({ e: { alias: 'exclude' }, d: { alias: 'directory', default: '**' } }).argv
        )
        const ignore = ['**/{node_modules,vendor}/**'].concat([exclude].flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`)))
        const workspacesPaths: string[] = fg
            .sync(join(directory, 'angular.json'), { ignore })
            .map(ws => ws.replace('/angular.json', ''))

        workspacesPaths.map(dir => this.workspaces.push(new Workspace(dir)))

        this.listWorkspaces(this.workspaces)

        if (!workspacesPaths.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }

    private listWorkspaces(workspaces: Workspaces): void {
        const msg = [`Found ${workspaces.length} angular`, workspaces.length === 1 ? 'workspace' : 'workspaces'].join(' ').concat('\n')

        console.log(chalk.bold.cyanBright(msg))

        const info = [[chalk.bold.whiteBright('Workspace Directory'), '|', chalk.bold.whiteBright('Default Project')]]

        workspaces.map(w => info.push([w.directory, '|', chalk.cyan(w.defaultProject.getName())]))

        this.outputTable(info)
    }

    private outputTable = (data: string[][], drawHorizontalLines?: boolean) =>
        console.log(
            chalk.white(
                table(data, {
                    border: getBorderCharacters('void'),
                    columnDefault: { paddingLeft: 0, paddingRight: 2 },
                    drawHorizontalLine: () => drawHorizontalLines,
                })
            )
        )
}
