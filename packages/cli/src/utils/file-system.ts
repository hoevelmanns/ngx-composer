import {existsSync, rmdirSync} from 'fs'
import { mkdirp } from 'fs-extra'

export const cleanDir = async (path: string): Promise<void> => rmdirSync(path, { recursive: true })
export const createDir = async (path: string): Promise<void> => {
    !existsSync(path) && await mkdirp(path)
}
