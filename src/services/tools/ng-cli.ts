import { autoInjectable, singleton } from 'tsyringe'
import execa, { ExecaReturnValue } from 'execa'
import { join } from 'path'

@autoInjectable()
@singleton()
export class NgCliService {
    private bin = join(__dirname, '..', 'node_modules/.bin/ng')

    new = async (name: string, args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        execa(this.bin, ['new', name, ...args], {
            cwd,
            ...options,
        })

    build = async (args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        execa(this.bin, ['build', ...args], {
            cwd,
            ...options,
        })

    serve = async (args: string[], cwd?: string, options?: execa.Options): Promise<ExecaReturnValue> =>
        execa(this.bin, ['serve', ...args], {
            cwd,
            ...options,
        })

    config = async (jsonPath: string, value: string, cwd?: string, options?: execa.Options) =>
        execa(this.bin, ['config', ...[jsonPath, value].map(arg => '--' + arg)], {
            cwd,
            ...options,
        })
}
