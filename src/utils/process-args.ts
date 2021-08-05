interface Argv {
    [key: string]: any
}

export const removeProps = (obj: Argv, ...keys) => keys.map(key => delete obj[<string>key]) && obj

export const transformArgOptions = (argv: Argv) => {
    let args = Object.entries(argv)
        .filter(([key]) => !key.match('[$0_-]'))
        .map(([key, val]) => ({[key]: val}))
        .reduce((acc, cur) => ({...acc, ...cur}), {})

    return {
        toString: (): string => Object.entries(args)
            .map(([key, val]) => `--${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLocaleLowerCase()} ${val}`)
            .join(' ').trim(),
        toObject: (): Argv => args
    }
}
