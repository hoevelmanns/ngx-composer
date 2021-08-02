export interface Target {
    run?<T>(): Promise<T | void>
    init(): any // todo
}
