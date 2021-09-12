import { singleton } from 'tsyringe'
import { makeAbsolute, removeProps, TransformArgOptions, transformArgOptions } from 'utils'
import { IConfig } from './types'

@singleton()
export class Config {
    protected data = <IConfig>{}

    init(argv?: { [key: string]: any }, ...excludeArgs): Config {
        const { directory, concurrent, outputPath, loaderFileName, createLoaderFile, exclude } = <IConfig>argv

        this.data = {
            exclude,
            directory,
            concurrent,
            outputPath: makeAbsolute(outputPath ?? 'dist'),
            loaderFileName,
            createLoaderFile,
            ngOptions: <TransformArgOptions>{},
        }

        const ngOptions = removeProps(argv ?? [], ...excludeArgs, ...Object.keys(this.data))

        this.data.ngOptions = transformArgOptions(ngOptions)

        return this
    }

    get(): IConfig {
        return this.data
    }
}
