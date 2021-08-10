import {IProject} from "./types/workspace-config"
import {join} from "path"
import {ITsConfig, tsConfig} from "utils"

export class Project {
    public name: string
    public modulePath: string
    private readonly tsConfig: ITsConfig

    constructor(
        private projectConfig: IProject,
        public projectName: string,
        private workspaceDir: string
    ) {
        this.name = projectName
        this.modulePath = join(process.cwd(), workspaceDir, projectConfig.sourceRoot, 'app', 'app.module')
        this.tsConfig = tsConfig.find(workspaceDir, this.projectConfig.architect.build.options.tsConfig)
    }
}
