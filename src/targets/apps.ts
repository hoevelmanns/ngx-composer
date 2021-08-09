import execa from 'execa'
import { autoInjectable } from 'tsyringe'
import { Ctx, Tree } from 'services'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'
import chalk from 'chalk'

@autoInjectable()
export class Apps {
    ngcc = async (ctx: Ctx, tree: Tree, task: TaskWrapper<any, any>) =>
        task.newListr(
            tree.workspaces.map(({ directory }) => ({
                title: directory,
                task: async () =>
                    await execa.command('node_modules/.bin/ngcc --properties es2015 browser module main', {
                        cwd: directory,
                    }),
            })),
            { concurrent: true }
        )

    build = async (ctx: Ctx, tree: Tree, task: TaskWrapper<any, any>) =>
        task.newListr(
            tree.workspaces.map(({ directory }) => ({
                title: directory,
                task: async (ctx: Ctx, task) =>
                    await execa('ng', ['build', ...ctx.ngOptions.toArray()], {
                        cwd: directory,
                    }).catch(e => {
                        // todo search for ngcc lockfile error in message
                        throw new Error(chalk.red('Failed: ') + `${chalk.bold(task.title)}\n` + e)
                    }),
            })),
            { concurrent: true }
        )
}
