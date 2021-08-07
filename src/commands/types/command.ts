export type Argv = { [key: string]: any }

export interface Command {
    run<T>(argv: Argv): Promise<T | void>
}
