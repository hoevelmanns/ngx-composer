import {Listr} from 'listr2'
import chalk from 'chalk'
import {transformArgOptions, removeProps} from '../utils'
import path from 'path'
import {Argv, Target} from './types'
import {Shell} from '../shell'
import {Tree} from '../tree'
import execa from 'execa'
import {Ctx} from './types'

/**
 * Build Target
 */
export class Build implements Target {
    private shell: Shell = new Shell()
    private tree: Tree
    private ctx = <Ctx>{}

    async run(argv: Argv): Promise<void> {
        this.tree = new Tree().init(argv.source, argv.exclude)
        this.buildContext(argv)

        await new Listr([
            {
                task: (ctx: Ctx): void => {
                    Object.assign(ctx, this.ctx)
                },
            },
            {
                title: 'Building the collected workspace applications...',
                options: {showTimer: true},
                enabled: (ctx: Ctx): boolean => !ctx.singleBuild,
                task: async (ctx: Ctx) => await this.buildMicroApps(ctx),
            },
            {
                title: 'Building the shell...',
                options: {showTimer: true},
                task: async (ctx: Ctx) => await this.buildShell(ctx),
            }
        ], {
            registerSignalListeners: true,
        })
            .run()
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

    private buildShell = async (ctx: Ctx): Promise<unknown> =>
        new Listr([
            {
                title: 'Generate...',
                task: async () => await this.shell.generate(this.tree)
            },
            {
                title: 'Building...',
                task: async () => await execa.command(`${ctx.buildCommand} --output-path=${ctx.outputPath}`, {
                    cwd: this.shell.appPath,
                })
            }
        ])


    private buildMicroApps = async (ctx: Ctx): Promise<unknown> =>
        new Listr(this.tree.workspaces.map(({config, defaultProject}) => ({
            title: `${config.dir}`,
            task: async () => {
                await execa.command(ctx.buildCommand, {
                    cwd: config.dir,
                })
                // todo add chunk size
                ctx.chunks[<string>config.dir] = {name: defaultProject.name, size: 100, gzipSize: 200} // todo get
            }
        })), {concurrent: this.ctx.concurrent})
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'build'
export const describe = 'Builds the applications'
export const builder = {
    source: {description: 'directory or glob pattern to define the apps to process', default: '**'},
    exclude: {description: 'excludes specified apps', default: ''},
    singleBuild: {description: 'only build the shell app'},
    concurrent: {description: 'avoid processes the task concurrently', default: true},
}
export const handler = (argv: Argv) => new Build().run(argv)
