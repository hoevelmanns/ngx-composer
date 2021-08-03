import {execSync} from 'child_process'
import {Listr} from 'listr2'
import chalk from 'chalk'
import {argOptionsToString, getArgOptions, removeProps} from '../utils'
import path from 'path'
import {Argv, Target} from './types'
import {Shell} from '../shell'
import {Tree} from '../tree'

/**
 * Build Target
 */
export class Build implements Target {
    private shell: Shell = new Shell()

    async run(argv: Argv): Promise<void> {

        const tree = new Tree().init(argv.source)

        try {
            await new Listr([{
                title: 'Preparing angular build...',
                options: {showTimer: true},
                task: async () => this.shell.generate(tree)
            }])
                .run()
                .then(() => this.execute(argv))

        } catch (e: unknown) {
            console.log(e['signal'] === 'SIGINT' ? chalk.cyan('Aborted by user.') : e)
        }
    }

    protected execute = (argv: Argv): void => {
        const options = getArgOptions(removeProps(argv, 'source'))

        options?.outputPath && (options.outputPath = path.join(process.cwd(), options.outputPath))

        execSync(`ng build ${argOptionsToString(options)}`, {
            cwd: this.shell.appPath,
            stdio: 'inherit'
        })
    }
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'build'
export const describe = 'Builds the applications'
export const builder = {source: {description: 'directory or glob pattern to define the apps to process'}}
export const handler = (argv: Argv) => new Build().run(argv)
