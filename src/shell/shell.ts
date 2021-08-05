import path from 'path'
import {Md5} from 'ts-md5'
import {Tree} from '../tree'
import {cleanDir, createDir} from '../utils'
import execa from 'execa'
import {writeFile} from 'fs-extra'
import {Ctx} from "../targets/types"
import {Listr} from "listr2"
import {ListrTaskResult} from "listr2/dist/interfaces/listr.interface"

export class Shell {
    protected name = 'shell'
    protected tempDir = path.join(__dirname, '..', '.cache')
    protected path = path.join(this.tempDir, this.name)
    protected templateDir = path.join(process.cwd(), 'templates')
    protected mainTsPath = path.join(this.tempDir, this.name, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    private eta = require('eta')

    constructor() {
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

        await this.overwriteMainEntryPoint(tree)

        return this
    }

    build = async (ctx: Ctx, tree: Tree): Promise<ListrTaskResult<Ctx>> =>
        new Listr([
            {
                title: 'Generate...',
                task: async () => await this.generate(tree)
            },
            {
                title: 'Building...',
                task: async () => await execa.command(`${ctx.buildCommand} --output-path=${ctx.outputPath}`, {
                    cwd: this.path,
                })
            }
        ])

    private async overwriteMainEntryPoint(tree: Tree): Promise<void> {
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
