import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Apps, Shell } from 'targets'
import { removeNgccLockFiles } from 'tools'
import { Listr } from 'listr2'
import { ContextService } from 'context'

@injectable()
class Serve implements Command {
    constructor(
        @inject(Shell) private shell: Shell,
        @inject(Apps) private apps: Apps,
        @inject(ContextService) private contextService: ContextService
    ) {}

    async run(argv: Argv): Promise<void> {
        const ctx = this.contextService.buildContext(argv, builder)

        await removeNgccLockFiles()

        const tasks = new Listr(
            {
                title: 'Creating shell application...',
                task: async (_, task) => {
                    await this.shell.generate()
                    task.title = 'Shell application created.'
                },
            },
            { ctx }
        )

        await tasks
            .run()
            .then(() => this.shell.serve(ctx))
            .catch(e => {
                console.error('Error serving app', e.stderr ?? e.message)
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
export const handler = (argv: Argv) => container.resolve(Serve).run(argv)
