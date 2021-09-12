import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'shell'
import { Listr } from 'listr2'
import { Context } from 'context'
import { CommandBuilder } from 'yargs'
import chalk from 'chalk'

@injectable()
class Serve implements Command {
    constructor(@inject(Shell) private shell: Shell, @inject(Context) private context: Context) {}

    async run(argv: Argv, builder: CommandBuilder): Promise<void> {
        const tasks = new Listr(
            [
                {
                    enabled: ctx => ctx.createLoaderFile,
                    task: async (ctx, task) =>
                        this.shell
                            .createLoader(ctx, true)
                            .then(() => (task.title = `Loader file ${chalk.cyan(ctx.loaderFileName)} created.`)),
                },
                {
                    options: { showTimer: true },
                    task: async (_, task) => await this.shell.generate(task),
                },
                {
                    task: async ctx => this.shell.serve(ctx),
                },
            ],
            {
                ctx: this.context.buildContext(argv, builder),
                rendererOptions: { showErrorMessage: false },
            }
        )

        await tasks.run().catch(e => {
            console.error('Error serving app')
            console.error(e.stderr ?? e.message)
            process.exit(1)
        })
    }
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'serve'
export const describe = 'Serve the angular application(s)'
export const builder = {
    directory: {
        alias: 'd',
        description: 'Directory or glob (e.g. "custom/plugins/**") to define the apps to process.',
        default: '**',
    },
    exclude: {
        description: 'Exclude specified path or glob. Can be used many times.',
        alias: 'e',
    },
    'create-loader-file': {
        description: 'Creates a template containing only the angular dist scripts',
    },
    'loader-file-name': {
        description: 'The name of the loader file',
        default: 'app-loader.tpl',
    },
}
export const handler = (argv: Argv) => container.resolve(Serve).run(argv, builder)
