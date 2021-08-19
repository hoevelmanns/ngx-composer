import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'shell'
import { Listr } from 'listr2'
import { ContextService } from 'context'
import {CommandBuilder} from "yargs"

@injectable()
class Serve implements Command {
    constructor(@inject(Shell) private shell: Shell, @inject(ContextService) private context: ContextService) {}

    async run(argv: Argv, builder: CommandBuilder): Promise<void> {
        const ctx = this.context.buildContext(argv, builder)

        const tasks = new Listr(
            [
                {
                    title: 'Preparing shell...',
                    task: async (_, task) => {
                        await this.shell.generate()
                        task.title = 'Shell is ready.'
                    },
                },
            ],
            { ctx, rendererOptions: { showErrorMessage: false } }
        )

        await tasks
            .run()
            .then(() => this.shell.serve(ctx))
            .catch(e => {
                console.error('Error serving app')
                console.error(e.stderr ?? e.message)
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
}
export const handler = (argv: Argv) => container.resolve(Serve).run(argv, builder)
