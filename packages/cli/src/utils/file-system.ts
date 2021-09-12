import { existsSync, rmdirSync } from 'fs'
import { mkdirp } from 'fs-extra'
import { resolve } from 'path'

export const cleanDir = async (path: string): Promise<void> => rmdirSync(path, { recursive: true })
export const createDir = async (path: string): Promise<void> => {
    !existsSync(path) && (await mkdirp(path))
}

export const makeAbsolute = (filepath: string, cwd = process.cwd()) => resolve(cwd, filepath)
