import execa from 'execa'
import { autoInjectable, inject } from 'tsyringe'
import { Ctx, TreeService } from 'services'

@autoInjectable()
export class Apps {
    constructor(@inject(TreeService) private treeService: TreeService) {}

    build = (ctx: Ctx, task) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                task: async () =>
                    await execa('ng', ['build', '--configuration', 'production', ...ctx.ngOptions.toArray()], {
                        cwd: directory,
                    }),
            })),
            { concurrent: true, exitOnError: false, rendererOptions: { collapse: false } }
        )
}
