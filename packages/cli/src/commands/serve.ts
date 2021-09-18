import { Argv } from './types'
import { container } from 'tsyringe'
import { Shell } from 'shell'

/**
 * Command definition
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
 */
export const command = 'serve'
export const describe = 'Serve the angular application(s)'
export const builder = {
    directory: {
        description: 'Directories or glob (e.g. "custom/plugins/**") to define the workspaces to process.',
        default: '**',
        alias: 'd',
        type: 'array',
    },
    exclude: {
        description: 'Exclude specified path or glob.',
        alias: 'e',
        type: 'array',
    },
    'create-loader-file': {
        description: 'Creates a template containing only the angular dist scripts',
        type: 'boolean',
    },
    'loader-file-name': {
        description: 'The name of the loader file',
        default: 'app-loader.tpl',
        type: 'string',
    },
}
export const handler = (argv: Argv) => container.resolve(Shell).serve(argv)
