import { Argv } from './types'
import { container } from 'tsyringe'
import { Shell } from 'shell'

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
        type: 'string',
    },
    exclude: {
        description: 'Exclude specified path or glob.',
        alias: 'e',
        type: 'array',
    },
    outputPath: {
        description: 'The full path for the new output directory',
        default: 'dist',
        type: 'string',
    },
    'vendor-chunk': {
        description: 'Generate a separate bundle containing only vendor libraries.',
        type: 'boolean',
        default: false,
    },
    'named-chunks': {
        description: 'Use file name for lazy loaded chunks.',
        default: false,
        type: 'boolean',
    },
    'create-loader-file': {
        description: 'Creates a template containing only the angular dist scripts',
        type: 'boolean',
        default: false,
    },
    'loader-file-name': {
        description: 'The name of the loader file',
        default: 'app-loader.tpl',
        type: 'string',
    },
}
export const handler = (argv: Argv) => container.resolve(Shell).build(argv)
