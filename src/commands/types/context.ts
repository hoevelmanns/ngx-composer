interface Chunks {
    dir?: string
    name?: string
    size?: number
    gzipSize?: number
}

export type Ctx = {
    chunks?: Chunks[]
    singleBuild?: boolean
    outputPath?: string
    directory?: string
    buildCommand?: string
    ngOptions?: string
    concurrent?: boolean,
}
