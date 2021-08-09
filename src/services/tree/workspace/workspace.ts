import { IProject } from './types/workspace-config'
import { join } from 'path'
import { readJSONSync } from 'fs-extra'

class Project {
    public name: string
    public modulePath: string

    constructor(private projectConfig: IProject, public projectName: string, private workspaceDir: string) {
        this.name = projectName
        this.modulePath = join(process.cwd(), workspaceDir, projectConfig.sourceRoot, 'app', 'app.module')
    }
}

export class Workspace {
    private _defaultProject: Project
    private config: { [key: string]: any }

    constructor(private location: { dir: string; path: string }) {
        this.init()
    }

    init = (): Workspace => {
        this.config = readJSONSync(this.location.path)
        this.config.dir = this.location.dir

        this._defaultProject = new Project(
            this.config.projects[this.config.defaultProject],
            this.config.defaultProject,
            this.location.dir
        )
        return this
    }

    get defaultProject() {
        return this._defaultProject
    }

    get directory() {
        return this.config.dir
    }
}
