import {Ctx} from "../targets/types"
import {Tree} from "../tree"
import {Listr} from "listr2"
import execa from "execa"
import {ListrTaskResult} from "listr2/dist/interfaces/listr.interface"

export class Apps {
    build = async (ctx: Ctx, tree: Tree): Promise<ListrTaskResult<Ctx>> =>
        new Listr(tree.workspaces.map(({config}) => ({
            title: `${config.dir}`,
            task: async () => await execa.command(ctx.buildCommand, {cwd: config.dir})
        })), {concurrent: ctx.concurrent})
}
