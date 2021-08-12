import { readJSONSync } from 'fs-extra'
import { join } from 'path'
import { readFileSync, readSync } from 'fs'
import stripJsonComments from 'strip-json-comments'

export interface ITsConfig {
    find(workingDir: string, configPath: string): TsConfig

    getContent(): { [key: string]: any }

    getPaths(): { [key: string]: string[] }

    getFilePath(): string

    getWorkDir(): string
}

export interface TsConfigContent {
    angularCompilerOptions: {
        enableIvy: boolean
    }
    compilerOptions: {
        resolveJsonModule: boolean
        rootDir: ''
        paths: { [key: string]: string[] }
        baseUrl: string
        [key: string]: any
    }
}

class TsConfig {
    private config: TsConfigContent
    private path: string

    find(configPath: string): TsConfig {
        const findBaseTsConfig = (path: string): TsConfigContent => {
            this.path = path
            const config = JSON.parse(stripJsonComments(readFileSync(path, { encoding: 'utf-8' })))
            return config?.extends ? findBaseTsConfig(join(path, '..', config.extends)) : config
        }

        this.config = findBaseTsConfig(configPath)

        return this
    }

    getContent = (): TsConfigContent => this.config
    getPaths = () => this.config?.compilerOptions?.paths
    getFilePath = () => this.path
    getWorkingDir = () => join(this.path, '..')
}

export const tsConfig = new TsConfig()
