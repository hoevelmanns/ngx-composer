import { join } from 'path'
import { readJSONSync } from 'fs-extra'
import {Project} from "./project"

export class Workspace {
    private _defaultProject: Project
    private angularConfig: { [key: string]: any }

    constructor(private dir: string) {
        this.init()
    }


    init = (): Workspace => {
        this.angularConfig = readJSONSync(join(this.dir, 'angular.json'))

        this._defaultProject = new Project(
            this.angularConfig.projects[this.angularConfig.defaultProject],
            this.angularConfig.defaultProject,
            this.dir
        )

        return this
    }

    get defaultProject() {
        return this._defaultProject
    }

    get directory() {
        return this.dir
    }
}
