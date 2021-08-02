import {rmdirSync} from 'fs'
import {mkdirpSync} from 'fs-extra'

class Helpers {
    static removeProps = (obj: string[], ...keys) => keys.map(key => delete obj[<string>key]) && obj

    static getArgOptions = (argv: any): any =>
        Object.entries(argv)
            .filter(([key]) => !key.match('[$0_-]'))
            .map(([key, val]) => ({[key]: val}))
            .reduce((acc, cur) => ({...acc, ...cur}))

    static argOptionsToString = (argv: { [key: string]: string }) =>
        Object.entries(argv).map(([key, val]) => `--${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLocaleLowerCase()} ${val}`).join(' ').trim()

    static cleanDir = (path: string): void => rmdirSync(path, {recursive: true})

    static createDir = (path: string): void => mkdirpSync(path)
}

export const helpers = Helpers
