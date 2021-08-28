import { TransformArgOptions } from 'utils'

interface Chunks {
    dir?: string
    name?: string
    size?: number
    gzipSize?: number
}

export type Ctx = {
    serve?: boolean
    chunks?: Chunks[]
    singleBundle?: boolean
    outputPath: string
    loaderFileName: string
    createLoaderFile: boolean
    directory?: string
    ngOptions: TransformArgOptions
    concurrent?: boolean
    vendorChunk?: boolean
    namedChunks?: boolean
}
export type Argv = { [key: string]: any }
