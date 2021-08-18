import { autoInjectable, singleton } from 'tsyringe'
import execa, { ExecaChildProcess } from 'execa'

@autoInjectable()
@singleton()
export class NgCliService {
    private bin = 'ng'

    checkPeerDeps() {}

    /**
     * Creates new Angular Workspace
     */
    async new(
        name: string,
        options?: { args: string[]; cwd?: string; options?: execa.Options; packageManager?: 'npm' | 'pnpm' | 'yarn' }
    ): Promise<void> {
        await execa(this.bin, ['new', name, ...options.args], {
            cwd: options.cwd ?? process.cwd(),
            ...options.options,
        })
    }

    /**
     * Builds an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    build(args: string[], cwd?: string, options?: execa.Options): ExecaChildProcess {
        return execa(this.bin, ['build', ...args], {
            cwd,
            ...options,
        })
    }

    /**
     * Serves an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    async serve(args: string[], cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['serve', ...args], {
            cwd,
            ...options,
        })
    }

    /**
     * Configures an angular workspace
     *
     * @param {string} jsonPath
     * @param {string} value
     * @param {string} cwd
     * @param {execa.Options} options
     */
    async config(jsonPath: string, value: string, cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['config', '--jsonPath', jsonPath, '--value', value], {
            cwd,
            ...options,
            stdio: 'ignore',
        })
    }

    async setUnlimitedBudget(appName: string, dir: string): Promise<void> {
        await this.config(`projects.${appName}.architect.build.configurations.production.budgets`, '[]', dir)
    }

    async add(pkgName: string, cwd: string): Promise<void> {
        await execa(this.bin, ['add', pkgName, '--skip-confirmation'], { cwd }).catch(e => null)
    }
}
