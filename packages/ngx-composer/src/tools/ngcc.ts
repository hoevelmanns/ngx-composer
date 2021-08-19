import * as fg from 'fast-glob'
import { join } from 'path'
import { rm } from 'fs-extra'
import execa from 'execa'

export const removeNgccLockFiles = async () =>
    await fg(join(process.cwd(), 'node_modules/**/__ngcc_lock_file__')).then(files => files.map(async lockFile => await rm(lockFile)))

export const ngcc = async (params?: { cwd?: string; options?: execa.Options }): Promise<void> => {
    await execa(join(process.cwd(), 'node_modules/.bin/ngcc'.toString()), ['--properties', 'es2015', 'browser', 'module', 'main'], {
        cwd: params?.cwd ?? process.cwd(),
        ...params?.options,
    })
}
