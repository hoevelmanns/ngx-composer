import { Listr } from 'listr2'
import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'shell'
import { ContextService, Ctx } from 'context'
import { CommandBuilder } from 'yargs'

@injectable()
class Build implements Command {
    constructor(@inject(Shell) private shell: Shell, @inject(ContextService) private context: ContextService) {}

    async run(argv: Argv, builder: CommandBuilder): Promise<void> {
        const tasks = new Listr(
            [
                {
                    title: 'Preparing shell...',
                    task: async (_, task) => this.shell.generate().then(() => (task.title = 'Shell is ready.')),
                },
            ],
            {
                exitOnError: true,
                rendererOptions: { showErrorMessage: false },
                registerSignalListeners: true,
                ctx: this.context.buildContext(argv, builder),
            }
        )

        await tasks
            .run()
            .then(async (ctx: Ctx) => this.shell.build(ctx))
            .catch(e => {
                console.error('Error running build:')
                console.error(e.stderr ?? e.message)
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
        default: true,
    },
    'named-chunks': {
        description: 'Use file name for lazy loaded chunks,',
        default: false,
    },
}
export const handler = (argv: Argv) => container.resolve(Build).run(argv, builder)
