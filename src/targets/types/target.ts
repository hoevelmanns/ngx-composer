export type Argv = { [key: string]: any }

export interface Target {
    run?<T>(argv: Argv): Promise<T | void>
}
