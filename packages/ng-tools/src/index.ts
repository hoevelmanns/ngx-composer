import { autoInjectable, singleton } from 'tsyringe'
import execa from 'execa'
import * as cheerio from 'cheerio'
import { readFile, writeFile } from 'fs-extra'
import { join } from 'path'

@autoInjectable()
@singleton()
export class NgCliService {
    private bin = 'ng'

    /**
     * Creates new Angular Workspace
     */
    async new(
        name: string,
        options?: { args: string[]; cwd?: string; options?: execa.Options; packageManager?: 'npm' | 'pnpm' | 'yarn' }
    ): Promise<void> {
        await execa(this.bin, ['new', name, ...(options?.args ?? [])], {
            cwd: options?.cwd ?? process.cwd(),
            ...options?.options,
        })
    }

    /**
     * Builds an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */
    async build(args: string[], cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['build', ...args], {
            cwd,
            ...options,
        })
    }

    /**
     * Serves an angular application
     *
     * @param {string[]} args
     * @param {string} cwd
     * @param {execa.Options} options
     */

    async serve(args: string[], cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['serve', ...args], {
            cwd,
            ...options,
        })
    }

    /**
     * Configures an angular workspace
     *
     * @param {string} jsonPath
     * @param {string} value
     * @param {string} cwd
     * @param {execa.Options} options
     */
    async config(jsonPath: string, value: string, cwd?: string, options?: execa.Options): Promise<void> {
        await execa(this.bin, ['config', '--jsonPath', jsonPath, '--value', value], {
            cwd,
            ...options,
            stdio: 'ignore',
        })
    }

    async setUnlimitedBudget(appName: string, dir: string): Promise<void> {
        await this.config(`projects.${appName}.architect.build.configurations.production.budgets`, '[]', dir)
    }

    async add(pkgName: string, cwd: string): Promise<void> {
        await execa(this.bin, ['add', pkgName, '--skip-confirmation'], { cwd }).catch(null)
    }

    /**
     * Creates a file containing only the dist scripts
     *
     * @param {string} outputPath - the output path
     * @param {string} filename - the target filename
     */
    async createLoaderFile(outputPath: string, filename: string): Promise<void> {
        const encoding = 'utf8'
        const scripts = <string[]>[]
        const indexHtml = await readFile(join(outputPath, 'index.html'), { encoding })
        const $ = cheerio.load(indexHtml)

        $('script, link[rel="stylesheet"]').each((index, elem) => scripts.push($.html(elem)))

        await writeFile(join(outputPath, filename), scripts.join('\n'), { encoding })
    }
}
