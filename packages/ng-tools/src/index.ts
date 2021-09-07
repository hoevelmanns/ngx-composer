import { autoInjectable, singleton } from 'tsyringe'
import execa from 'execa'
import { lookpath } from 'lookpath'

@autoInjectable()
@singleton()
export class NgCliService {
    private bin = 'ng'

    /**
     * Runs the creation of a new Angular Workspace
     * @link https://angular.io/cli/new
     */
    async new(name: string, options?: { args: string[]; cwd?: string; options?: execa.Options }): Promise<void> {
        await execa(this.bin, ['new', name, ...(options?.args ?? [])], {
            cwd: options?.cwd ?? process.cwd(),
            ...options?.options,
        })
    }

    /**
     * Runs the build of an angular application
     *
     * @link https://angular.io/cli/build
     */
    async build(args: string[], cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['build', ...args], {
            cwd,
            ...options,
        })
    }

    /**
     * Runs the serve process of an Angular application.
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

    /**
     * Removes the budget configuration
     */
    async setUnlimitedBudget(appName: string, dir: string): Promise<void> {
        await this.config(`projects.${appName}.architect.build.configurations.production.budgets`, '[]', dir)
    }

    /**
     * Runs 'ng add' to install a package and run a schematic.
     *
     * @link https://angular.io/cli/add
     */
    async add(pkgName: string, cwd: string): Promise<void> {
        await execa(this.bin, ['add', pkgName, '--skip-confirmation'], { cwd }).catch(null)
    }

    /**
     * Installs dependencies
     */
    async install(cwd: string, silent = true): Promise<void> {
        const pkgManager = await this.getPackageManager()
        await execa(pkgManager, ['install'], { cwd, stdio: silent ? 'ignore' : 'inherit' })
    }

    private getPackageManager = async () => ((await lookpath('yarn')) ? 'yarn' : 'npm')
}
