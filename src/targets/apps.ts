import { Listr } from 'listr2'
import execa from 'execa'
import { ListrTaskResult } from 'listr2/dist/interfaces/listr.interface'
import { autoInjectable, inject } from 'tsyringe'
import { Ctx, TreeService } from 'services'

@autoInjectable()
export class Apps {
  constructor(@inject(TreeService) private treeService: TreeService) {}

  build = async (ctx: Ctx): Promise<ListrTaskResult<Ctx>> =>
    new Listr(
      this.treeService.workspaces.map(({ directory }) => ({
        title: directory,
        task: async () =>
          execa('ng', ['build', ...ctx.ngOptions.toArray()], {
            cwd: directory,
          }),
      })),
      { concurrent: ctx.concurrent }
    )
}
