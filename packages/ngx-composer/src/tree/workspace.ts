import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import { Project } from './project'
import { Package } from './package'
import chalk from 'chalk'

export class Workspace {
    private readonly _defaultProject: Project
    private readonly package: Package

    constructor(private dir: string) {
        const angularJsonPath = join(dir, 'angular.json')
        const { projects, defaultProject } = readJSONSync(angularJsonPath)
        const defaultProjectConfig = projects[defaultProject.toString()]

        if (!defaultProjectConfig) {
            console.error(
                chalk.red(
                    `Missing definition for default project ${chalk.white.bold(defaultProject)} in ${chalk.white.bold(
                        angularJsonPath
                    )}`
                )
            )
            process.exit()
        }

        this._defaultProject = Project.load(defaultProjectConfig, defaultProject, this.dir)
        this.package = Package.load(dir)
    }

    static load = (...args: ConstructorParameters<typeof Workspace>) => new Workspace(...args)

    getPackage = (): Package => this.package
    getDirectory = () => this.dir

    get defaultProject(): Project {
        return this._defaultProject
    }
}

export type Workspaces = Workspace[]
