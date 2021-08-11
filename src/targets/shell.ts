import {Md5} from 'ts-md5'
import {cleanDir, createDir, tsConfig} from 'utils'
import execa from 'execa'
import {writeFile, writeJSONSync} from 'fs-extra'
import {ListrTaskResult} from 'listr2/dist/interfaces/listr.interface'
import {autoInjectable, inject} from 'tsyringe'
import {join} from 'path'
import {Ctx, TreeService} from 'services'
import {TaskWrapper} from 'listr2/dist/lib/task-wrapper'
import {Listr} from 'listr2'

@autoInjectable()
export class Shell {
    protected name = 'shell'
    protected tempDir = join(__dirname, '..', '.cache')
    protected path = join(this.tempDir, this.name)
    protected templateDir = join(process.cwd(), 'templates')
    protected shellTsConfigPath = join(this.path, 'tsconfig.json')
    protected mainTsPath = join(this.tempDir, this.name, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    private eta = require('eta')

    constructor(@inject(TreeService) private treeService: TreeService) {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    serve = async (ctx: Ctx): Promise<ListrTaskResult<Ctx>> =>
        new Listr(
            {
                title: 'Generating the shell...',
                task: () => this.generate(),
            },
            {ctx}
        )
            .run()
            .then(() =>
                execa('ng', ['serve', ...ctx.ngOptions.toArray()], {
                    cwd: this.path,
                    stdio: 'inherit',
                })
            )

    build = async (task: TaskWrapper<any, any>): Promise<ListrTaskResult<Ctx>> =>
        task.newListr(
            [
                {
                    title: 'Generating...',
                    task: async () => this.generate(),
                },
                {
                    title: 'Building...',
                    task: async (ctx: Ctx) => // todo more elegant
                        await execa('ng', ['config', '--json-path', 'projects.shell.architect.build.configurations.production.budgets', '--value', '[]'], {
                            cwd: this.path,
                            stdio: "inherit"
                        }).then(() => execa('ng', ['build', '--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], {
                            cwd: this.path,
                        }))
                },
            ],
            {exitOnError: true}
        )

    private async generate(): Promise<void> {
        const args = '--defaults --minimal --skip-git --skip-tests'.split(' ')

        cleanDir(this.tempDir)
        createDir(this.tempDir)

        await execa('ng', ['new', this.name, ...args], {
            stdio: 'ignore',
            cwd: this.tempDir,
        }).catch(e => new Error('Error generating shell:\n' + e.message))

        await this.overwriteMainFile()
        await this.updateTsConfig()
    }

    private async updateTsConfig() {
        // todo merge origin with app config
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()
        console.log("origin", shellTsConfig.compilerOptions)

        console.log(this.treeService.getWorkspaces().map(t => {
            const filePath = t.defaultProject.getWorkingDir()

            const paths = Object
                .entries(t.defaultProject.getTsConfig().compilerOptions.paths)
                .map(([name, paths]) => ({[name]: paths.map(p => (join(process.cwd(), filePath, p).toString()))}))
                .reduce((cur, acc) => ({...cur, ...acc}))

            shellTsConfig.compilerOptions.paths = {...shellTsConfig.compilerOptions.paths, ...paths}
        }))

        console.log("after", shellTsConfig.compilerOptions)
        // todo add compilerOptions.rootDir = '.' instead of using process.cwd()
        shellTsConfig.compilerOptions['resolveJsonModule'] = true
        shellTsConfig['exclude'] = ['node_modules', 'tmp']
        shellTsConfig['esModuleInterop'] = true

        writeJSONSync(this.shellTsConfigPath, shellTsConfig, {spaces: '  '})
    }

    private async overwriteMainFile(): Promise<void> {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]
        const workspaces = this.treeService.getWorkspaces()

        workspaces.map(app => {
            const {defaultProject} = app
            const isModuleNameRedundant = workspaces.filter(w => w.defaultProject.getName() === defaultProject.getName()).length > 1
            const moduleName = isModuleNameRedundant
                ? `${defaultProject.getName()}_${Md5.hashStr(defaultProject.getModulePath())}`
                : defaultProject.getName()

            appImports.push(`import { AppModule as ${moduleName} } from '${defaultProject.getModulePath()}'\n`)
            bootstrapModules.push(`platformBrowserDynamic().bootstrapModule(${moduleName}).catch(err => console.error(err))\n`)
        })

        const content = await this.eta.renderFile(this.mainTsTemplate, {
            appImports,
            bootstrapModules,
        })

        await writeFile(this.mainTsPath, content)
    }
}
