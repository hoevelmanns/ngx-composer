import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import { Project } from './project'
import { Package } from './package'

export class Workspace {
    private readonly _defaultProject: Project
    private readonly package: Package

    constructor(private dir: string) {
        const { projects, defaultProject } = readJSONSync(join(dir, 'angular.json'))
        this.package = Package.load(dir)
        this._defaultProject = Project.load(projects[defaultProject.toString()], defaultProject, this.dir)
    }

    static load = (...args: ConstructorParameters<typeof Workspace>) => new Workspace(...args)

    getPackage = (): Package => this.package
    getDirectory = () => this.dir

    get defaultProject(): Project {
        return this._defaultProject
    }
}

export type Workspaces = Workspace[]
