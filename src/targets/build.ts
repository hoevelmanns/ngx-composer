import {Listr} from 'listr2'
import chalk from 'chalk'
import {transformArgOptions, removeProps} from '../utils'
import path from 'path'
import {Argv, Target} from './types'
import {Shell} from '../shell'
import {Tree} from '../tree'
import {Ctx} from './types'
import {Apps} from "../apps/apps"

export class Build implements Target {
    private ctx = <Ctx>{}

    async run(argv: Argv): Promise<void> {
        const tree = new Tree().init(argv.source, argv.exclude)
        const shell = new Shell()
        const apps = new Apps()

        this.buildContext(argv)

        const tasks = new Listr([
            {
                task: (ctx: Ctx): void => {
                    Object.assign(ctx, this.ctx)
                },
            },
            {
                title: 'Building the collected workspace applications...',
                options: {showTimer: true},
                enabled: (ctx: Ctx): boolean => !ctx.singleBuild,
                task: async (ctx: Ctx) => await apps.build(ctx, tree),
            },
            {
                title: 'Building the shell...',
                options: {showTimer: true},
                task: async (ctx: Ctx) => await shell.build(ctx, tree),
            }
        ], {
            registerSignalListeners: true,
        })

        await tasks.run()
            .then((ctx: Ctx) => console.log(chalk.green('Successfully built!'), {ctx}))
            .catch(e => console.log('Error: ', e))
    }

    private buildContext = (argv: Argv): void => {
        const ctx: Ctx = {
            chunks: [],
            source: argv.source,
            singleBuild: !!argv?.singleBuild,
            concurrent: argv?.concurrent !== 'false',
            outputPath: argv?.outputPath && (argv.outputPath = path.join(process.cwd(), argv.outputPath))
        }

        const ngOptions = transformArgOptions(removeProps(argv, 'exclude', ...Object.keys(ctx))).toString()

        ctx.buildCommand = `ng build ${ngOptions}`

        this.ctx = ctx
    }
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'build'
export const describe = 'Builds the applications'
export const builder = {
    source: {description: 'directory or glob pattern to define the apps to process', default: '**'},
    exclude: {description: 'excludes specified apps'},
    'single-build': {description: 'only build the shell app'},
    concurrent: {description: 'avoid processes the task concurrently', default: true},
}
export const handler = (argv: Argv) => new Build().run(argv)
