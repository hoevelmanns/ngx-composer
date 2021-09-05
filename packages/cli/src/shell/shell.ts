import { createDir, tsConfig } from 'utils'
import { readJson, writeFile, writeJson } from 'fs-extra'
import { ListrTaskResult } from 'listr2/dist/interfaces/listr.interface'
import { autoInjectable, inject } from 'tsyringe'
import { join } from 'path'
import { TreeService } from 'tree'
import { Ctx } from 'context'
import { existsSync } from 'fs'
import { NgCliService } from '@ngx-composer/ng-tools'
import { mergeJson } from 'merge-packages'
import { name } from '../../package.json'

@autoInjectable()
export class Shell {
    protected readonly name = 'shell'
    protected readonly cacheDir = join(process.env.PWD ?? '', 'node_modules', name, '.cache') // todo replace 'ngx-composer' with var
    protected readonly path = join(this.cacheDir, this.name)
    protected readonly templateDir = join(process.cwd(), 'templates')
    protected readonly shellTsConfigPath = join(this.path, 'tsconfig.json')
    protected readonly mainTsPath = join(this.cacheDir, this.name, 'src', 'main.ts')
    protected readonly mainTsTemplate = 'main.ts.eta'
    private readonly eta = require('eta')
    private readonly workspaces = this.treeService.getWorkspaces()

    constructor(@inject(TreeService) private treeService: TreeService, @inject(NgCliService) private ng: NgCliService) {
        this.eta.configure({
            autoEscape: false,
            views: this.templateDir,
        })
    }

    directoryExists = () => existsSync(this.cacheDir)

    createLoaderFile = async (ctx: Ctx, serve?: boolean) => await this.ng.createLoaderFile(ctx.outputPath, ctx.loaderFileName, serve)

    async generate(): Promise<void> {
        !this.directoryExists() && createDir(this.cacheDir)

        await this.ng
            .new(this.name, {
                args: ['--defaults', '--minimal', '--skip-git', '--skip-tests', '--skip-install'],
                cwd: this.cacheDir,
            })
            .catch(e => new Error('Error preparing shell:\n' + e.message))

        await this.updateMain()
        await this.updateTsConfig()
        await this.updatePackageJson()
        await this.ng.setUnlimitedBudget(this.name, this.path)
        await this.ng.install(this.path)
    }

    async serve(ctx: Ctx): Promise<ListrTaskResult<Ctx>> {
        return this.ng.serve(ctx.ngOptions?.toArray(), this.path, { stdio: 'inherit' })
    }

    async build(ctx: Ctx): Promise<void> {
        await this.ng.build(['--output-path', ctx.outputPath, ...ctx.ngOptions.toArray()], this.path, { stdio: 'inherit' })
    }

    protected async updatePackageJson(): Promise<void> {
        const shellPkgJson = await readJson(join(this.path, 'package.json'))
        const pkgContents = await Promise.all(this.workspaces.map(async ws => await readJson(join(ws.getDirectory(), 'package.json'))))

        pkgContents
            .map(c => delete c.private && delete c.scripts)
            .concat(shellPkgJson)
            .concat()

        const merged = {
            ...mergeJson(...pkgContents),
            ...{ name: this.name, devDependencies: shellPkgJson.devDependencies },
        }

        await writeJson(join(this.path, 'package.json'), merged, { spaces: '  ' })
    }

    protected async updateTsConfig(): Promise<void> {
        const shellTsConfig = tsConfig.find(this.shellTsConfigPath).getContent()

        this.workspaces.forEach(({ defaultProject: { getWorkspaceDir, getTsConfig } }) => {
            const filePath = getWorkspaceDir()
            const compilerOptionsPaths = getTsConfig()?.compilerOptions?.paths

            const paths =
                compilerOptionsPaths &&
                Object.entries(compilerOptionsPaths)
                    .map(([name, paths]) => ({ [name]: paths.map(p => join(process.cwd(), filePath, p).toString()) }))
                    .reduce((cur, acc) => ({ ...cur, ...acc }), {})

            paths && (shellTsConfig.compilerOptions.paths = { ...shellTsConfig.compilerOptions.paths, ...paths })
        })

        shellTsConfig.compilerOptions.paths = {
            ...shellTsConfig.compilerOptions.paths,
            ...{ '@angular/*': ['./node_modules/@angular/*'], '*': ['./node_modules/*'] },
        }

        shellTsConfig.compilerOptions.allowSyntheticDefaultImports = true
        shellTsConfig.compilerOptions.preserveSymlinks = true
        shellTsConfig.compilerOptions.resolveJsonModule = true

        await writeJson(this.shellTsConfigPath, shellTsConfig, { spaces: '  ' })
    }

    protected async updateMain(): Promise<void> {
        const apps = this.workspaces.map(({ defaultProject }) => `export * from '${defaultProject.getMain()}'\n`)
        const content = await this.eta.renderFile(this.mainTsTemplate, { apps })

        await writeFile(this.mainTsPath, content)
    }
}
