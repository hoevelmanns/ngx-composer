export interface Target {
    run?<T>(argv: Argv): Promise<T | void>
}

export type Argv = {[key: string]: string}
