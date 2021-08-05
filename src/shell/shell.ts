import path from 'path'
import {Md5} from 'ts-md5'
import {Tree} from '../tree'
import {cleanDir, createDir} from '../utils'
import execa from 'execa'
import {writeFile} from 'fs-extra'

export class Shell {
    protected tempPath = path.join(__dirname, '..', '.cache')
    protected appName = 'ShellApp'
    protected templateDir = path.join(process.cwd(), 'templates')
    protected mainTsPath = path.join(this.tempPath, this.appName, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    public appPath = path.join(this.tempPath, this.appName)
    private eta = require('eta')

    constructor() {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir
        })
    }

    async generate(tree: Tree): Promise<Shell> { // todo
        cleanDir(this.tempPath)
        createDir(this.tempPath)

        const args = '--defaults --minimal --skip-git --skip-tests'.split(' ')
        await execa('ng', ['new', this.appName, ...args], {
            stdio: 'ignore',
            cwd: this.tempPath,
        })

        await this.overwriteMainEntryPoint(tree)

        return this
    }

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
