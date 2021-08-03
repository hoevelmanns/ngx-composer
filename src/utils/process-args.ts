export const removeProps = (obj: { [key: string]: string }, ...keys) => keys.map(key => delete obj[<string>key]) && obj

export const getArgOptions = (argv: any): any => {
    const args = Object.entries(argv)
        .filter(([key]) => !key.match('[$0_-]'))
        .map(([key, val]) => ({[key]: val}))

    return args.length > 0 ? args.reduce((acc, cur) => ({...acc, ...cur})) : {}
}

export const argOptionsToString = (argv: { [key: string]: string }) =>
    Object.entries(argv).map(([key, val]) => `--${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLocaleLowerCase()} ${val}`).join(' ').trim()
