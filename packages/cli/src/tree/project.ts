import { ProjectConfig } from './types'
import { join } from 'path'
import { tsConfig, TsConfigContent } from 'utils'

export class Project {
    private readonly name: string
    private readonly main: string
    private readonly tsConfig: TsConfigContent
    private readonly appModulePath: string

    constructor(private projectConfig: ProjectConfig, public projectName: string, private workspaceDir: string) {
        this.name = projectName
        this.main = join(process.cwd(), workspaceDir, this.projectConfig.architect.build.options.main).toString()
        this.appModulePath = join(process.cwd(), workspaceDir, this.projectConfig.sourceRoot, 'app/app.module.ts').toString()
        this.tsConfig = tsConfig.find(join(workspaceDir, this.projectConfig.architect.build.options.tsConfig).toString()).getContent()
    }

    static load = (...args: ConstructorParameters<typeof Project>) => new Project(...args)

    getMain = (): string => this.main.replace('.ts', '')
    getName = (): string => this.name
    getTsConfig = (): TsConfigContent => this.tsConfig
    getWorkspaceDir = (): string => this.workspaceDir
    getAppModulePath = (): string => this.appModulePath
    getSourceRoot = (): string => this.projectConfig.sourceRoot
    getRoot = (): string => this.projectConfig.root
}
