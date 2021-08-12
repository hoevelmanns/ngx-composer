interface Argv {
    [key: string]: any
}

export type TransformArgOptions = {
    toString(): string
    toArray(): string[]
    toObject(): Argv
}

export const removeProps = (obj: Argv, ...keys) => keys.map(key => delete obj[<string>key]) && obj

export const transformArgOptions = (argv: Argv): TransformArgOptions => {
    let args = Object.entries(argv)
        .filter(([key]) => !key.match('[$0_-]'))
        .map(([key, val]) => ({
            ['--' + key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLocaleLowerCase()]: val,
        }))
        .reduce((acc, cur) => ({ ...acc, ...cur }), {})

    return {
        toString: (): string => Object.entries(args).flat(1).join(' ').trim(),
        toArray: (): string[] => Object.entries(args).flat(1),
        toObject: (): Argv => args,
    }
}
