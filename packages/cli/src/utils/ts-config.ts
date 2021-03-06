import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import stripJsonComments from 'strip-json-comments'

export interface TsConfigContent {
    angularCompilerOptions: {
        enableIvy: boolean
    }
    files: {}
    compilerOptions: {
        allowSyntheticDefaultImports?: boolean
        preserveSymlinks?: boolean
        resolveJsonModule?: boolean
        rootDir?: string
        paths: { [key: string]: string[] }
        baseUrl?: string
        [key: string]: any
    }
}

class TsConfig {
    private config = {} as TsConfigContent
    private path = ''

    find(configPath: string): TsConfig {
        const findBaseTsConfig = (path: string): TsConfigContent => {
            if (!existsSync(path)) {
                return <TsConfigContent>{}
            }
            this.path = path
            const config = JSON.parse(stripJsonComments(readFileSync(path, { encoding: 'utf-8' }))) // todo validate tsconfig.json
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

export interface ITsConfig {
    find(workDir: string, configPath: string): TsConfig

    getContent(): { [key: string]: any }

    getPaths(): { [key: string]: string[] }

    getFilePath(): string

    getWorkDir(): string
}
