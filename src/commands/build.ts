import { Listr } from 'listr2'
import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Apps, Shell } from 'targets'
import { ContextService, Ctx } from 'context'

@injectable()
class Build implements Command {
    constructor(
        @inject(Apps) private apps: Apps,
        @inject(Shell) private shell: Shell,
        @inject(ContextService) private contextService: ContextService
    ) {}

    async run(argv: Argv): Promise<void> {
        const tasks = new Listr(
            [
                {
                    title: 'Building packages',
                    options: { showTimer: true },
                    exitOnError: true,
                    enabled: (ctx: Ctx): boolean => !ctx.singleBundle,
                    task: async (ctx: Ctx, task) => this.apps.build(ctx, task),
                },
                {
                    title: 'Creating shell application...',
                    task: async (_, task) => {
                        await this.shell.generate()
                        task.title = 'Shell application created.'
                    },
                },
            ],
            {
                exitOnError: true,
                registerSignalListeners: true,
                ctx: this.contextService.buildContext(argv, builder),
            }
        )

        await tasks
            .run()
            .then(async (ctx: Ctx) => await this.shell.build(ctx))
            .catch(e => {
                console.error('Error running build', e.stderr ?? e.message)
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
        description: 'Generate a seperate bundle containing only vendor libraries.',
        default: true,
    },
    'named-chunks': {
        description: 'Use file name for lazy loaded chunks,',
        default: false,
    },
}
export const handler = (argv: Argv) => container.resolve(Build).run(argv)
