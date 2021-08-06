import {Listr} from 'listr2'
import chalk from 'chalk'
import {transformArgOptions, removeProps} from '../utils'
import path from 'path'
import {Argv, Command} from './types'
import {Tree} from '../tree'
import {Ctx} from './types'
import {container, inject, injectable} from 'tsyringe'
import {Apps, Shell} from '../targets'

@injectable()
export class BuildCommand implements Command {
    private ctx = <Ctx>{}

    constructor(
        @inject(Apps) private apps: Apps,
        @inject(Shell) private shell: Shell,
        @inject(Tree) private tree: Tree
    ) {
    }

    async run(argv: Argv): Promise<void> {
        this.tree.build(argv.directory, argv.exclude)

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
                task: async (ctx: Ctx) => await this.apps.build(ctx, this.tree),
            },
            {
                title: 'Building the shell...',
                options: {showTimer: true},
                task: async (ctx: Ctx) => await this.shell.build(ctx, this.tree),
            }
        ], {
            registerSignalListeners: true,
        })

        await tasks.run()
            .then((ctx: Ctx) => console.log(chalk.green('Successfully built!'), {ctx}))
            .catch(e => console.log('Error: ', e.stderr ?? e))
    }

    private buildContext = (argv: Argv): void => {
        const ctx: Ctx = {
            chunks: [],
            directory: argv.directory,
            singleBuild: !!argv?.singleBuild,
            concurrent: argv?.concurrent !== 'false',
            outputPath: argv?.outputPath
                ? path.join(process.cwd(), argv.outputPath)
                : path.join(process.cwd(), 'dist'),
        }

        argv.vendorChunk = argv?.vendorChunk !== 'false'
        argv.namedChunks = argv?.namedChunks !== 'false'

        const ngOptions = transformArgOptions(removeProps(argv, 'exclude', ...Object.keys(ctx))).toString()

        ctx.buildCommand = `ng build ${ngOptions}`.trim()

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
    directory: {description: 'Directory or glob pattern to define the apps to process.', default: '**'},
    exclude: {description: 'Excludes specified apps.'},
    'single-build': {description: 'Only build the shell app.'},
    concurrent: {description: 'Avoid processes the task concurrently.', default: true},
    'vendor-chunk': {description: 'Generate a seperate bundle containing only vendor libraries.', default: true},
    'named-chunks': {description: 'Use file name for lazy loaded chunks,', default: true},
}
export const handler = (argv: Argv) => container.resolve(BuildCommand).run(argv)
