import {Md5} from 'ts-md5'
import {cleanDir, createDir} from 'utils'
import execa from 'execa'
import {writeFile} from 'fs-extra'
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
                task: async (): Promise<void> => this.generate(),
            },
            {ctx}
        )
            .run()
            .then(
                async () =>
                    await execa('ng', ['serve', ...ctx.ngOptions.toArray()], {
                        cwd: this.path,
                        stdio: 'inherit',
                    })
            )

    build = async (task: TaskWrapper<any, any>): Promise<ListrTaskResult<Ctx>> =>
        task.newListr([
                {
                    title: 'Generating...',
                    task: async () => this.generate(),
                },
                {
                    title: 'Building...',
                    task: async (ctx: Ctx) =>
                        await execa('ng', ['build', '--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], {
                            cwd: this.path,
                        }),
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

        await this.updateMainEntryPoint()
        await this.updateTsConfig()
    }

    private async updateTsConfig() {
        // todo updateTsConfig()
    }

    private async updateMainEntryPoint(): Promise<void> {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]
        const workspaces = this.treeService.getWorkspaces()

        workspaces.map(app => {
            const {modulePath, name} = app.defaultProject
            const isModuleNameRedundant = workspaces.filter(w => w.defaultProject.name === name).length > 1
            const moduleName = isModuleNameRedundant ? `${name}_${Md5.hashStr(modulePath)}` : name

            appImports.push(`import { AppModule as ${moduleName} } from '${modulePath}'\n`)
            bootstrapModules.push(
                `platformBrowserDynamic().bootstrapModule(${moduleName}).catch(err => console.error(err))\n`
            )
        })

        const content = await this.eta.renderFile(this.mainTsTemplate, {
            appImports,
            bootstrapModules,
        })

        await writeFile(this.mainTsPath, content)
    }
}
