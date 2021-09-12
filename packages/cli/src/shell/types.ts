import { TransformArgOptions } from 'utils'

export type IConfig = {
    exclude?: string | string[]
    outputPath?: string
    loaderFileName?: string
    createLoaderFile?: boolean
    directory?: string
    ngOptions?: TransformArgOptions
    packageManager?: string
    concurrent?: boolean
    vendorChunk?: boolean
    namedChunks?: boolean
    cliVersion?: string
}
