import {IWorkspaceConfig} from './types'
import {readJSONSync} from 'fs-extra'
import {IProjectConfig} from './types/workspace-config'
import {join} from "path"

class Project {
    public name: string
    public modulePath: string

    constructor(
        private projectConfig: IProjectConfig,
        public projectName: string,
        private workspaceDir: string
    ) {
        this.name = projectName
        this.modulePath = join(process.cwd(), workspaceDir, projectConfig.sourceRoot, 'app', 'app.module')
    }
}

export class Workspace {
    public defaultProject: Project
    public config: IWorkspaceConfig

    constructor(private location: { dir: string, path: string }) {
        this.init()
    }

    init = (): Workspace => {
        this.config = readJSONSync(this.location.path)
        this.config.dir = this.location.dir

        this.defaultProject = new Project(
            this.config.projects[this.config.defaultProject],
            this.config.defaultProject,
            this.location.dir
        )
        return this
    }
}
