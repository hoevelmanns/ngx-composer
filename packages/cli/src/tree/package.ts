import {join} from 'path'
import {readJSONSync} from 'fs-extra'
import {existsSync} from 'fs'
import chalk from 'chalk'
import {mergeJson} from 'merge-packages'

interface IDependency {
    name?: string,
    version?: string,
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
    name = this.content.name
    private dependencies = this.content.dependencies ?? {}
    private devDependencies = this.content.devDependencies ?? {}
    private peerDependencies = this.content.peerDependencies ?? {}

    constructor(public content: PkgJson) {
    }

    static load = (dir: string): Package => {
        const pkgJsonPath = join(dir, 'package.json')

        if (!existsSync(pkgJsonPath)) {
            console.error(chalk.red(`No package.json found at ${dir}`))
            process.exit(1)
        }

        const content = readJSONSync(join(dir, 'package.json'))

        delete content.private

        return new Package(content)
    }

    findDependency(search: string): Dependency {
        const dependency = Object.entries({...this.dependencies, ...this.devDependencies, ...this.peerDependencies})
            .filter(([key]) => key === search)
            .flat(1)

        return dependency ? {
            name: dependency[0],
            version: dependency[1],
        } : {}
    }
}

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
    get merged(): Package {
        // todo error handling
        return new Package(mergeJson(...this.getAll().map(pkg => pkg.content)))
    }
}
