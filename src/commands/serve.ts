import {Argv, Command} from "./types"
import {container, injectable} from "tsyringe"

// todo ServeCommand
@injectable()
class ServeCommand implements Command {

    async run(argv: Argv): Promise<void> {
    }
}

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'serve'
export const describe = 'Serve the angular application(s)'
export const builder = {
    directory: {description: 'Directory or glob (e.g. "custom/plugins/**") to define the apps to process.', default: '**'},
    exclude: {description: 'Exclude specified path or glob. Can be used many times.', alias: 'e'},
}
export const handler = (argv: Argv) => container.resolve(ServeCommand).run(argv)
