import { TransformArgOptions } from 'utils'

interface Chunks {
    dir?: string
    name?: string
    size?: number
    gzipSize?: number
}

export type Ctx = {
    chunks?: Chunks[]
    singleBundle?: boolean
    outputPath?: string
    directory?: string
    ngOptions?: TransformArgOptions
    concurrent?: boolean
}
export type Argv = { [key: string]: any }
