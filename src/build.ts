import {Tree} from './tree'
import {execSync} from 'child_process'
import path from 'path'
import {writeFileSync} from 'fs'
import {Listr} from 'listr2'
import chalk from 'chalk'
import {Md5} from 'ts-md5'
import {helpers} from './helpers'

/**
 * TODO Rename "Build" to "Commands" and add "serve" target
 */
export class Build {
    protected tempPath = path.join(__dirname, '..', '.cache')
    protected shellAppName = 'ShellApp'
    protected templateDir = path.join(process.cwd(), 'templates')
    protected mainTsPath = path.join(this.tempPath, this.shellAppName, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    private shellAppPath = path.join(this.tempPath, this.shellAppName)
    private tree: Tree
    private eta = require('eta')
    private argv: any

    constructor() {
        this.tree = new Tree()
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir
        })
    }

    async run(argv?: any): Promise<void> {
        this.tree.init(argv.source)
        this.argv = argv

        try {
            await new Listr([{
                title: 'Preparing angular build...',
                options: {showTimer: true},
                task: async () => this
                    .generateShellApp()
                    .overwriteMainEntryPoint()
            }])
                .run()
                .then(this.runNgBuild)
                .then(() => console.log(chalk.red('READY -> TODO show report')))

        } catch (e: unknown) {
            console.log(e['signal'] === 'SIGINT' ? chalk.cyan('Aborted by user.') : e)
        }
    }

    private generateShellApp = (): Build => {
        helpers.cleanDir(this.tempPath)
        helpers.createDir(this.tempPath)

        execSync(`ng new ${this.shellAppName} --defaults --minimal --skip-git --skip-tests`, {
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

    private runNgBuild = (): void => {
        const {getArgOptions, removeProps, argOptionsToString} = helpers
        const options = getArgOptions(removeProps(this.argv, 'source'))

        options?.outputPath && (options.outputPath = path.join(process.cwd(), options.outputPath))

        execSync(`ng build ${argOptionsToString(options)}`, {
            cwd: this.shellAppPath,
            stdio: 'inherit'
        })
    }
}

export default new Build()
