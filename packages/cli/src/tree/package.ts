import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import { existsSync } from 'fs'
import chalk from 'chalk'
import { mergeJson } from 'merge-packages'

export interface PkgJson {
    name: string
    dependencies?: { [key: string]: string }
    devDependencies?: { [key: string]: string }
    peerDependencies?: { [key: string]: string }
    [key: string]: any
}

export class Package {
    constructor(public content: PkgJson) {}

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

    getPeerDependencies() {
        return this.content.peerDependencies ?? {}
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
    merged(): PkgJson {
        return mergeJson(...this.getAll().map(pkg => pkg.content))
    }
}
