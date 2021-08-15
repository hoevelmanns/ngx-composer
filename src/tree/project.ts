import { ProjectConfig } from './types/workspace-config'
import { join } from 'path'
import { tsConfig, TsConfigContent } from 'utils'

export class Project {
    private readonly name: string
    private readonly modulePath: string
    private readonly moduleDistPath: string
    private readonly tsConfig: TsConfigContent

    constructor(private projectConfig: ProjectConfig, public projectName: string, private workspaceDir: string) {
        this.name = projectName
        this.modulePath = join(process.cwd(), workspaceDir, projectConfig.sourceRoot, 'app', 'app.module').toString()
        this.moduleDistPath = join(process.cwd(), workspaceDir, projectConfig.architect.build.options.outputPath).toString()
        this.tsConfig = tsConfig.find(join(workspaceDir, this.projectConfig.architect.build.options.tsConfig)).getContent()
    }

    getModulePath = (): string => this.modulePath
    getModuleDistPath = (): string => this.moduleDistPath
    getName = (): string => this.name
    getTsConfig = (): TsConfigContent => this.tsConfig
    getWorkspaceDir = (): string => this.workspaceDir
    getSourceRoot = (): string => this.projectConfig.sourceRoot
    getRoot = (): string => this.projectConfig.root
}
