import { autoInjectable, inject } from 'tsyringe'
import { Ctx, TreeService } from 'services'
import { NgCliService } from 'services'
import { NgPackagrService } from '../services/tools'
import { join } from 'path'

@autoInjectable()
export class Apps {
    constructor(
        @inject(TreeService) private tree: TreeService,
        @inject(NgCliService) private ng: NgCliService,
        @inject(NgPackagrService) private packagr: NgPackagrService
    ) {}

    build = (ctx: Ctx, task) =>
        task.newListr(
            this.tree.getWorkspaces().map(({ directory, defaultProject }) => ({
                title: directory,
                exitOnError: true,
                task: async () =>
                    await this.packagr.build({
                        cwd: directory,
                        tsconfigPath: join(defaultProject.getRoot(), 'tsconfig.app.json').toString(),
                        appModulePath: defaultProject.getModulePath(),
                    }),
            })),
            { concurrent: false, exitOnError: true }
        )
}
