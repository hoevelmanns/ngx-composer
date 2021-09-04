import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'shell'
import { Listr } from 'listr2'
import { ContextService } from 'context'
import { CommandBuilder } from 'yargs'
import chalk from 'chalk'

@injectable()
class Serve implements Command {
    constructor(@inject(Shell) private shell: Shell, @inject(ContextService) private context: ContextService) {}

    async run(argv: Argv, builder: CommandBuilder): Promise<void> {
        const tasks = new Listr(
            [
                {
                    enabled: ctx => ctx.createLoaderFile,
                    task: async (ctx, task) =>
                        this.shell
                            .createLoaderFile(ctx, true)
                            .then(() => (task.title = `Loader file ${chalk.cyan(ctx.loaderFileName)} created.`)),
                },
                {
                    title: this.shell.shellExist() ? 'Shell exist. Updating...' : 'Creating shell...',
                    options: { showTimer: true },
                    task: async (_, task) => {
                        await this.shell.generate()
                        task.title = 'Shell preparation complete.'
                    },
                },
            ],
            {
                ctx: this.context.buildContext(argv, builder),
                rendererOptions: { showErrorMessage: false },
            }
        )

        await tasks
            .run()
            .then(ctx => this.shell.serve(ctx))
            .catch(e => {
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
