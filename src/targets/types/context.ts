interface Chunks {
    dir?: string
    name?: string
    size?: number
    gzipSize?: number
}

interface Argv {
    [key: string]: string
}

export type Ctx = {
    chunks?: Chunks[]
    singleBuild?: boolean
    outputPath?: string
    source?: string
    buildShellCommand: string
    buildMicroAppsCommand
    ngOptions: Argv
}
