import { Md5 } from 'ts-md5'
import { cleanDir, createDir } from 'utils'
import execa from 'execa'
import { writeFile } from 'fs-extra'
import { ListrTaskResult } from 'listr2/dist/interfaces/listr.interface'
import { autoInjectable } from 'tsyringe'
import { join } from 'path'
import { Tree, Ctx } from 'services'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'

@autoInjectable()
export class Shell {
    protected name = 'shell'
    protected tempDir = join(__dirname, '..', '.cache')
    protected path = join(this.tempDir, this.name)
    protected templateDir = join(process.cwd(), 'templates')
    protected mainTsPath = join(this.tempDir, this.name, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    private eta = require('eta')

    constructor() {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    async generate(tree: Tree): Promise<void> {
        const args = '--defaults --minimal --skip-git --skip-tests'.split(' ')

        cleanDir(this.tempDir)
        createDir(this.tempDir)

        await execa('ng', ['new', this.name, ...args], {
            stdio: 'ignore',
            cwd: this.tempDir,
        }).catch(e => new Error('Error generating shell:\n' + e.message))

        await this.updateMainEntryPoint(tree)
        await this.updateTsConfig(tree)
    }

    serve = async (task: TaskWrapper<any, any>, tree: Tree): Promise<ListrTaskResult<Ctx>> =>
        task
            .newListr({
                title: 'Generating the shell...',
                task: async (): Promise<void> => this.generate(tree),
            })
            .run()
            .then(
                async () =>
                    await execa.command('ng serve', {
                        cwd: this.path,
                        stdio: 'inherit',
                    })
            )

    build = async (task: TaskWrapper<any, any>, tree: Tree): Promise<ListrTaskResult<Ctx>> =>
        task.newListr(
            [
                {
                    title: 'Generating...',
                    task: async () => this.generate(tree),
                },
                {
                    title: 'Building...',
                    task: async (ctx: Ctx) =>
                        await execa('ng', ['build', '--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], {
                            cwd: this.path,
                        }).catch(e => {
                            throw new Error('Error building shell:\n' + e.message)
                        }),
                },
            ],
            { exitOnError: true }
        )

    private async updateTsConfig(tree: Tree) {
        // todo updateTsConfig()
    }

    private async updateMainEntryPoint(tree: Tree): Promise<void> {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]

        tree.workspaces.map(app => {
            const { modulePath, name } = app.defaultProject
            const isModuleNameRedundant = tree.workspaces.filter(w => w.defaultProject.name === name).length > 1
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
