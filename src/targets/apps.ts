import { autoInjectable, inject } from 'tsyringe'
import { TreeService } from 'tree'
import { NgCliService, NgPackagrService } from 'tools'
import { Ctx } from 'context'

@autoInjectable()
export class Apps {
    private workspaces = this.tree.getWorkspaces()

    constructor(
        @inject(TreeService) private tree: TreeService,
        @inject(NgCliService) private ng: NgCliService,
        @inject(NgPackagrService) private packagr: NgPackagrService
    ) {}

    async build(ctx: Ctx, task) {
        return task.newListr(
            this.workspaces.map(({ directory, defaultProject }) => ({
                title: directory,
                task: async () => {
                    await this.ng.setUnlimitedBudget(defaultProject.getName(), directory) // todo
                    await this.ng.build(ctx.ngOptions.toArray(), directory)
                },
            })),
            { concurrent: false }
        )
    }
}
