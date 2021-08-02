import {execSync} from 'child_process'
import path from 'path'
import {Md5} from 'ts-md5'
import {writeFileSync} from 'fs'
import {Tree} from '../tree'
import {cleanDir, createDir} from "../utils"

export class Shell {
    protected tempPath = path.join(__dirname, '..', '.cache')
    protected appName = 'ShellApp'
    protected templateDir = path.join(process.cwd(), 'templates')
    protected mainTsPath = path.join(this.tempPath, this.appName, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    public appPath = path.join(this.tempPath, this.appName)
    private eta = require('eta')
    private tree: Tree

    constructor() {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir
        })
    }

    generate(tree: Tree): Shell {
        this.tree = tree

        cleanDir(this.tempPath)
        createDir(this.tempPath)

        this.overwriteMainEntryPoint()

        execSync(`ng new ${this.appName} --defaults --minimal --skip-git --skip-tests`, {
            stdio: 'ignore',
            cwd: this.tempPath
        })

        return this
    }

    private overwriteMainEntryPoint(): void {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]

        this.tree.workspaces.map(app => {
            const {modulePath, name} = app.defaultProject
            const moduleName = this.tree.workspaces.filter(w => w.defaultProject.name === name).length > 1
                ? `${name}_${Md5.hashStr(modulePath)}`
                : name

            appImports.push(`import { AppModule as ${moduleName} } from '${modulePath}'\n`)
            bootstrapModules.push(`platformBrowserDynamic().bootstrapModule(${moduleName}).catch(err => console.error(err))\n`)
        })

        this.eta.renderFile(this.mainTsTemplate, {
            appImports,
            bootstrapModules
        }).then(content => writeFileSync(this.mainTsPath, content))
    }
}
