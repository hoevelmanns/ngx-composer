import execa, { ExecaReturnValue } from 'execa'
import { existsSync } from 'fs-extra'
import { join } from 'path'

type ExecaOptions = execa.Options

export class NgTools {
    private npxBinNg = (version = '12.2.5') => `@angular/cli@${version}`
    private readonly cwd: string
    private readonly localBinNg: string
    private npxBinPackageManager = 'yarn@1.22.11'

    constructor(cwd = process.cwd()) {
        this.cwd = cwd
        this.localBinNg = join(cwd, './node_modules/.bin/ng')
    }

    /**
     * Runs the creation of a new Angular Workspace
     * @link https://angular.io/cli/new
     */
    new = async (
        name: string,
        options?: {
            args: string[]
            cwd?: string
            options?: ExecaOptions
        },
        version?: string
    ): Promise<ExecaReturnValue> => {
        return execa('npx', [this.npxBinNg(version), 'new', name, ...(options?.args ?? [])], {
            cwd: options?.cwd ?? process.cwd(),
            ...options?.options,
        })
    }

    /**
     * Runs the build of an angular application
     *
     * @link https://angular.io/cli/build
     */
    build = async (args: string[], cwd?: string, options?: ExecaOptions): Promise<ExecaReturnValue> => {
        return await this.runLocalNg(['build', ...args], cwd, options)
    }

    /**
     * Runs the serve process of an Angular application.
     */
    serve = async (args: string[], cwd?: string, options?: ExecaOptions): Promise<ExecaReturnValue> => {
        return await this.runLocalNg(['serve', ...args], cwd, options)
    }

    /**
     * Configures an angular workspace
     */
    config = async (jsonPath: string, value: string, cwd?: string, options?: ExecaOptions): Promise<ExecaReturnValue> =>
        await this.runLocalNg(['config', '--jsonPath', jsonPath, '--value', value], cwd, options)

    /**
     * Removes the budget configuration
     */
    setUnlimitedBudget = async (appName: string): Promise<ExecaReturnValue> =>
        await this.config(`projects.${appName}.architect.build.configurations.production.budgets`, '[]', this.cwd)

    /**
     * Runs 'ng add' to install a package and run a schematic.
     * @link https://angular.io/cli/add
     */
    add = async (pkgName: string, cwd: string): Promise<ExecaReturnValue> => {
        return await this.runLocalNg(['add', pkgName, '--skip-confirmation'], cwd).catch(null)
    }

    /**
     * Installs dependencies
     */
    install = async (cwd: string, silent = true): Promise<void> => {
        await execa('npx', [this.npxBinPackageManager, 'install', '--ignore-scripts'], { cwd, stdio: silent ? 'ignore' : 'inherit' })

        /**
         * Installs esbuild for latest angular/cli version. Important if 'ignore-scripts = true' is set in npm config
         * @link https://github.com/evanw/esbuild/blob/master/npm/esbuild/bin/esbuild
         */
        if (existsSync(join(cwd, 'node_modules/esbuild/install.js'))) {
            await execa.command('node node_modules/esbuild/install.js', { cwd }).catch(null)
        }
    }

    private runLocalNg = async (args: string[], cwd?: string, options?: ExecaOptions) =>
        await execa(this.localBinNg, args, {
            cwd,
            ...options,
        })
}
