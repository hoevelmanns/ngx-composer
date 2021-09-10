import { createDir, tsConfig } from 'utils'
import { outputFile, readFile, readJSONSync, writeFile, writeJson } from 'fs-extra'
import { autoInjectable, inject } from 'tsyringe'
import { join } from 'path'
import { Tree } from 'tree'
import { Ctx } from 'context'
import { existsSync } from 'fs'
import { name } from '../../package.json'
import { Listr } from 'listr2'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'
import * as cheerio from 'cheerio'
import { ngInstall, ngCreate, ngSetUnlimitedBudget, ngBuild, ngServe } from '@ngx-composer/ng-tools'

/**
 * The shell application is used to bootstrap the default projects of the collected Angular workspaces together.
 * todo add more information
 */
@autoInjectable()
export class Shell {
    protected readonly name = 'shell'
    protected readonly cacheDir = join(process.env.PWD ?? '', 'node_modules', name, '.cache')
    protected readonly path = join(this.cacheDir, this.name)
    protected readonly templateDir = join(__dirname, 'templates')
    protected readonly shellTsConfigPath = join(this.path, 'tsconfig.json')
    protected readonly mainTsPath = join(this.cacheDir, this.name, 'src', 'main.ts')
    private readonly eta = require('eta')
    private readonly shellPackage = this.tree.packages.merged()
    private readonly cliVersion =
        this.shellPackage?.devDependencies &&
        Object.entries(this.shellPackage.devDependencies)
            .filter(([key, value]) => key === '@angular/cli')
            .flat(1)
            .pop()

    constructor(@inject(Tree) private tree: Tree) {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    /**
     * Generates the shell application.
     * todo add more information
     */
    async generate(mainTask: TaskWrapper<any, any>): Promise<Listr> {
        await createDir(this.cacheDir)

        mainTask.title = 'Preparing shell application...'

        return mainTask.newListr(
            [
                {
                    enabled: () => !existsSync(this.path), // todo consider force option
                    title: `Creating shell using Angular CLI Version ${this.cliVersion}`,
                    task: async (_, task) => {
                        await ngCreate(
                            this.name,
                            {
                                args: ['--defaults', '--minimal', '--skip-git', '--skip-tests', '--skip-install'],
                                cwd: this.cacheDir,
                            },
                            this.cliVersion
                        )

                        await ngSetUnlimitedBudget(this.name, this.path)

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
                        await ngInstall(this.path)
                        task.title = 'Dependencies installed.'
                    },
                },
                {
                    task: () => (mainTask.title = 'Shell preparation complete.'),
                },
            ],
            {
                exitOnError: true,
                registerSignalListeners: true,
                rendererOptions: { showTimer: true },
            }
        )
    }

    /**
     * Runs the serve process of the shell application.
     */
    async serve(ctx: Ctx): Promise<void> {
        await ngServe(ctx.ngOptions?.toArray(), this.path, { stdio: 'inherit' })
    }

    /**
     * Runs the build process of the shell application.
     */
    async build(ctx: Ctx): Promise<void> {
        await ngBuild(['--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], this.path, { stdio: 'inherit' })
    }

    /**
     * Creates a file containing only the shell dist scripts.
     */
    async createLoaderFile(ctx: Ctx, serve?: boolean): Promise<void> {
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
     * Updates the shell package json with the merged packages dependencies
     */
    private async updateShellPackageJson(): Promise<void> {
        await writeJson(
            join(this.path, 'package.json'),
            {
                ...this.shellPackage,
                ...{
                    name: '@rdss/ng-shell',
                    devDependencies: readJSONSync(join(this.path, 'package.json'))?.devDependencies ?? {},
                },
            },
            { spaces: '  ' }
        )
    }

    /**
     * todo
     * @protected
     */
    private async updateTsConfig(): Promise<void> {
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()

        this.tree.workspaces.getAll().forEach(({ defaultProject: { getWorkspaceDir, getTsConfig } }) => {
            const workspaceDir = getWorkspaceDir()
            const compilerOptionsPaths = getTsConfig()?.compilerOptions?.paths
            const paths =
                compilerOptionsPaths &&
                Object.entries(compilerOptionsPaths)
                    .map(([name, paths]) => ({ [name]: paths.map(p => join(process.cwd(), workspaceDir, p).toString()) }))
                    .reduce((cur, acc) => ({ ...cur, ...acc }), {})

            if (paths) {
                shellTsConfig.compilerOptions.paths = { ...shellTsConfig.compilerOptions.paths, ...paths }
            }
        })

        shellTsConfig.compilerOptions.paths = {
            ...shellTsConfig.compilerOptions.paths,
            ...{
                '@angular/*': ['./node_modules/@angular/*'],
                '*': ['./node_modules/*'],
            },
        }

        shellTsConfig.compilerOptions.allowSyntheticDefaultImports = true
        shellTsConfig.compilerOptions.preserveSymlinks = true
        shellTsConfig.compilerOptions.resolveJsonModule = true

        await writeJson(this.shellTsConfigPath, shellTsConfig, { spaces: '  ' })
    }

    private async updateMain(): Promise<void> {
        const apps = this.tree.workspaces.getAll().map(({ defaultProject }) => `export * from '${defaultProject.getMain()}'\n`)
        const content = await this.eta.renderFile('main.ts.eta', { apps })

        await writeFile(this.mainTsPath, content)
    }
}
