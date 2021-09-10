import execa, { ExecaChildProcess } from 'execa'
import { existsSync } from 'fs-extra'
import { join } from 'path'

const binDir = require('path').resolve(__dirname, '../node_modules/.bin/')
const npxBinNg = (version = '12.2.5') => `@angular/cli@${version}`
const npxBinPackageManager = 'yarn@1.22.11'
const localBinNg = join(binDir, 'ng')

/**
 * Runs the creation of a new Angular Workspace
 * @link https://angular.io/cli/new
 */
export const ngCreate = async (
    name: string,
    options?: {
        args: string[]
        cwd?: string
        options?: execa.Options
    },
    version?: string
): Promise<ExecaChildProcess> => {
    return execa('npx', [npxBinNg(version), 'new', name, ...(options?.args ?? [])], {
        cwd: options?.cwd ?? process.cwd(),
        ...options?.options,
    })
}

/**
 * Runs the build of an angular application
 *
 * @link https://angular.io/cli/build
 */
export const ngBuild = async (args: string[], cwd?: string, options?: execa.Options): Promise<void> => {
    await execa(localBinNg, ['build', ...args], {
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

export const ngServe = async (args: string[], cwd?: string, options?: execa.Options): Promise<void> => {
    await execa(localBinNg, ['serve', ...args], {
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
export const ngConfig = async (jsonPath: string, value: string, cwd?: string, options?: execa.Options): Promise<void> => {
    await execa(localBinNg, ['config', '--jsonPath', jsonPath, '--value', value], {
        cwd,
        ...options,
        stdio: 'ignore',
    })
}

/**
 * Removes the budget configuration
 */
export const ngSetUnlimitedBudget = async (appName: string, dir: string): Promise<void> => {
    await ngConfig(`projects.${appName}.architect.build.configurations.production.budgets`, '[]', dir)
}

/**
 * Runs 'ng add' to install a package and run a schematic.
 *
 * @link https://angular.io/cli/add
 */
export const ngAdd = async (pkgName: string, cwd: string): Promise<void> => {
    await execa(localBinNg, ['add', pkgName, '--skip-confirmation'], { cwd }).catch(null)
}

/**
 * Installs dependencies
 */
export const ngInstall = async (cwd: string, silent = true): Promise<void> => {
    await execa('npx', [npxBinPackageManager, 'install'], { cwd, stdio: silent ? 'ignore' : 'inherit' })

    /**
     * Installs esbuild for latest angular/cli version. Important if 'ignore-scripts = true' is set in npm config
     * @link https://github.com/evanw/esbuild/blob/master/npm/esbuild/bin/esbuild
     */
    if (existsSync(join(cwd, 'node_modules/esbuild/install.js'))) {
        await execa.command('node node_modules/esbuild/install.js', { cwd }).catch(null)
    }
}
