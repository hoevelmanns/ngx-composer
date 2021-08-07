import {Listr} from 'listr2'
import chalk from 'chalk'
import {Argv, Command} from './types'
import {container, inject, injectable} from 'tsyringe'
import {Apps, Shell} from '../targets'
import {ContextService, TreeService} from "../services"
import {Ctx} from "../services"

@injectable()
class BuildCommand implements Command {

    constructor(
        @inject(Apps) private apps: Apps,
        @inject(Shell) private shell: Shell,
        @inject(TreeService) private tree: TreeService,
        @inject(ContextService) private contextService: ContextService
    ) {
    }

    async run(argv: Argv): Promise<void> {
        this.tree.build(argv.directory, argv.exclude)

        const tasks = new Listr([
            {
                task: (ctx: Ctx): void => {

                    Object.assign(ctx, this.contextService.buildContext(argv))
                },
            },
            {
                title: 'Building the collected workspace applications...',
                options: {showTimer: true},
                enabled: (ctx: Ctx): boolean => !ctx.singleBundle,
                task: async (ctx: Ctx) => await this.apps.build(ctx),
            },
            {
                title: 'Building the shell...',
                options: {showTimer: true},
                task: async (ctx: Ctx) => await this.shell.buildOrServe(ctx, this.tree),
            }
        ], {
            registerSignalListeners: true,
            ctx: this.contextService.buildContext(argv)
        })

        await tasks.run()
            .then((ctx: Ctx) => console.log(chalk.green('Successfully built!'), {ctx}))
            .catch(e => console.log('Error: ', e.stderr ?? e))
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
        default: '**'
    },
    exclude: {description: 'Exclude specified path or glob. Can be used many times.', alias: 'e'},
    'single-build': {description: 'Only build the shell app.', alias: 's'},
    concurrent: {description: 'Run the tasks concurrently.', default: true, alias: 'c'},
    'vendor-chunk': {description: 'Generate a seperate bundle containing only vendor libraries.', default: true},
    'named-chunks': {description: 'Use file name for lazy loaded chunks,', default: true},
}
export const handler = (argv: Argv) => container.resolve(BuildCommand).run(argv)

