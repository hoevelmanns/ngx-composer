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
    ngCommand?: string,
    ngOptions?: string
    concurrent?: boolean,
}
export type Argv = { [key: string]: any }
