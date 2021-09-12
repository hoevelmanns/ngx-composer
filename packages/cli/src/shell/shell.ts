import { NgTools } from '@ngx-composer/ng-tools'
import { outputFile, readFile, writeFile, writeJson } from 'fs-extra'
import { Listr, ListrTask, ListrTaskWrapper } from 'listr2'
import { autoInjectable, inject } from 'tsyringe'
import { createDir, makeAbsolute, tsConfig, TsConfigContent } from 'utils'
import { name } from '../../package.json'
import { Package } from '../tree/package'
import * as cheerio from 'cheerio'
import { Tree } from 'tree'
import { existsSync } from 'fs'
import { join } from 'path'
import merge from 'ts-deepmerge'
import chalk from 'chalk'
import { Config } from './config'
import { IConfig } from './types'

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
    private readonly mergedPackage: Package = this.tree.packages.merge()
    private readonly ng = new NgTools(this.shellAppDir)
    private readonly eta = require('eta')

    constructor(@inject(Tree) private tree: Tree, @inject(Config) private config: Config) {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    /**
     * Runs the serve process of the shell application.
     */
    async serve(config: IConfig): Promise<void> {
        const ctx = this.config.init(config).get()
        const tasks = new Listr(
            [
                {
                    enabled: ctx => !!ctx?.createLoaderFile,
                    task: async (ctx, task) => {
                        await this.createLoader(ctx.outputPath, ctx.loaderFileName, true)
                        task.title = `Loader file ${chalk.cyan(ctx.loaderFileName)} created.`
                    },
                },
                {
                    options: { showTimer: true },
                    task: async (_, task) => await this.generate(task),
                },
                {
                    task: async ctx => await this.ng.serve(ctx.ngOptions?.toArray() ?? [], this.shellAppDir, { stdio: 'inherit' }),
                },
            ],
            { ctx, rendererOptions: { showErrorMessage: false } }
        )

        await tasks.run().catch(e => {
            console.error('Error serving app')
            console.error(e.stderr ?? e.message)
            process.exit(1)
        })
    }

    /**
     * Runs the build process of the shell application.
     */
    async build(config: IConfig, silent = false): Promise<void> {
        const ctx = this.config.init(config).get()
        const tasks = new Listr(
            [
                {
                    options: { showTimer: true },
                    task: (_, task): Promise<Listr> => this.generate(task),
                },
                {
                    options: { showTimer: true },
                    task: async (ctx, task) => {
                        const args = ['--output-path', ctx.outputPath ?? 'dist', ...(ctx.ngOptions?.toArray() ?? [])]
                        await this.ng.build(args, this.shellAppDir, { stdio: 'inherit' })
                        task.title = `Application built in ${chalk.cyan(ctx.outputPath)}`
                    },
                },
                {
                    enabled: ctx => !!ctx.createLoaderFile,
                    task: async (ctx, task) => {
                        await this.createLoader(ctx.outputPath, ctx.loaderFileName)
                        task.title = `Loader file ${chalk.cyan(ctx.loaderFileName)} created.`
                    },
                },
            ],
            {
                ctx,
                rendererSilent: silent,
                exitOnError: true,
                rendererOptions: { showErrorMessage: false },
                registerSignalListeners: true,
            }
        )

        await tasks.run().catch(e => {
            console.error(e.stderr ?? e.message)
            process.exit(1)
        })
    }

    /**
     * Creates a file containing only the shell dist scripts.
     */
    async createLoader(outputDir = 'dist', loaderFileName = 'app-loader.tpl', serve?: boolean): Promise<void> {
        outputDir = makeAbsolute(outputDir)
        const encoding = 'utf8'
        const scripts = <string[]>[]
        const indexHtml = serve
            ? this.eta.renderFile('app-loader.dev.eta')
            : await readFile(join(outputDir, 'index.html'), { encoding })
        const $ = cheerio.load(indexHtml)

        $('script, link[rel="stylesheet"]').each((index, elem) => scripts.push($.html(elem)))

        await outputFile(join(outputDir, loaderFileName), scripts.join('\n'), { encoding })
    }

    /**
     * Generates the shell application.
     * todo add more information
     */
    async generate(mainTask: ListrTaskWrapper<any, any>): Promise<Listr> {
        const cliVersion = this.mergedPackage?.findDependency('@angular/cli')?.version

        const tasks = [
            {
                title: `Creating shell using Angular CLI Version ${cliVersion}`,
                options: { showTimer: true },
                enabled: () => !existsSync(this.shellAppDir), // todo consider force option
                task: async (_, task) => {
                    const args = ['--defaults', '--minimal', '--skip-git', '--skip-tests', '--skip-install']
                    const cwd = this.cacheDir

                    await createDir(this.cacheDir)
                    await this.ng.new(this.name, { args, cwd }, cliVersion)
                    task.title = 'Shell created.'
                },
            },
            {
                title: 'Updating typescript configuration...',
                task: async (_, task) => {
                    await this.updateTsConfig()
                    task.title = 'Typescript configuration updated.'
                },
            },
            {
                title: 'Updating entrypoint...',
                task: async (_, task) => {
                    await this.updateMain()
                    task.title = 'Entrypoint updated.'
                },
            },
            {
                title: 'Installing dependencies...',
                options: { showTimer: true },
                task: async (_, task) => {
                    await this.updateShellPackageJson()
                    await this.ng.install(this.shellAppDir)
                    await this.ng.setUnlimitedBudget(this.name)

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
        })
    }

    /**
     * Updates the shell package json with the merged packages dependencies
     */
    private async updateShellPackageJson(): Promise<void> {
        const { devDependencies, name } = Package.load(this.shellAppDir).getContent()

        await this.mergedPackage.assign({ name, devDependencies }).write(this.shellAppDir)
    }

    private async updateTsConfig(): Promise<void> {
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()
        const mergedTsConfig = {} as TsConfigContent

        this.tree.workspaces.find().forEach(({ defaultProject }) => {
            const workspaceDir = join(process.cwd(), defaultProject.getWorkspaceDir())
            const compilerOptions = defaultProject.getTsConfig()?.compilerOptions ?? {}

            mergedTsConfig.compilerOptions = merge(mergedTsConfig?.compilerOptions ?? {}, compilerOptions)

            if (mergedTsConfig?.compilerOptions?.paths) {
                mergedTsConfig.compilerOptions.paths = Object.entries(mergedTsConfig.compilerOptions?.paths)
                    .map(([name, paths]) => ({ [name]: paths.map(path => makeAbsolute(path, workspaceDir)) }))
                    .reduce((cur, acc) => ({ ...cur, ...acc }), {})
            }
        })

        mergedTsConfig.compilerOptions.paths = { ...mergedTsConfig.compilerOptions.paths, ...{ '*': ['./node_modules/*'] } }

        Object.assign(shellTsConfig, merge(mergedTsConfig, shellTsConfig))

        shellTsConfig.compilerOptions.rootDir = process.cwd()

        await writeJson(this.shellTsConfigPath, shellTsConfig, { spaces: '  ' })
    }

    private async updateMain(): Promise<void> {
        const apps = this.tree.workspaces.find().map(({ defaultProject }) => `export * from '${defaultProject.getMain()}'\n`)
        const content = await this.eta.renderFile('main.ts.eta', { apps })

        await writeFile(this.mainTsPath, content)
    }
}
