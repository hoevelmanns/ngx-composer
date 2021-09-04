import { Listr } from 'listr2'
import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'shell'
import { ContextService } from 'context'
import { CommandBuilder } from 'yargs'
import chalk from 'chalk'

@injectable()
class Build implements Command {
    constructor(@inject(Shell) private shell: Shell, @inject(ContextService) private context: ContextService) {}

    async run(argv: Argv, builder: CommandBuilder): Promise<void> {
        const tasks = new Listr(
            [
                {
                    title: this.shell.shellExist() ? 'Creating shell...' : 'Shell exist! Updating shell...',
                    options: { showTimer: true },
                    task: async (_, task) => this.shell.generate().then(() => (task.title = 'Shell preparation complete.')),
                },
                {
                    options: { showTimer: true },
                    task: async (ctx, task) =>
                        this.shell.build(ctx).then(() => (task.title = `Application built in ${chalk.cyan(ctx.outputPath)}`)),
                },
                {
                    enabled: ctx => ctx.createLoaderFile,
                    task: async (ctx, task) =>
                        this.shell
                            .createLoaderFile(ctx)
                            .then(() => (task.title = `Loader file ${chalk.cyan(ctx.loaderFileName)} created.`)),
                },
            ],
            {
                exitOnError: true,
                rendererOptions: { showErrorMessage: false },
                registerSignalListeners: true,
                ctx: this.context.buildContext(argv, builder),
            }
        )

        await tasks.run().catch(e => {
            console.error('Error running build:')
            console.error(e.stderr ?? e.message)
            process.exit(1)
        })
    }
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'build'
export const describe = 'Build the angular application(s)'
export const builder = {
    directory: {
        description: 'Directory or glob (e.g. "custom/plugins/**") to define the apps to process.',
        default: '**',
        alias: 'd',
    },
    exclude: {
        description: 'Exclude specified path or glob. Can be used many times.',
        alias: 'e',
    },
    'single-bundle': { description: 'Only build the shell app.', alias: 's', default: true },
    concurrent: {
        description: 'Run the tasks concurrently.',
        default: true,
        alias: 'c',
    },
    'vendor-chunk': {
        description: 'Generate a separate bundle containing only vendor libraries.',
        default: false,
    },
    'named-chunks': {
        description: 'Use file name for lazy loaded chunks.',
        default: true,
    },
    'create-loader-file': {
        description: 'Creates a template containing only the angular dist scripts',
    },
    'loader-file-name': {
        description: 'The name of the loader file',
        default: 'app-loader.tpl',
    },
}
export const handler = (argv: Argv) => container.resolve(Build).run(argv, builder)
