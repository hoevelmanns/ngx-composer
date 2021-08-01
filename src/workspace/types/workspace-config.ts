export interface IProjectArchitect {
    build: {
        builder: string,
        options: {
            project?: string
            outputPath?: string
            index?: string,
            main?: string,
            polyfills?: string,
            tsConfig?: string,
            assets?: string[],
            styles?: string[],
            scripts?: string[]
        },
        configuration: {
            production: {
                tsConfig: string,
                budgets?: [{
                    type?: string,
                    maximumWarning?: string,
                    maximumError?: string
                }]
            },
            development?: {
                tsConfig: string
            }
        }
        defaultConfiguration?: string
    }
}

export interface IProjectConfig {
    projectType: 'application' | 'library',
    root: string,
    sourceRoot: string
    prefix: string,
    architect: IProjectArchitect
}

export interface IWorkspaceConfig {
    dir?: string
    defaultProject: string,
    projects: {
        [name: string]: IProjectConfig
    }
}
