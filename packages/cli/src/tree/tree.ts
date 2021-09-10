import * as fg from 'fast-glob'
import chalk from 'chalk'
import { autoInjectable, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import yargs from 'yargs'
import { Argv } from './types'
import { Workspaces } from './workspace'
import { getBorderCharacters, table } from 'table'
import { Packages } from './package'

/**
 * Provides the workspaces with its packages and configurations
 */
@singleton()
@autoInjectable()
export class Tree {
    readonly workspaces = new Workspaces()
    readonly packages = new Packages()

    constructor() {
        this.init()
    }

    protected init(): Tree {
        const args = <Argv>yargs(process.argv)
        const { directory, exclude } = args.options({ e: { alias: 'exclude' }, d: { alias: 'directory', default: '**' } }).argv
        const workspacesPaths = this.searchWorkspaces(directory, exclude)

        workspacesPaths.forEach(dir => {
            this.workspaces.add(dir)
            this.packages.add(dir)
        })

        if (!workspacesPaths.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        this.listWorkspaces()

        return this
    }

    /**
     * Searches the specified directory recursively for angular configurations (angular.json)
     *
     * @param directory - The directory to be searched
     * @param exclude - Excluded directories or glob
     */
    protected searchWorkspaces(directory: string, exclude: string[]) {
        const ignore = ['**/{node_modules,vendor,.git}/**'].concat([exclude].flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`)))
        const workspacesPaths: string[] = fg
            .sync(join(directory, 'angular.json'), { ignore })
            .map(ws => ws.replace('/angular.json', ''))

        return workspacesPaths
    }

    /**
     * Displays the founded workspaces in a table
     */
    protected listWorkspaces(): void {
        const workspaces = this.workspaces.find()
        const workspaceTable = [[chalk.bold.whiteBright('Workspace Directory'), '|', chalk.bold.whiteBright('Default Project')]]
        const msgFoundedWorkspaces = [`Found ${workspaces.length} angular`, workspaces.length === 1 ? 'workspace' : 'workspaces']
            .join(' ')
            .concat('\n')

        workspaces.forEach(ws => workspaceTable.push([ws.getDirectory(), '|', chalk.cyan(ws.defaultProject.getName())]))

        console.log(chalk.bold.cyanBright(msgFoundedWorkspaces))

        console.log(chalk.white(this.outputTable(workspaceTable)))
    }

    /**
     * Produces a string that represents array data in a text table.
     * @link https://www.npmjs.com/package/table
     */
    protected outputTable = (data: string[][], drawHorizontalLines = false) =>
        table(data, {
            border: getBorderCharacters('void'),
            columnDefault: { paddingLeft: 0, paddingRight: 2 },
            drawHorizontalLine: () => drawHorizontalLines,
        })
}
