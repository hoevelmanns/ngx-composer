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
            const message = chalk.red(
                `Missing definition for default project ${chalk.white.bold(defaultProject)} in ${chalk.white.bold(angularJsonPath)}`
            )

            console.error(message)

            process.exit()
        }

        this._defaultProject = Project.load(defaultProjectConfig, defaultProject, this.dir)

        this.package = Package.load(dir)
    }

    static load = (...args: ConstructorParameters<typeof Workspace>) => new Workspace(...args)

    getPackage(): Package {
        return this.package
    }

    getDirectory(): string {
        return this.dir
    }

    get defaultProject(): Project {
        return this._defaultProject
    }
}

export class Workspaces {
    private workspaces: Workspace[] = []

    add(dir: string): void {
        this.workspaces.push(Workspace.load(dir))
    }

    getAll(): Workspace[] {
        return this.workspaces
    }
}
