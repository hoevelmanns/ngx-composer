import execa from 'execa'
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
                task: async () => {
                    // todo NgCompilerService
                    await execa('node_modules/.bin/ngcc', ['--properties', 'es2015', 'browser', 'module', 'main'], {
                        cwd: directory,
                    })
                },
            })),
            { concurrent: false }
        )

    build = (ctx: Ctx, task) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                // retry: 30, // todo decrease retry?
                task: async () => await this.ng.build(ctx.ngOptions.toArray(), directory),
            })),
            { concurrent: true, exitOnError: false, rendererOptions: { collapse: false } }
        )
}
