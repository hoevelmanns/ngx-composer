import { join } from 'path'
import { readJSONSync, writeJson } from 'fs-extra'
import { existsSync } from 'fs'
import chalk from 'chalk'
import { mergeJson } from 'merge-packages'
import { autoInjectable } from 'tsyringe'

interface IDependency {
    name?: string
    version?: string
}

export type Dependency = IDependency
export type Dependencies = Dependency

export interface PkgJson {
    name: string
    dependencies?: Dependencies
    devDependencies?: Dependencies
    peerDependencies?: Dependencies

    [key: string]: any
}

export class Package {
    constructor(private content: PkgJson, private readonly path?: string) {}

    static load = (dir: string): Package => {
        const pkgJsonPath = join(dir, 'package.json')

        if (!existsSync(pkgJsonPath)) {
            console.error(chalk.red(`No package.json found at ${dir}`))
            process.exit(1)
        }

        const content = readJSONSync(join(dir, 'package.json'))

        delete content.private

        return new Package(content, pkgJsonPath)
    }

    findDependency(search: string): Dependency {
        const dependency = Object.entries({
            ...this.content.dependencies,
            ...this.content.devDependencies,
            ...this.content.peerDependencies,
        })
            .filter(([key]) => key === search)
            .flat(1)

        return dependency
            ? {
                  name: dependency[0],
                  version: dependency[1],
              }
            : {}
    }

    getContent(): PkgJson {
        return this.content
    }

    assign(content: PkgJson): Package {
        Object.assign(this.content, content)
        return this
    }

    async write(targetDir?: string): Promise<void> {
        targetDir = targetDir ?? this.path

        if (!targetDir) {
            console.error('You must specify a destination directory to write to a package.json.')
            process.exit(1)
        }

        await writeJson(join(targetDir, 'package.json'), this.content, { spaces: '  ' })
    }
}

@autoInjectable()
export class Packages {
    private packages: Package[] = []

    add(dir: string): void {
        this.packages.push(Package.load(dir))
    }

    getAll(): Package[] {
        return this.packages
    }

    /**
     * Merge the collected packages intelligently (uses the highest compatible version of a dependency)
     */
    merge(): Package {
        // todo error handling
        return new Package(mergeJson(...this.getAll().map(pkg => pkg.getContent())), '')
    }
}
