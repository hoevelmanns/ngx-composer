import {Md5} from 'ts-md5'
import {cleanDir, createDir} from '../utils'
import execa from 'execa'
import {writeFile} from 'fs-extra'
import {Listr} from 'listr2'
import {ListrTaskResult} from 'listr2/dist/interfaces/listr.interface'
import {autoInjectable, inject} from 'tsyringe'
import {join} from "path"
import {TreeService} from "../services"
import {Tree} from "../services"
import {Ctx} from "../services"

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
            views: this.templateDir
        })
    }

    async generate(tree: Tree): Promise<Shell> {
        const args = '--defaults --minimal --skip-git --skip-tests'.split(' ')

        cleanDir(this.tempDir)
        createDir(this.tempDir)

        await execa('ng', ['new', this.name, ...args], {
            stdio: 'ignore',
            cwd: this.tempDir,
        })

        await this.updateMainEntryPoint(tree)

        return this
    }

    buildOrServe = async (ctx: Ctx, tree: Tree, serve?: boolean): Promise<ListrTaskResult<Ctx>> =>
        new Listr([
            {
                title: 'Generate...',
                task: async () => await this.generate(tree)
            },
            {
                title: 'Building...',
                enabled: () => !!!serve,
                task: async () => await execa.command(`${ctx.ngCommand} --output-path=${ctx.outputPath}`, {
                    cwd: this.path,
                })
            },
            {
                title: 'Serving...',
                enabled: () => !!serve,
                task: async () => await execa.command(`${ctx.ngCommand} --output-path=${ctx.outputPath}`, {
                    cwd: this.path,
                })
            },
        ])

    private async updateTsConfig() {
        // todo updateTsConfig()
    }

    private async updateMainEntryPoint(tree: Tree): Promise<void> {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]

        tree.workspaces.map(app => {
            const {modulePath, name} = app.defaultProject
            const isModuleNameRedundant = tree.workspaces.filter(w => w.defaultProject.name === name).length > 1
            const moduleName = isModuleNameRedundant
                ? `${name}_${Md5.hashStr(modulePath)}`
                : name

            appImports.push(`import { AppModule as ${moduleName} } from '${modulePath}'\n`)
            bootstrapModules.push(`platformBrowserDynamic().bootstrapModule(${moduleName}).catch(err => console.error(err))\n`)
        })

        const content = await this.eta.renderFile(this.mainTsTemplate, {appImports, bootstrapModules})

        await writeFile(this.mainTsPath, content)
    }
}
