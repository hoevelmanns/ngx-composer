import { autoInjectable, singleton } from 'tsyringe'
import execa, { ExecaReturnValue } from 'execa'
import { join } from 'path'
import * as fg from 'fast-glob'
import { rm } from 'fs-extra'

@autoInjectable()
@singleton()
export class NgCliService {
    private bin = join(__dirname, '../node_modules/.bin/ng')

    /**
     * Creates new Angular Workspace
     *
     * @param {string} name
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    new = async (name: string, args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        execa(this.bin, ['new', name, ...args], {
            cwd,
            ...options,
        })

    /**
     * Builds an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    build = async (args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        await fg(join(process.cwd(), 'node_modules/**/__ngcc_lock_file__'))
            .then(files => files.map(async lockFile => await rm(lockFile)))
            .then(() =>
                execa(this.bin, ['build', ...args], {
                    cwd,
                    ...options,
                })
            )

    /**
     * Serves an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    serve = async (args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        execa(this.bin, ['serve', ...args], {
            cwd,
            ...options,
        })

    /**
     * Configures an angular workspace
     *
     * @param {string} jsonPath
     * @param {string} value
     * @param {string} cwd
     * @param {execa.Options} options
     */
    config = async (jsonPath: string, value: string, cwd?: string, options?: execa.Options) =>
        execa(this.bin, ['config', '--jsonPath', jsonPath, '--value', value], {
            cwd,
            ...options,
            stdio: 'ignore',
        })
}
