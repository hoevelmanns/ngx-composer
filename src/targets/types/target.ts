export interface ITarget {
    run(): Promise<void>
    execute(): void
}
