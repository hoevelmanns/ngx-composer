import execa from 'execa'
import { autoInjectable, inject } from 'tsyringe'
import { Ctx, TreeService } from 'services'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'

@autoInjectable()
export class Apps {
    constructor(@inject(TreeService) private treeService: TreeService) {}

    ngcc = async (ctx: Ctx, task: TaskWrapper<any, any>) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                task: async () => execa.command('node_modules/.bin/ngcc', { cwd: directory }),
            })),
            { concurrent: false }
        )

    build = async (ctx: Ctx, task: TaskWrapper<any, any>) =>
        task.newListr(
            this.treeService.getWorkspaces().map(({ directory }) => ({
                title: directory,
                task: async (ctx: Ctx) =>
                    execa('ng', ['build', '--configuration', 'production', ...ctx.ngOptions.toArray()], {
                        cwd: directory,
                    }) /*.catch(e => {
                        throw new Error(chalk.red('Failed: ') + `${chalk.bold(task.title)}\n` + e)
                    }),*/,
            })),
            { concurrent: true }
        )
}
