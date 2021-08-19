import { createDir, tsConfig } from 'utils'
import { writeFile, writeJson } from 'fs-extra'
import { ListrTaskResult } from 'listr2/dist/interfaces/listr.interface'
import { autoInjectable, inject } from 'tsyringe'
import { join } from 'path'
import { TreeService } from 'tree'
import { NgCliService } from 'tools'
import { Ctx } from 'context'
import { existsSync } from 'fs'

@autoInjectable()
export class Shell {
    protected name = 'shell'
    protected tempDir = join(process.env.PWD, 'node_modules', 'ngx-composer', '.cache') // todo replace 'ngx-composer' with var
    protected path = join(this.tempDir, this.name)
    protected templateDir = join(process.cwd(), 'templates')
    protected shellTsConfigPath = join(this.path, 'tsconfig.json')
    protected mainTsPath = join(this.tempDir, this.name, 'src', 'main.ts')
    protected mainTsTemplate = 'main.ts.eta'
    private eta = require('eta')
    private workspaces = this.treeService.getWorkspaces()

    constructor(@inject(TreeService) private treeService: TreeService, @inject(NgCliService) private ng: NgCliService) {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    async serve(ctx: Ctx): Promise<ListrTaskResult<Ctx>> {
        return this.ng.serve(ctx.ngOptions.toArray(), this.path, { stdio: 'inherit' })
    }

    async build(ctx: Ctx) {
        await this.ng.build(['--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], this.path, { stdio: 'inherit' })
    }

    async generate(): Promise<void> {
        const args = ['--defaults', '--minimal', '--skip-git', '--skip-tests']

        if (!existsSync(this.tempDir)) {
            createDir(this.tempDir)
        }

        await this.ng
            .new(this.name, {
                args,
                cwd: this.tempDir,
            })
            .catch(e => new Error('Error preparing shell:\n' + e.message))

        await this.ng.setUnlimitedBudget(this.name, this.path)
        await this.updateMain()
        await this.updateTsConfig()
    }

    private async updateTsConfig(): Promise<void> {
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()

        this.workspaces.map(({ defaultProject: { getWorkspaceDir, getTsConfig } }) => {
            const filePath = getWorkspaceDir()
            const compilerOptionsPaths = getTsConfig().compilerOptions?.paths

            const paths =
                compilerOptionsPaths &&
                Object.entries(compilerOptionsPaths)
                    .map(([name, paths]) => ({ [name]: paths.map(p => join(process.cwd(), filePath, p).toString()) }))
                    .reduce((cur, acc) => ({ ...cur, ...acc }), {})

            shellTsConfig.compilerOptions.paths = { ...shellTsConfig.compilerOptions.paths, ...(paths ?? {}) }
        })

        // todo ngx-composer config?
        // todo merge origin with app config
        // todo write function to adding config props
        shellTsConfig.compilerOptions.allowSyntheticDefaultImports = true
        shellTsConfig.compilerOptions.resolveJsonModule = true

        await writeJson(this.shellTsConfigPath, shellTsConfig, { spaces: '  ' })
    }

    private async updateMain(): Promise<void> {
        const appImports = <string[]>[]
        const bootstrapModules = <string[]>[]

        this.workspaces.map(({ defaultProject: { getName, getModulePath, getWorkspaceDir } }) => {
            const modulePath = getModulePath()
            const moduleName = getWorkspaceDir().replace(/-/g, '/').split('/').concat(getName()).join('_')

            appImports.push(`import { AppModule as ${moduleName} } from '${modulePath}'\n`)
            bootstrapModules.push(`platformBrowserDynamic().bootstrapModule(${moduleName}).catch(err => console.error(err))\n`)
        })

        const content = await this.eta.renderFile(this.mainTsTemplate, {
            appImports,
            bootstrapModules,
        })

        await writeFile(this.mainTsPath, content)
    }
}
