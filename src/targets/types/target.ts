export interface Target {
    run<T>(): Promise<T | void>
}
