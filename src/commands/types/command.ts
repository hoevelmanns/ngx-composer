import {CommandBuilder} from "yargs"

export type Argv = { [key: string]: any }

export interface Command {
    run<T>(argv: Argv, builder: CommandBuilder): Promise<T | void>
}
