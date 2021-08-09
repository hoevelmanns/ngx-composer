export interface IProjectArchitect {
    build: {
        builder: string
        options: {
            project?: string
            outputPath?: string
            index?: string
            main?: string
            polyfills?: string
            tsConfig?: string
            assets?: string[]
            styles?: string[]
            scripts?: string[]
        }
        configuration: {
            production: {
                tsConfig: string
                budgets?: [
                    {
                        type?: string
                        maximumWarning?: string
                        maximumError?: string
                    }
                ]
            }
            development?: {
                tsConfig: string
            }
        }
        defaultConfiguration?: string
    }
}

export interface IProject {
    projectType: 'application' | 'library'
    root: string
    sourceRoot: string
    prefix: string
    architect: IProjectArchitect
    name: string
}

export interface IWorkspace {
    getProjects(): IProject[]
    defaultProject: IProject
    directory: string
}
