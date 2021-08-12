import { Listr } from 'listr2'
import chalk from 'chalk'
import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Apps, Shell } from 'targets'
import { ContextService, Ctx } from 'services'

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
                    title: 'Running ngcc',
                    options: { showTimer: true },
                    enabled: (ctx: Ctx): boolean => !ctx.singleBundle,
                    task: async (ctx: Ctx, task) => await this.apps.ngcc(ctx, task),
                },
                {
                    title: 'Building applications...',
                    options: { showTimer: true },
                    exitOnError: true,
                    enabled: (ctx: Ctx): boolean => !ctx.singleBundle,
                    task: async (ctx: Ctx, task) => await this.apps.build(ctx, task), // && (task.title = "Applications successfully built")
                },
                {
                    title: 'Building shell...',
                    options: { showTimer: true },
                    task: (ctx: Ctx, task) => this.shell.build(task), // todo any
                },
            ],
            {
                exitOnError: true,
                rendererOptions: {
                    collapse: false,
                },
                registerSignalListeners: true,
                ctx: this.contextService.buildContext(argv, builder),
            }
        )

        await tasks
            .run()
            .then((ctx: Ctx) => console.log(chalk.green('Successfully built!'), { ctx }))
            .catch(e => {
                console.error('Error running build', e.stderr ?? e)
                process.exit()
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
    },
    exclude: {
        description: 'Exclude specified path or glob. Can be used many times.',
        alias: 'e',
    },
    'single-bundle': { description: 'Only build the shell app.', alias: 's' },
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
        default: true,
    },
}
export const handler = (argv: Argv) => container.resolve(Build).run(argv)
