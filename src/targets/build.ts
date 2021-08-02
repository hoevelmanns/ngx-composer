import {execSync} from 'child_process'
import {Listr} from 'listr2'
import chalk from 'chalk'
import {Target} from './types'
import {Shell} from '../shell'
import {Tree} from '../tree'
import {argOptionsToString, getArgOptions, removeProps} from "../utils"
import path from "path"

export class Build implements Target {
    private shell: Shell = new Shell() // todo di injection

    constructor(private yargs: any) {
    }

    init(): any { // todo write decorator?
        this.yargs.command('build', 'Builds the applications', {source: {description: 'directory or glob pattern to define the apps to process'}})
        this.yargs.argv._.includes('build') && this.run()
    }

    async run(): Promise<void> {
        const tree = new Tree().init(this.yargs.argv.source)

        try {
            await new Listr([{
                title: 'Preparing angular build...',
                options: {showTimer: true},
                task: async () => this.shell.generate(tree)
            }])
                .run()
                .then(this.execute)
                .then(() => console.log(chalk.red('READY -> TODO show report')))

        } catch (e: unknown) {
            console.log(e['signal'] === 'SIGINT' ? chalk.cyan('Aborted by user.') : e)
        }
    }

    protected execute = (): void => {
        const options = getArgOptions(removeProps(this.yargs.argv, 'source'))

        options?.outputPath && (options.outputPath = path.join(process.cwd(), options.outputPath))

        execSync(`ng build ${argOptionsToString(options)}`, {
            cwd: this.shell.appPath,
            stdio: 'inherit'
        })
    }
}

export const build = (yargs: any) => new Build(yargs)
