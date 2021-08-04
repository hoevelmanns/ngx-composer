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

    async run(argv: Argv): Promise<void> {

        this.tree = new Tree().init(argv.source)

        await new Listr([
            {
                task: (ctx: Ctx): void => {
                    ctx.chunks = []
                    ctx.source = argv.source
                    ctx.outputPath = argv?.outputPath && (argv.outputPath = path.join(process.cwd(), argv.outputPath))
                    ctx.singleBuild = !!argv.singleBuild
                    const ngOptions = transformArgOptions(removeProps(argv, ...Object.keys(ctx))).toString()
                    ctx.buildShellCommand = `ng build ${ngOptions}`
                    ctx.buildMicroAppsCommand = `ng build ${ngOptions}`

                    // todo add option for concurrently
                    // todo remove node_modules/@angular/compiler-cli/ngcc/ngcc_lock_file
                },
            },
            {
                title: 'Building the Micro apps...',
                options: {showTimer: true},
                enabled: (ctx: Ctx): boolean => !ctx.singleBuild,
                task: async (ctx: Ctx) => await this.buildMicroApps(ctx),
            },
            {
                title: 'Building the shell app...',
                options: {showTimer: true},
                task: async (ctx: Ctx) => await this.buildShell(ctx),
            }
        ], {
            concurrent: true,
            registerSignalListeners: true,
        })
            .run()
            .then((ctx: Ctx) => console.log(chalk.green('Successfully built!'), {ctx}))
            .catch(e => console.log('Error: ', e))
    }

    protected buildShell = async (ctx: Ctx): Promise<unknown> =>
        new Listr([
            {
                title: 'Preparing...',
                task: async () => await this.shell.generate(this.tree)
            },
            {
                title: 'Building...',
                task: async () => await execa.command(ctx.buildShellCommand, {
                    cwd: this.shell.appPath,
                    stdio: 'ignore',
                })
            }
        ])


    protected buildMicroApps = async (ctx: Ctx): Promise<unknown> =>
        new Listr(this.tree.workspaces.map(({config, defaultProject}) => ({
            title: `${config.dir}`,
            task: async () => {
                await execa.command(ctx.buildMicroAppsCommand, {
                    cwd: config.dir,
                    stdio: 'ignore',
                })
                ctx.chunks[<string>config.dir] = {name: defaultProject.name, size: 100, gzipSize: 200} // todo get
            }
        })), {concurrent: true})
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const
    command = 'build'
export const
    describe = 'Builds the applications'
export const
    builder = {
        source: {description: 'directory or glob pattern to define the apps to process'},
        singleBuild: {description: 'only build the shell app'}
    }
export const
    handler = (argv: Argv) => new Build().run(argv)
