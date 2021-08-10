import {readJSONSync} from "fs-extra"
import {join} from "path"

export interface ITsConfig {
    find(workingDir: string, configPath: string): TsConfig,
    getContent(): {[key: string]: any},
    getPaths(): {[key: string]: string[]},
    getFilePath(): string
    getWorkingDir(): string
}

class TsConfig {
    private config: {[key:string]: any} // todo interface
    private path: string

    find(workingDir: string, configPath: string): TsConfig {

        const findBaseTsConfig = (p: string): {[key: string]: any} => {
            const config = readJSONSync(p, {throws: false})
            this.path = p
            return config?.extends ? findBaseTsConfig(join(p, '..', config.extends)) : config
        }

        this.config = findBaseTsConfig(join(workingDir, configPath))

        return this
    }

    getContent = () => this.config
    getPaths = () => this.config?.compilerOptions?.paths
    getFilePath = () => this.path
    getWorkingDir = () => join(this.path, '..')
}

export const tsConfig = new TsConfig()
