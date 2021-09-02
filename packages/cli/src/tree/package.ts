import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import { existsSync } from 'fs'
import chalk from 'chalk'

interface PkgJson {
    name: string
    dependencies: { [key: string]: string }
    devDependencies: { [key: string]: string }
    peerDependencies: { [key: string]: string }
    [key: string]: any
}

export interface IPackage {
    load(): IPackage
    getPeerDependencies(): { [key: string]: string }
    getDependencies(): { [key: string]: string }
    getDevDependencies(): { [key: string]: string }
}

export class Package {
    constructor(private pkgJson: PkgJson) {}

    static load = (dir: string): Package => {
        const pkgJsonPath = join(dir, 'package.json')
        if (!existsSync(pkgJsonPath)) {
            console.error(chalk.red(`No package.json found at ${dir}`))
            process.exit(1)
        }
        return new Package(readJSONSync(join(dir, 'package.json')))
    }

    getPeerDependencies = () => this.pkgJson.peerDependencies ?? {}
    getDependencies = () => this.pkgJson.dependencies ?? {}
    getDevDependencies = () => this.pkgJson.devDependencies ?? {}
}

export type Packages = Package[]
