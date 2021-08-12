import { autoInjectable, inject } from 'tsyringe'
import { Ctx, TreeService } from 'services'
import { NgCliService } from 'services'

@autoInjectable()
export class Apps {
    constructor(@inject(TreeService) private treeService: TreeService, @inject(NgCliService) private ng: NgCliService) {}

    ngcc = async (ctx: Ctx, task) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                task: async () => this.ng.cc(directory),
            })),
            { concurrent: false }
        )

    build = (ctx: Ctx, task) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                task: async () => await this.ng.build(ctx.ngOptions.toArray(), directory),
            })),
            { concurrent: true, exitOnError: false }
        )
}
