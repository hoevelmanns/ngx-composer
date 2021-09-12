import * as fg from 'fast-glob'
import chalk from 'chalk'
import { inject, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import { Workspaces } from './workspace'
import { getBorderCharacters, table } from 'table'
import { Packages } from './package'

/**
 * Provides the workspaces with its packages and configurations
 */
@singleton()
export class Tree {
    workspaceDirs = <string[]>[]

    constructor(@inject(Workspaces) readonly workspaces: Workspaces, @inject(Packages) readonly packages: Packages) {}

    /**
     * todo
     *
     * @param directory - The directory to be searched
     * @param exclude - Excluded directories or glob
     */
    init(directory: string, exclude: string[]) {
        const ignore = ['**/{node_modules,vendor,.git}/**'].concat([exclude].flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`)))
        this.workspaceDirs = fg.sync(join(directory, 'angular.json'), { ignore }).map(ws => ws.replace('/angular.json', ''))

        this.workspaceDirs.forEach(dir => {
            this.workspaces.add(dir)
            this.packages.add(dir)
        })

        if (!this.workspaceDirs.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }

    /**
     * Displays the founded workspaces in a table
     */
    listWorkspaces(): Tree {
        const workspaces = this.workspaces.find()
        const workspaceTable = [[chalk.bold.whiteBright('Workspace Directory'), '|', chalk.bold.whiteBright('Default Project')]]
        const msgFoundedWorkspaces = [`Found ${workspaces.length} angular`, workspaces.length === 1 ? 'workspace' : 'workspaces']
            .join(' ')
            .concat('\n')

        workspaces.forEach(ws => workspaceTable.push([ws.getDirectory(), '|', chalk.cyan(ws.defaultProject.getName())]))

        console.log(chalk.bold.cyanBright(msgFoundedWorkspaces))

        console.log(chalk.white(this.outputTable(workspaceTable)), '\n')

        return this
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
