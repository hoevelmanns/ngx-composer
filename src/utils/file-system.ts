import { rmdirSync } from 'fs'
import { mkdirpSync } from 'fs-extra'

export const cleanDir = (path: string): void => rmdirSync(path, { recursive: true })
export const createDir = (path: string): void => mkdirpSync(path)
