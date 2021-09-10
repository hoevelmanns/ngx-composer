import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import { Project } from './project'
import { Package } from './package'
import chalk from 'chalk'

/**
 * The Angular Workspace
 */
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

    /**
     * Gets the package.json of a workspace
     */
    getPackage(): Package {
        return this.package
    }

    /**
     * Gets the Workspace directory
     */
    getDirectory(): string {
        return this.dir
    }

    /**
     * Gets the angular default project specified in angular.json -> "defaultProject"
     */
    get defaultProject(): Project {
        return this._defaultProject
    }
}

export class Workspaces {
    private workspaces: Workspace[] = []

    /**
     * Adds the workspace by given directory
     *
     * @param {string} dir - The directory of a workspace
     */
    add(dir: string): void {
        this.workspaces.push(Workspace.load(dir))
    }

    /**
     * Gets all workspaces
     */
    getAll() {
        return this.find()
    }

    /**
     * Finds all projects in a workspace or by default project name
     *
     * @param {string} name - The name of the default project in the workspace
     */
    find(name?: string): Workspace[] {
        return name
            ? this.workspaces.filter(ws => ws.defaultProject.getName() === name) ?? []
            : this.workspaces
    }
}
