import { TsConfigContent } from 'utils'

export interface IProject {
    getName(): string
    getModulePath(): string
    getTsConfig(): TsConfigContent
    getWorkingDir(): string
}
