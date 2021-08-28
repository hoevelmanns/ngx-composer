export interface IProjectArchitect {
    build: {
        builder: string
        options: {
            project?: string
            outputPath?: string
            index?: string
            main: string
            polyfills?: string
            tsConfig: string
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

export interface ProjectConfig {
    projectType: 'application' | 'library'
    root: string
    sourceRoot: string
    prefix: string
    architect: IProjectArchitect
    name: string
}
