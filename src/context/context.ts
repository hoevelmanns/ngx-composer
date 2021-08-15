import { autoInjectable } from 'tsyringe'
import { join } from 'path'
import { Argv, Ctx } from './types'
import { removeProps, transformArgOptions } from 'utils'

@autoInjectable()
export class ContextService {
    buildContext = (argv: Argv, builder = <Argv>{}, ...excludeArgs): Ctx => {
        const ctx: Ctx = {
            chunks: [],
            directory: argv.directory,
            singleBundle: argv?.singleBundle !== 'false',
            concurrent: argv?.concurrent !== 'false',
            outputPath: argv?.outputPath ? join(process.cwd(), argv.outputPath) : join(process.cwd(), 'dist'),
        }

        const alias = Object.entries(builder).map(([_, val]) => val['alias'])

        const ngOptions = removeProps(argv, 'exclude', ...alias, ...excludeArgs, ...Object.keys(ctx))

        ctx.ngOptions = transformArgOptions(ngOptions)

        return ctx
    }
}
