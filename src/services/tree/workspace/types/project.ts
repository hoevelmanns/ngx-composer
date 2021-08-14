import { TsConfigContent } from 'utils'

export interface IProject {
    getName(): string
    getModulePath(): string
    getModuleDistPath(): string
    getTsConfig(): TsConfigContent
    getWorkingDir(): string
    getSourceRoot(): string
    getRoot(): string
}
