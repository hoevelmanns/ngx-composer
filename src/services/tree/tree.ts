import * as fg from 'fast-glob'
import chalk from 'chalk'
import { autoInjectable, singleton } from 'tsyringe'
import isGlob from 'is-glob'
import { join } from 'path'
import { Workspace } from 'services'
import yargs from 'yargs'
import { Argv } from './types'

@singleton()
@autoInjectable()
export class TreeService {
    private workspaces = <Workspace[]>[]

    constructor() {
        this.build()
    }

    getWorkspaces = () => this.workspaces

    private build(): TreeService {
        const { directory, exclude } = <Argv>(
            yargs(process.argv).options({ e: { alias: 'exclude' }, d: { alias: 'directory', default: '**' } }).argv
        )
        const ignore = ['**/{node_modules,vendor}/**'].concat(
            [exclude].flat(1).map(ex => (isGlob(ex) ? ex : `**/${ex}/**`))
        )
        const workspaces: string[] = fg
            .sync(join(directory, 'angular.json'), { ignore })
            .map(ws => ws.replace('/angular.json', ''))

        const msg = [`Found ${workspaces.length} angular`, workspaces.length === 1 ? 'workspace' : 'workspaces']
            .join(' ')
            .concat('\n')

        console.log(chalk.bold.cyanBright(msg))

        workspaces.map(dir => this.workspaces.push(new Workspace(dir)))

        if (!workspaces.length) {
            console.log(chalk.cyan('No angular workspaces found. Nothing to do.'))
            process.exit(0)
        }

        return this
    }
}
