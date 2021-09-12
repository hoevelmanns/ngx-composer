import { ngBuild, ngCreate, ngInstall, ngServe, ngSetUnlimitedBudget } from '@ngx-composer/ng-tools'
import { outputFile, readFile, writeFile, writeJson } from 'fs-extra'
import { Listr, ListrTask, ListrTaskWrapper } from 'listr2'
import { autoInjectable, inject } from 'tsyringe'
import { createDir, tsConfig } from 'utils'
import { name } from '../../package.json'
import { Package } from '../tree/package'
import * as cheerio from 'cheerio'
import { Argv, Tree } from 'tree'
import { existsSync } from 'fs'
import { Ctx } from 'context'
import { join } from 'path'
import yargs from 'yargs'

/**
 * The shell application is used to bootstrap the default projects of the collected Angular workspaces together.
 */
@autoInjectable()
export class Shell {
    protected readonly name = 'shell'
    protected readonly cacheDir = join(process.env.PWD ?? '', 'node_modules', name, '.cache')
    protected readonly shellAppDir = join(this.cacheDir, this.name)
    protected readonly templateDir = join(__dirname, 'templates')
    protected readonly shellTsConfigPath = join(this.shellAppDir, 'tsconfig.json')
    protected readonly mainTsPath = join(this.cacheDir, this.name, 'src', 'main.ts')
    private readonly mergedPackage: Package
    private readonly eta = require('eta')

    constructor(@inject(Tree) private tree: Tree) {
        const args = <Argv>yargs(process.argv)
        const { directory, exclude } = args.options({ e: { alias: 'exclude' }, d: { alias: 'directory', default: '**' } }).argv

        this.tree.init(directory, exclude)
        this.mergedPackage = this.tree.packages.merge()

        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    /**
     * Runs the serve process of the shell application.
     */
    async serve(ctx: Ctx): Promise<void> {
        await ngServe(ctx.ngOptions?.toArray(), this.shellAppDir, { stdio: 'inherit' })
    }

    /**
     * Runs the build process of the shell application.
     */
    async build(ctx: Ctx): Promise<void> {
        await ngBuild(['--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], this.shellAppDir, { stdio: 'inherit' })
    }

    /**
     * Creates a file containing only the shell dist scripts.
     */
    async createLoader(ctx: Ctx, serve?: boolean): Promise<void> {
        const encoding = 'utf8'
        const scripts = <string[]>[]
        const indexHtml = serve
            ? this.eta.renderFile('app-loader.dev.eta')
            : await readFile(join(ctx.outputPath, 'index.html'), { encoding })
        const $ = cheerio.load(indexHtml)

        $('script, link[rel="stylesheet"]').each((index, elem) => scripts.push($.html(elem)))

        await outputFile(join(ctx.outputPath, ctx.loaderFileName), scripts.join('\n'), { encoding })
    }

    /**
     * Generates the shell application.
     * todo add more information
     */
    async generate(mainTask: ListrTaskWrapper<any, any>): Promise<Listr> {
        const cliVersion = this.mergedPackage?.findDependency('@angular/cli')?.version
        const tasks = [
            {
                enabled: () => !existsSync(this.shellAppDir), // todo consider force option
                title: `Creating shell using Angular CLI Version ${cliVersion}`,
                task: async (_, task) => {
                    await createDir(this.cacheDir)
                    await ngCreate(
                        this.name,
                        {
                            args: ['--defaults', '--minimal', '--skip-git', '--skip-tests', '--skip-install'],
                            cwd: this.cacheDir,
                        },
                        cliVersion
                    )

                    await ngSetUnlimitedBudget(this.name, this.shellAppDir)

                    task.title = 'Shell created.'
                },
            },
            {
                title: 'Updating typescript configuration...',
                task: async (_, task) => await this.updateTsConfig().then(_ => (task.title = 'Typescript configuration updated.')),
            },
            {
                title: 'Updating entrypoint...',
                task: async (_, task) => await this.updateMain().then(_ => (task.title = 'Entrypoint updated.')),
            },
            {
                title: 'Installing dependencies...',
                options: { persistentOutput: true },
                task: async (_, task) => {
                    await this.updateShellPackageJson()
                    await ngInstall(this.shellAppDir)
                    task.title = 'Dependencies installed.'
                },
            },
            {
                task: () => (mainTask.title = 'Shell preparation complete.'),
            },
        ] as ListrTask<unknown>[]

        this.tree.listWorkspaces()

        mainTask.title = 'Preparing shell application...'

        return mainTask.newListr(tasks, {
            exitOnError: true,
            registerSignalListeners: true,
            rendererOptions: { showTimer: true },
        })
    }

    /**
     * Updates the shell package json with the merged packages dependencies
     */
    private async updateShellPackageJson(): Promise<void> {
        const shellPackage = Package.load(this.shellAppDir)
        const devDependencies = shellPackage.json.devDependencies ?? this.mergedPackage.json.devDependencies
        const name = '@rdss/ng-shell'

        await this.mergedPackage.assign({ name, devDependencies }).write(this.shellAppDir)
    }

    /**
     * todo
     * @protected
     */
    private async updateTsConfig(): Promise<void> {
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()
        const workspacesCompilerPaths = this.tree.workspaces
            .getAll()
            .map(({ defaultProject: { getWorkspaceDir, getTsConfig } }) => {
                const workspaceDir = join(process.cwd(), getWorkspaceDir())
                const compilerOptionsPaths = getTsConfig()?.compilerOptions?.paths
                return (
                    compilerOptionsPaths &&
                    Object.entries(compilerOptionsPaths)
                        .map(([name, paths]) => ({ [name]: paths.map(path => join(workspaceDir, path).toString()) }))
                        .reduce((cur, acc) => ({ ...cur, ...acc }), {})
                )
            })
            .filter(p => p)
            .shift()

        // todo TSconfig.load()
        shellTsConfig.compilerOptions = {
            ...shellTsConfig.compilerOptions,
            paths: {
                ...workspacesCompilerPaths,
                ...{ '*': ['./node_modules/*'] },
            },
            allowSyntheticDefaultImports: true,
            preserveSymlinks: true,
            resolveJsonModule: true,
        }

        await writeJson(this.shellTsConfigPath, shellTsConfig, { spaces: '  ' })
    }

    private async updateMain(): Promise<void> {
        const apps = this.tree.workspaces.getAll().map(({ defaultProject }) => `export * from '${defaultProject.getMain()}'\n`)
        const content = await this.eta.renderFile('main.ts.eta', { apps })

        await writeFile(this.mainTsPath, content)
    }
}
