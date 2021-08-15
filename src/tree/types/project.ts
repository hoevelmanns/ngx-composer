import { TsConfigContent } from 'utils'

export interface IProject {
    getName(): string
    getModulePath(): string
    getModuleDistPath(): string
    getTsConfig(): TsConfigContent
    getWorkspaceDir(): string
    getSourceRoot(): string
    getRoot(): string
}
