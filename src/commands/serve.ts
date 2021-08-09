import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Shell } from 'targets'
import { ContextService, Ctx, TreeService } from 'services'
import { Listr } from 'listr2'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'

@injectable()
class Serve implements Command {
    constructor(
        @inject(Shell) private shell: Shell,
        @inject(TreeService) private treeService: TreeService,
        @inject(ContextService) private contextService: ContextService
    ) {}

    async run(argv: Argv): Promise<void> {
        const tree = this.treeService.build(argv.directory, argv.exclude)

        const tasks = new Listr(
            {
                task: async (ctx: Ctx, task: TaskWrapper<any, any>) => await this.shell.serve(task, tree),
            },
            {
                registerSignalListeners: true,
                ctx: this.contextService.buildContext(argv),
            }
        )

        await tasks.run().catch(e => console.log('Error: ', e.stderr ?? e))
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
        description: 'Directory or glob (e.g. "custom/plugins/**") to define the apps to process.',
        default: '**',
    },
    exclude: {
        description: 'Exclude specified path or glob. Can be used many times.',
        alias: 'e',
    },
}
export const handler = (argv: Argv) => container.resolve(Serve).run(argv)
