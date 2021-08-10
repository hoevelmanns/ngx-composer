import { Argv, Command } from './types'
import { container, inject, injectable } from 'tsyringe'
import { Apps, Shell } from 'targets'
import { ContextService } from 'services'

@injectable()
class Serve implements Command {
    constructor(
        @inject(Shell) private shell: Shell,
        @inject(Apps) private apps: Apps,
        @inject(ContextService) private contextService: ContextService
    ) {}

    async run(argv: Argv): Promise<void> {
        const ctx = this.contextService.buildContext(argv, builder)
        await this.shell.serve(ctx).catch(e => console.log('Error: ', e.stderr ?? e))
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
